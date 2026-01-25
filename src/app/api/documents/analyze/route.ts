// API Route pour l'analyse de documents avec Claude
// Version 2.0: Avec invalidation du cache et sessions serveur

import { NextRequest, NextResponse } from 'next/server'
import { anthropic, isAnthropicConfigured } from '@/lib/anthropic'
import { extractPdfText } from '@/lib/documents/pdf-parser'
import { parseExcel } from '@/lib/documents/excel-parser'
import {
  invalidateOnDocumentUpload,
  findSessionBySiren,
  addDocumentToSession,
  updateDocumentAnalysis,
} from '@/lib/ai'

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
    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        { error: 'API Anthropic non configurée' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const contextJson = formData.get('context') as string

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    let context
    try {
      context = contextJson ? JSON.parse(contextJson) : {}
    } catch {
      context = {}
    }

    // Extraire le texte selon le type de fichier
    let extractedText = ''
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (file.type === 'application/pdf') {
      extractedText = await extractPdfText(buffer)
    } else if (isExcelFile(file)) {
      // Parser Excel/CSV
      const excelData = parseExcel(buffer)
      extractedText = excelData.summary
    } else {
      // Pour les autres types, on lit le texte directement
      extractedText = await file.text()
    }

    // Si le texte est trop court, c'est peut-être un PDF image
    if (extractedText.length < 100) {
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

    // Analyser avec Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `
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
`,
      messages: [
        {
          role: 'user',
          content: `Analyse ce document :\n\n${extractedText.substring(0, 50000)}` // Limite pour éviter de dépasser le contexte
        }
      ],
    })

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
    const siren = context.entreprise?.siren

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
    // MISE À JOUR DE LA SESSION SERVEUR
    // ============================================
    if (siren) {
      const session = findSessionBySiren(siren)

      if (session) {
        // Ajouter le document à la session
        addDocumentToSession(session.id, {
          id: documentId,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        })

        // Mettre à jour avec les résultats d'analyse
        updateDocumentAnalysis(session.id, documentId, {
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
      extractedText: extractedText.substring(0, 5000), // Aperçu
      analysis,
    })

  } catch (error) {
    console.error('Erreur analyse document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du document' },
      { status: 500 }
    )
  }
}
