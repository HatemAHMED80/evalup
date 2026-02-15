// API Route pour l'extraction structurée de données financières depuis documents
// Accepte 1-5 fichiers (PDF, Excel, images), extrait via Claude, valide et retourne du JSON structuré

import { NextRequest, NextResponse } from 'next/server'
import { isAnthropicConfigured } from '@/lib/anthropic'
import { extractPdfText } from '@/lib/documents/pdf-parser'
import { parseExcel } from '@/lib/documents/excel-parser'
import { isScannedPdf, pdfToImages } from '@/lib/documents/pdf-vision'
import {
  type ExtractionResult,
  type DocumentContent,
  extractFinancialsFromContent,
} from '@/lib/documents/extraction-shared'
import {
  optionalAuth,
  checkRateLimit,
  getRateLimitHeaders,
  validateUploadedFile,
  MAX_FILE_SIZE,
} from '@/lib/security'
import { checkEvaluationAccess, incrementDocumentCount } from '@/lib/usage/evaluations'
import { saveExtractedFinancials } from '@/lib/pappers-documents'
import {
  findSessionBySiren,
  addDocumentToSession,
  updateDocumentAnalysis,
} from '@/lib/ai'

// ── Types ──

interface FileError {
  error: string
  fichier: string
}

// ── Config ──

const MAX_FILES = 5

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
    const documentContents: DocumentContent[] = []

    for (const { file, buffer } of validFiles) {
      try {
        if (IMAGE_TYPES.includes(file.type)) {
          // Image → Claude Vision direct
          const base64 = buffer.toString('base64')
          documentContents.push({
            name: file.name,
            images: [{
              pageNumber: 1,
              base64,
              width: 0,
              height: 0,
            }],
          })

        } else if (file.type === 'application/pdf') {
          // PDF: check if scanned
          const scanCheck = await isScannedPdf(buffer)

          if (scanCheck.isScanned) {
            console.log(`[Extract] PDF scanné: ${file.name} (${scanCheck.pageCount} pages, ${scanCheck.avgCharsPerPage} chars/page)`)
            const images = await pdfToImages(buffer, 15, 1.5)
            documentContents.push({ name: file.name, images })
          } else {
            const text = await extractPdfText(buffer)
            if (text.length < 50) {
              fileErrors.push({ error: 'document_illisible', fichier: file.name })
              continue
            }
            documentContents.push({ name: file.name, text })
          }

        } else if (EXCEL_TYPES.includes(file.type)) {
          // Excel/CSV
          const excelData = parseExcel(buffer)
          if (!excelData.summary || excelData.totalRows === 0) {
            fileErrors.push({ error: 'document_illisible', fichier: file.name })
            continue
          }
          documentContents.push({ name: file.name, text: excelData.summary })

        } else {
          // Fallback: read as text
          const text = await file.text()
          documentContents.push({ name: file.name, text })
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

    // 8. Extract financials via shared module (Claude call + validation)
    console.log(`[Extract] Envoi à Claude: ${documentContents.length} doc(s)`)

    let extraction: ExtractionResult
    try {
      extraction = await extractFinancialsFromContent(documentContents)
    } catch (err) {
      const message = (err as Error).message
      if (message.includes('Timeout')) {
        return NextResponse.json(
          { error: 'Timeout: extraction trop longue', details: fileErrors },
          { status: 504 }
        )
      }
      if (message.startsWith('extraction_failed:')) {
        console.error('[Extract] Erreur parsing JSON:', message)
        return NextResponse.json({
          error: 'extraction_failed',
          message: 'Impossible de structurer les données extraites',
          raw: message.substring(19, 2000),
          fileErrors,
        }, { status: 422 })
      }
      throw err
    }

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

// ── Session & DB update (async, non-blocking) ──

async function updateSessionAndEvaluation(params: {
  siren: string | null
  evaluationId: string | null
  extraction: ExtractionResult
  documentContents: { name: string }[]
  validFiles: { file: File }[]
}): Promise<void> {
  const { siren, evaluationId, extraction, documentContents: _documentContents, validFiles } = params

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

    // Persister les données extraites dans evaluations (en plus de Redis)
    await saveExtractedFinancials(evaluationId, extraction, 'upload')
  }
}
