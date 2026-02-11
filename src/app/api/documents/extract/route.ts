// API Route pour l'extraction structurée de données financières depuis documents
// Accepte 1-5 fichiers (PDF, Excel, images), extrait via Claude, valide et retourne du JSON structuré

import { NextRequest, NextResponse } from 'next/server'
import { anthropic, isAnthropicConfigured } from '@/lib/anthropic'
import { extractPdfText } from '@/lib/documents/pdf-parser'
import { parseExcel } from '@/lib/documents/excel-parser'
import { isScannedPdf, pdfToImages, type PdfPageImage } from '@/lib/documents/pdf-vision'
import {
  optionalAuth,
  checkRateLimit,
  getRateLimitHeaders,
  validateUploadedFile,
  MAX_FILE_SIZE,
} from '@/lib/security'
import { checkEvaluationAccess, incrementDocumentCount } from '@/lib/usage/evaluations'
import {
  findSessionBySiren,
  addDocumentToSession,
  updateDocumentAnalysis,
} from '@/lib/ai'

// ── Types ──

interface ExerciceData {
  annee: number
  ca: number | null
  resultat_exploitation: number | null
  resultat_net: number | null
  ebitda: number | null
  dotations_amortissements: number | null
  dotations_provisions: number | null
  charges_personnel: number | null
  effectif_moyen: number | null
  remuneration_dirigeant: number | null
  loyers: number | null
  credit_bail: number | null
  capitaux_propres: number | null
  dettes_financieres: number | null
  tresorerie: number | null
  total_actif: number | null
  actif_immobilise: number | null
  stocks: number | null
  creances_clients: number | null
  dettes_fournisseurs: number | null
}

interface ExtractionMetadata {
  source_documents: string[]
  completeness_score: number
  missing_critical: string[]
  warnings: string[]
}

interface ExtractionResult {
  exercices: ExerciceData[]
  metadata: ExtractionMetadata
}

interface FileError {
  error: string
  fichier: string
}

// ── Config ──

const MAX_FILES = 5
const TIMEOUT_PER_DOCUMENT_MS = 60_000

// Types MIME acceptés (PDF + Excel + images)
const ALLOWED_EXTRACT_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'image/jpeg',
  'image/png',
]

const EXCEL_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
]

const IMAGE_TYPES = ['image/jpeg', 'image/png']

// ── Prompt d'extraction ──

const EXTRACTION_PROMPT = `Tu es un expert-comptable. Extrais les données financières structurées de ces documents comptables.

Retourne UNIQUEMENT un JSON avec les champs suivants (null si non trouvé) :

{
  "exercices": [
    {
      "annee": 2024,
      "ca": number | null,
      "resultat_exploitation": number | null,
      "resultat_net": number | null,
      "ebitda": number | null,
      "dotations_amortissements": number | null,
      "dotations_provisions": number | null,
      "charges_personnel": number | null,
      "effectif_moyen": number | null,
      "remuneration_dirigeant": number | null,
      "loyers": number | null,
      "credit_bail": number | null,
      "capitaux_propres": number | null,
      "dettes_financieres": number | null,
      "tresorerie": number | null,
      "total_actif": number | null,
      "actif_immobilise": number | null,
      "stocks": number | null,
      "creances_clients": number | null,
      "dettes_fournisseurs": number | null
    }
  ],
  "metadata": {
    "source_documents": ["bilan_2024.pdf", "bilan_2023.pdf"],
    "completeness_score": number (0-100),
    "missing_critical": ["remuneration_dirigeant", "credit_bail"],
    "warnings": ["Exercice 2024 incomplet — clôture en cours ?"]
  }
}

Règles :
- Tous les montants en euros (pas de milliers/millions abrégés)
- Si un document contient plusieurs exercices (N et N-1), extrais les deux
- L'EBITDA = Résultat d'exploitation + Dotations aux amortissements + Dotations aux provisions
- Si l'EBITDA n'est pas explicite, calcule-le à partir des composantes disponibles
- completeness_score : 80+ si CA + résultat net + capitaux propres sont présents
- missing_critical : liste les champs importants pour une évaluation qui manquent
- RETOURNE UNIQUEMENT LE JSON, SANS MARKDOWN, SANS COMMENTAIRE`

// ── Route ──

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const user = await optionalAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    // 2. Rate limiting
    const rateLimitResult = await checkRateLimit(user.id, 'documentUpload')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    // 3. API check
    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible' },
        { status: 503 }
      )
    }

    // 4. Parse FormData
    const formData = await request.formData()
    const evaluationId = formData.get('evaluationId') as string | null
    const siren = formData.get('siren') as string | null

    // Collect all files from FormData (supports 'files' and 'file' keys)
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
      if ((key === 'files' || key === 'file') && value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} fichiers autorisés` },
        { status: 400 }
      )
    }

    // 5. Check upload rights
    if (siren && user.id) {
      const evalAccess = await checkEvaluationAccess(user.id, siren)
      if (!evalAccess.canUploadDocuments) {
        return NextResponse.json(
          {
            error: "L'upload de documents nécessite une évaluation complète (79€) ou un abonnement Pro.",
            code: 'UPLOAD_NOT_ALLOWED',
          },
          { status: 403 }
        )
      }
    }

    // 6. Validate all files upfront
    const fileErrors: FileError[] = []
    const validFiles: { file: File; buffer: Buffer }[] = []

    for (const file of files) {
      // Size check
      if (file.size > MAX_FILE_SIZE) {
        fileErrors.push({
          error: 'format_non_supporte',
          fichier: file.name,
        })
        continue
      }

      // MIME type check
      if (!ALLOWED_EXTRACT_TYPES.includes(file.type)) {
        fileErrors.push({
          error: 'format_non_supporte',
          fichier: file.name,
        })
        continue
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Magic bytes validation (skip for images — handled by MIME)
      if (!IMAGE_TYPES.includes(file.type)) {
        const validation = validateUploadedFile(file, buffer, {
          allowedTypes: ALLOWED_EXTRACT_TYPES,
        })
        if (!validation.valid) {
          fileErrors.push({
            error: 'format_non_supporte',
            fichier: file.name,
          })
          continue
        }
      }

      validFiles.push({ file, buffer })
    }

    if (validFiles.length === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier valide', details: fileErrors },
        { status: 400 }
      )
    }

    // 7. Extract content from each file
    const documentContents: { name: string; content: string; isVision: boolean; images?: PdfPageImage[] }[] = []

    for (const { file, buffer } of validFiles) {
      try {
        if (IMAGE_TYPES.includes(file.type)) {
          // Image → Claude Vision direct
          const base64 = buffer.toString('base64')
          const mediaType = file.type as 'image/jpeg' | 'image/png'
          documentContents.push({
            name: file.name,
            content: '',
            isVision: true,
            images: [{
              pageNumber: 1,
              base64,
              width: 0,
              height: 0,
            }],
          })
          // Store media type for later use
          ;(documentContents[documentContents.length - 1] as { mediaType?: string }).mediaType = mediaType

        } else if (file.type === 'application/pdf') {
          // PDF: check if scanned
          const scanCheck = await isScannedPdf(buffer)

          if (scanCheck.isScanned) {
            console.log(`[Extract] PDF scanné: ${file.name} (${scanCheck.pageCount} pages, ${scanCheck.avgCharsPerPage} chars/page)`)
            const images = await pdfToImages(buffer, 15, 1.5)
            documentContents.push({
              name: file.name,
              content: '',
              isVision: true,
              images,
            })
          } else {
            const text = await extractPdfText(buffer)
            if (text.length < 50) {
              fileErrors.push({ error: 'document_illisible', fichier: file.name })
              continue
            }
            documentContents.push({ name: file.name, content: text, isVision: false })
          }

        } else if (EXCEL_TYPES.includes(file.type)) {
          // Excel/CSV
          const excelData = parseExcel(buffer)
          if (!excelData.summary || excelData.totalRows === 0) {
            fileErrors.push({ error: 'document_illisible', fichier: file.name })
            continue
          }
          documentContents.push({ name: file.name, content: excelData.summary, isVision: false })

        } else {
          // Fallback: read as text
          const text = await file.text()
          documentContents.push({ name: file.name, content: text, isVision: false })
        }
      } catch (err) {
        console.error(`[Extract] Erreur traitement ${file.name}:`, err)
        fileErrors.push({ error: 'document_illisible', fichier: file.name })
      }
    }

    if (documentContents.length === 0) {
      return NextResponse.json(
        { error: 'Aucun document exploitable', details: fileErrors },
        { status: 422 }
      )
    }

    // 8. Build Claude request — combine all documents into one request
    const hasVisionContent = documentContents.some(d => d.isVision)

    type TextBlock = { type: 'text'; text: string }
    type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png'; data: string } }
    type ContentBlock = TextBlock | ImageBlock

    const userContent: ContentBlock[] = []

    // Add text documents
    const textDocs = documentContents.filter(d => !d.isVision)
    if (textDocs.length > 0) {
      const combined = textDocs
        .map(d => `=== Document : ${d.name} ===\n\n${d.content.substring(0, 40_000)}`)
        .join('\n\n---\n\n')
      userContent.push({ type: 'text', text: combined })
    }

    // Add vision documents (images)
    const visionDocs = documentContents.filter(d => d.isVision)
    for (const doc of visionDocs) {
      userContent.push({
        type: 'text',
        text: `=== Document (image/scan) : ${doc.name} ===`,
      })
      if (doc.images) {
        const docWithMedia = doc as { mediaType?: string }
        for (const img of doc.images) {
          userContent.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: (docWithMedia.mediaType as 'image/jpeg' | 'image/png') || 'image/jpeg',
              data: img.base64,
            },
          })
        }
      }
    }

    // Final instruction
    userContent.push({
      type: 'text',
      text: `Extrais les données financières de ${documentContents.length === 1 ? 'ce document' : `ces ${documentContents.length} documents`}. Retourne UNIQUEMENT le JSON demandé.`,
    })

    // 9. Call Claude with timeout
    console.log(`[Extract] Envoi à Claude: ${documentContents.length} doc(s), vision=${hasVisionContent}`)

    const timeoutMs = Math.min(documentContents.length * TIMEOUT_PER_DOCUMENT_MS, 120_000)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    let response
    try {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: EXTRACTION_PROMPT,
        messages: [{
          role: 'user',
          content: hasVisionContent ? userContent : userContent[0].type === 'text' ? userContent[0].text : userContent,
        }],
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return NextResponse.json(
          { error: 'Timeout: extraction trop longue', details: fileErrors },
          { status: 504 }
        )
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }

    // 10. Parse JSON response
    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    let extraction: ExtractionResult
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      extraction = JSON.parse(jsonMatch[0])
    } catch {
      console.error('[Extract] Erreur parsing JSON:', responseText.substring(0, 500))
      return NextResponse.json({
        error: 'extraction_failed',
        message: 'Impossible de structurer les données extraites',
        raw: responseText.substring(0, 2000),
        fileErrors,
      }, { status: 422 })
    }

    // 11. Validate & enrich
    extraction = validateAndEnrich(extraction, documentContents.map(d => d.name))

    // Add file processing errors to warnings
    if (fileErrors.length > 0) {
      extraction.metadata.warnings.push(
        ...fileErrors.map(e => `${e.fichier}: ${e.error}`)
      )
    }

    // 12. Update session & evaluation in DB (non-blocking)
    updateSessionAndEvaluation({
      siren,
      evaluationId,
      extraction,
      documentContents,
      validFiles,
    }).catch(err => console.error('[Extract] Erreur mise à jour session:', err))

    // 13. Return
    console.log(`[Extract] Succès: ${extraction.exercices.length} exercice(s), score=${extraction.metadata.completeness_score}`)

    return NextResponse.json({
      ...extraction,
      fileErrors: fileErrors.length > 0 ? fileErrors : undefined,
    })

  } catch (error) {
    console.error('[Extract] Erreur:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'extraction des données" },
      { status: 500 }
    )
  }
}

// ── Validation & enrichissement ──

function validateAndEnrich(extraction: ExtractionResult, fileNames: string[]): ExtractionResult {
  // Ensure structure
  if (!Array.isArray(extraction.exercices)) {
    extraction.exercices = []
  }

  if (!extraction.metadata) {
    extraction.metadata = {
      source_documents: fileNames,
      completeness_score: 0,
      missing_critical: [],
      warnings: ['Structure de réponse incomplète'],
    }
  }

  // Ensure source_documents is set
  if (!extraction.metadata.source_documents || extraction.metadata.source_documents.length === 0) {
    extraction.metadata.source_documents = fileNames
  }

  const warnings: string[] = [...(extraction.metadata.warnings || [])]
  const missingCritical: string[] = []

  for (const exercice of extraction.exercices) {
    // Coherence: CA should be positive if present
    if (exercice.ca !== null && exercice.ca <= 0) {
      warnings.push(`Exercice ${exercice.annee}: CA négatif ou nul (${exercice.ca}€) — vérifier`)
    }

    // Coherence: total actif ≈ total passif (capitaux propres + dettes)
    if (exercice.total_actif !== null && exercice.capitaux_propres !== null && exercice.dettes_financieres !== null) {
      const passifEstime = exercice.capitaux_propres + exercice.dettes_financieres
      const ecart = Math.abs(exercice.total_actif - passifEstime) / exercice.total_actif
      if (ecart > 0.30) {
        warnings.push(
          `Exercice ${exercice.annee}: écart actif/passif de ${(ecart * 100).toFixed(0)}% — les dettes fournisseurs et autres passifs ne sont pas inclus dans le calcul`
        )
      }
    }

    // Compute EBITDA if missing but components available
    if (exercice.ebitda === null && exercice.resultat_exploitation !== null) {
      const dotAmort = exercice.dotations_amortissements ?? 0
      const dotProv = exercice.dotations_provisions ?? 0
      if (dotAmort > 0 || dotProv > 0) {
        exercice.ebitda = exercice.resultat_exploitation + dotAmort + dotProv
        warnings.push(`Exercice ${exercice.annee}: EBITDA calculé = RE (${exercice.resultat_exploitation}) + DA (${dotAmort}) + DP (${dotProv})`)
      }
    }
  }

  // Track critical missing fields across most recent exercice
  const dernierExercice = extraction.exercices[0]
  if (dernierExercice) {
    const criticalFields: [keyof ExerciceData, string][] = [
      ['ca', 'Chiffre d\'affaires'],
      ['resultat_net', 'Résultat net'],
      ['capitaux_propres', 'Capitaux propres'],
      ['ebitda', 'EBITDA'],
      ['remuneration_dirigeant', 'Rémunération dirigeant'],
      ['charges_personnel', 'Charges de personnel'],
    ]

    for (const [field, label] of criticalFields) {
      if (dernierExercice[field] === null || dernierExercice[field] === undefined) {
        missingCritical.push(field)
      }
    }
  }

  // Compute completeness score
  let completeness = extraction.metadata.completeness_score
  if (!completeness || completeness === 0) {
    completeness = computeCompletenessScore(extraction.exercices)
  }

  return {
    exercices: extraction.exercices,
    metadata: {
      source_documents: extraction.metadata.source_documents,
      completeness_score: completeness,
      missing_critical: missingCritical.length > 0 ? missingCritical : extraction.metadata.missing_critical || [],
      warnings,
    },
  }
}

function computeCompletenessScore(exercices: ExerciceData[]): number {
  if (exercices.length === 0) return 0

  const latest = exercices[0]
  let score = 0
  const total = 20 // total fields in ExerciceData (minus annee)

  const fields: (keyof ExerciceData)[] = [
    'ca', 'resultat_exploitation', 'resultat_net', 'ebitda',
    'dotations_amortissements', 'dotations_provisions', 'charges_personnel',
    'effectif_moyen', 'remuneration_dirigeant', 'loyers', 'credit_bail',
    'capitaux_propres', 'dettes_financieres', 'tresorerie', 'total_actif',
    'actif_immobilise', 'stocks', 'creances_clients', 'dettes_fournisseurs',
  ]

  for (const field of fields) {
    if (latest[field] !== null && latest[field] !== undefined) {
      score++
    }
  }

  // Bonus for having multiple exercices
  if (exercices.length >= 2) score += 2
  if (exercices.length >= 3) score += 1

  return Math.min(100, Math.round((score / total) * 100))
}

// ── Session & DB update (async, non-blocking) ──

async function updateSessionAndEvaluation(params: {
  siren: string | null
  evaluationId: string | null
  extraction: ExtractionResult
  documentContents: { name: string }[]
  validFiles: { file: File }[]
}): Promise<void> {
  const { siren, evaluationId, extraction, documentContents, validFiles } = params

  // Update session in Redis
  if (siren) {
    const session = await findSessionBySiren(siren)
    if (session) {
      for (const { file } of validFiles) {
        const docId = crypto.randomUUID()
        await addDocumentToSession(session.id, {
          id: docId,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        })
        await updateDocumentAnalysis(session.id, docId, {
          status: 'analyzed',
          financialYear: extraction.exercices[0]?.annee,
          analysisResult: {
            documentType: 'bilan',
            confidence: extraction.metadata.completeness_score / 100,
            extractedData: extraction.exercices[0] as unknown as Record<string, unknown>,
          },
        })
      }
    }
  }

  // Increment document count in evaluation
  if (evaluationId) {
    for (let i = 0; i < validFiles.length; i++) {
      await incrementDocumentCount(evaluationId)
    }
  }
}
