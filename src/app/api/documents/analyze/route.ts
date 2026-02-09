// API Route pour l'analyse de documents avec Claude
// Version 3.1: Sécurisé avec auth, rate limiting, validation fichiers

import { NextRequest, NextResponse } from 'next/server'
import { anthropic, isAnthropicConfigured } from '@/lib/anthropic'
import { extractPdfText } from '@/lib/documents/pdf-parser'
import { parseExcel } from '@/lib/documents/excel-parser'
import { isScannedPdf, pdfToImages, estimateImageTokens, type PdfPageImage } from '@/lib/documents/pdf-vision'
import {
  invalidateOnDocumentUpload,
  findSessionBySiren,
  addDocumentToSession,
  updateDocumentAnalysis,
} from '@/lib/ai'
import {
  optionalAuth,
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  validateUploadedFile,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/security'
import { checkEvaluationAccess } from '@/lib/usage'

const EXCEL_MIME_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
]

function isExcelFile(file: File): boolean {
  return EXCEL_MIME_TYPES.includes(file.type) ||
    file.name.endsWith('.xls') ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.csv')
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentification obligatoire
    const user = await optionalAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    // 2. Rate limiting
    const identifier = user.id
    const rateLimitResult = await checkRateLimit(identifier, 'documentUpload')

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      )
    }

    // 2. Vérifier API configurée
    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        { error: 'Service temporairement indisponible' },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const contextJson = formData.get('context') as string

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // 3. Validation de base du fichier (taille préliminaire via File.size)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux. Maximum: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB` },
        { status: 413 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé: ${file.type}. Formats acceptés: PDF, Excel, CSV` },
        { status: 415 }
      )
    }

    let context
    try {
      context = contextJson ? JSON.parse(contextJson) : {}
    } catch {
      context = {}
    }

    // 3b. Vérifier que l'utilisateur a le droit d'uploader des documents
    const siren = context.entreprise?.siren
    if (siren && user.id) {
      const evalAccess = await checkEvaluationAccess(user.id, siren)
      if (!evalAccess.canUploadDocuments) {
        return NextResponse.json(
          {
            error: 'L\'upload de documents nécessite une évaluation complète (79€) ou un abonnement Pro.',
            code: 'UPLOAD_NOT_ALLOWED',
          },
          { status: 403 }
        )
      }
    }

    // 4. Lire et valider le contenu du fichier (magic bytes)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const fileValidation = validateUploadedFile(file, buffer)
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      )
    }

    // 5. Extraire le texte selon le type de fichier
    let extractedText = ''

    let isScanned = false
    let pdfImages: PdfPageImage[] = []

    if (file.type === 'application/pdf') {
      // Vérifier si le PDF est scanné
      const scanCheck = await isScannedPdf(buffer)
      isScanned = scanCheck.isScanned

      if (isScanned) {
        console.log('[Documents] PDF scanné détecté:', {
          fileName: file.name,
          pageCount: scanCheck.pageCount,
          avgCharsPerPage: scanCheck.avgCharsPerPage,
        })
        // Convertir les pages en images pour Claude Vision
        pdfImages = await pdfToImages(buffer, 15, 1.5)
        const estimatedTokens = estimateImageTokens(pdfImages)
        console.log('[Documents] Images générées:', {
          pageCount: pdfImages.length,
          estimatedTokens,
        })
      } else {
        extractedText = await extractPdfText(buffer)
      }
    } else if (isExcelFile(file)) {
      // Parser Excel/CSV
      const excelData = parseExcel(buffer)
      extractedText = excelData.summary
    } else {
      // Pour les autres types, on lit le texte directement
      extractedText = await file.text()
    }

    // Si le texte est trop court et pas de traitement Vision prévu
    if (extractedText.length < 100 && !isScanned) {
      return NextResponse.json({
        documentId: crypto.randomUUID(),
        fileName: file.name,
        fileSize: file.size,
        extractedText: '',
        analysis: {
          error: 'Le document semble être une image ou un scan. L\'extraction de texte n\'a pas fonctionné.',
          raw: extractedText,
        },
      })
    }

    // Déterminer le type de document pour le prompt
    const isExcel = isExcelFile(file)
    const documentTypeHint = isExcel
      ? 'Ce document est un fichier Excel/CSV. Il peut contenir des données de suivi (commandes, clients, stocks, etc.) ou des données financières.'
      : 'Ce document est un PDF. Il peut s\'agir d\'un bilan, compte de résultat, liasse fiscale, plaquette commerciale, etc.'

    // Construire le système prompt
    const systemPrompt = `
Tu es un expert-comptable et analyste financier analysant des documents d'entreprise.

Contexte de l'entreprise :
- Nom : ${context.entreprise?.nom || 'Non spécifié'}
- Secteur : ${context.entreprise?.secteur || 'Non spécifié'}
- SIREN : ${context.entreprise?.siren || 'Non spécifié'}

${documentTypeHint}

Tu dois :
1. Identifier le type de document (bilan, compte de résultat, liasse fiscale, suivi des commandes, fichier clients, stock, plaquette commerciale, etc.)
2. Extraire les chiffres clés et données importantes
3. Détecter les anomalies, tendances ou points d'attention
4. Lister les questions à poser au dirigeant pour mieux comprendre

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "typeDocument": "string (ex: bilan, compte de résultat, suivi commandes, fichier clients, etc.)",
  "annee": number ou null,
  "chiffresExtraits": {
    "ca": number ou null,
    "resultatNet": number ou null,
    "ebitda": number ou null,
    "tresorerie": number ou null,
    "dettes": number ou null,
    "autresDonnees": {} (objet avec d'autres données pertinentes extraites)
  },
  "pointsCles": ["string"],
  "anomalies": [
    {
      "type": "alerte" ou "question" ou "info",
      "categorie": "string",
      "message": "string",
      "severity": "high" ou "medium" ou "low"
    }
  ],
  "questionsASuggerer": ["string"]
}
`

    // Analyser avec Claude (Vision ou texte selon le type de PDF)
    let response

    if (isScanned && pdfImages.length > 0) {
      // Utiliser Claude Vision pour les PDFs scannés
      console.log('[Documents] Analyse via Claude Vision...')

      // Construire le contenu avec les images
      const imageContent: Array<{ type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } } | { type: 'text'; text: string }> = []

      // Ajouter chaque page comme image
      for (const img of pdfImages) {
        imageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: img.base64,
          },
        })
      }

      // Ajouter le texte de demande d'analyse
      imageContent.push({
        type: 'text',
        text: `Analyse ce document financier scanné (${pdfImages.length} page${pdfImages.length > 1 ? 's' : ''}). Extrais toutes les données chiffrées visibles.`,
      })

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: imageContent,
          }
        ],
      })
    } else {
      // Analyse classique par texte
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyse ce document :\n\n${extractedText.substring(0, 50000)}`
          }
        ],
      })
    }

    const analysisText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parser le JSON de la réponse
    let analysis
    try {
      // Extraire le JSON de la réponse (peut être entouré de ```json)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: analysisText }
    } catch {
      analysis = { raw: analysisText, parseError: true }
    }

    const documentId = crypto.randomUUID()

    // ============================================
    // INVALIDATION DU CACHE (v2)
    // ============================================
    // Quand un document est uploadé, les réponses cachées
    // pour cette entreprise doivent être invalidées
    if (siren && !analysis.parseError) {
      const invalidated = invalidateOnDocumentUpload(siren)
      console.log('[Documents] Cache invalidé après upload:', {
        siren,
        entriesInvalidated: invalidated,
        documentType: analysis.typeDocument,
      })
    }

    // ============================================
    // MISE À JOUR DE LA SESSION SERVEUR (async avec Redis)
    // ============================================
    if (siren) {
      const session = await findSessionBySiren(siren)

      if (session) {
        // Ajouter le document à la session
        await addDocumentToSession(session.id, {
          id: documentId,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        })

        // Mettre à jour avec les résultats d'analyse
        await updateDocumentAnalysis(session.id, documentId, {
          status: analysis.parseError ? 'error' : 'analyzed',
          financialYear: analysis.annee || undefined,
          analysisResult: !analysis.parseError ? {
            documentType: analysis.typeDocument || 'autre',
            confidence: 0.85,
            extractedData: analysis.chiffresExtraits || {},
          } : undefined,
          errorMessage: analysis.parseError ? 'Erreur de parsing JSON' : undefined,
        })

        console.log('[Documents] Session mise à jour:', {
          sessionId: session.id.substring(0, 12),
          documentId,
          year: analysis.annee,
        })
      }
    }

    return NextResponse.json({
      documentId,
      fileName: file.name,
      fileSize: file.size,
      extractedText: isScanned ? '[Document scanné - analysé via Vision]' : extractedText.substring(0, 5000),
      analysis,
      processingMethod: isScanned ? 'vision' : 'text',
      pagesAnalyzed: isScanned ? pdfImages.length : undefined,
    })

  } catch (error) {
    console.error('Erreur analyse document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du document' },
      { status: 500 }
    )
  }
}
