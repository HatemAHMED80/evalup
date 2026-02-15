// Orchestration : Pappers documents → extraction → stockage dans evaluations
// Pipeline complet : fetch comptes annuels → download PDFs → extract via Claude → persist

import { rechercherComptes, telechargerDocument } from './pappers'
import { extractPdfText } from './documents/pdf-parser'
import { isScannedPdf, pdfToImages } from './documents/pdf-vision'
import {
  type ExtractionResult,
  type DocumentContent,
  extractFinancialsFromContent,
} from './documents/extraction-shared'
import { createServiceClient } from '@/lib/supabase/server'

// Helper: accès à la table evaluations (types non inférés par @supabase/ssr)
function evaluationsTable() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (createServiceClient() as any).from('evaluations')
}

// ── Pipeline principal ──

/**
 * Pipeline complet : fetch Pappers → download PDFs → extract → store in evaluation
 * Exécuté en background (fire-and-forget)
 */
export async function fetchPappersDocuments(
  evaluationId: string,
  siren: string
): Promise<void> {
  const db = evaluationsTable()

  // 1. Vérifier le statut actuel
  const { data: evalData } = await db
    .select('pappers_doc_status, documents_source')
    .eq('id', evaluationId)
    .single()

  // Si déjà en cours/fait ou si l'utilisateur a uploadé ses propres docs → skip
  if (evalData?.pappers_doc_status === 'complete' ||
      evalData?.pappers_doc_status === 'extracting' ||
      evalData?.pappers_doc_status === 'fetching' ||
      evalData?.documents_source === 'upload') {
    console.log(`[PappersDocs] Skip: status=${evalData.pappers_doc_status}, source=${evalData.documents_source}`)
    return
  }

  // 2. Mettre à jour : fetching
  await evaluationsTable()
    .update({ pappers_doc_status: 'fetching' })
    .eq('id', evaluationId)

  try {
    // 3. Récupérer les tokens de comptes annuels
    const comptes = await rechercherComptes(siren)

    if (comptes.length === 0) {
      await evaluationsTable()
        .update({ pappers_doc_status: 'not_available' })
        .eq('id', evaluationId)
      console.log(`[PappersDocs] Aucun compte disponible pour ${siren}`)
      return
    }

    console.log(`[PappersDocs] ${comptes.length} compte(s) trouvé(s) pour ${siren}`)

    // 4. Télécharger les PDFs (skip confidentiel)
    const downloadedDocs: DocumentContent[] = []

    for (const compte of comptes) {
      if (compte.confidentialite === 'confidentiel') {
        console.log(`[PappersDocs] Skip confidentiel: ${compte.annee}`)
        continue
      }

      try {
        const buffer = await telechargerDocument(compte.token)
        const fileName = compte.nom_fichier_pdf || `comptes_${compte.annee}.pdf`

        // Parse le PDF (texte ou vision)
        const scanCheck = await isScannedPdf(buffer)

        if (scanCheck.isScanned) {
          console.log(`[PappersDocs] PDF scanné: ${fileName}`)
          const images = await pdfToImages(buffer, 15, 1.5)
          downloadedDocs.push({ name: fileName, images })
        } else {
          const text = await extractPdfText(buffer)
          if (text.length >= 50) {
            downloadedDocs.push({ name: fileName, text })
          } else {
            console.warn(`[PappersDocs] PDF trop court: ${fileName} (${text.length} chars)`)
          }
        }
      } catch (err) {
        console.error(`[PappersDocs] Erreur download ${compte.annee}:`, err)
      }
    }

    if (downloadedDocs.length === 0) {
      await evaluationsTable()
        .update({ pappers_doc_status: 'not_available' })
        .eq('id', evaluationId)
      console.log(`[PappersDocs] Aucun document exploitable pour ${siren}`)
      return
    }

    // 5. Extraire via Claude
    await evaluationsTable()
      .update({ pappers_doc_status: 'extracting' })
      .eq('id', evaluationId)

    console.log(`[PappersDocs] Extraction de ${downloadedDocs.length} doc(s) pour ${siren}`)
    const extraction = await extractFinancialsFromContent(downloadedDocs)

    // 6. Stocker
    await saveExtractedFinancials(evaluationId, extraction, 'pappers')

    console.log(`[PappersDocs] Succès pour ${siren}: ${extraction.exercices.length} exercice(s), score=${extraction.metadata.completeness_score}`)

  } catch (err) {
    console.error(`[PappersDocs] Erreur pipeline pour ${siren}:`, err)
    await evaluationsTable()
      .update({ pappers_doc_status: 'error' })
      .eq('id', evaluationId)
  }
}

// ── Persistance ──

/**
 * Persiste les données extraites (upload OU Pappers) dans l'évaluation.
 * Gère le merge si les deux sources coexistent (upload prioritaire).
 */
export async function saveExtractedFinancials(
  evaluationId: string,
  data: ExtractionResult,
  source: 'pappers' | 'upload'
): Promise<void> {
  // Charger l'existant
  const { data: evalData } = await evaluationsTable()
    .select('extracted_financials, documents_source')
    .eq('id', evaluationId)
    .single()

  // Merger si source différente
  let merged = data
  const existingSource = evalData?.documents_source as string | null
  const existingData = evalData?.extracted_financials as ExtractionResult | null

  if (existingData?.exercices && existingSource && existingSource !== 'none' && existingSource !== source) {
    merged = mergeExercices(existingData, data, source)
  }

  // Déterminer la source finale
  let finalSource: string = source
  if (existingSource && existingSource !== 'none' && existingSource !== source) {
    finalSource = 'mixed'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = {
    extracted_financials: merged,
    documents_source: finalSource,
  }
  if (source === 'pappers') {
    updatePayload.pappers_doc_status = 'complete'
  }

  await evaluationsTable()
    .update(updatePayload)
    .eq('id', evaluationId)
}

/**
 * Merge deux jeux de données financières.
 * L'upload prend priorité sur Pappers pour le même exercice.
 */
function mergeExercices(
  existing: ExtractionResult,
  incoming: ExtractionResult,
  incomingSource: 'pappers' | 'upload'
): ExtractionResult {
  const exerciceMap = new Map<number, ExtractionResult['exercices'][0]>()

  // Si l'upload est l'incoming, il prend priorité → on met l'existant d'abord
  // Si Pappers est l'incoming, l'existant (upload) prend priorité → on met l'incoming d'abord
  const [first, second] = incomingSource === 'upload'
    ? [existing.exercices, incoming.exercices]
    : [incoming.exercices, existing.exercices]

  for (const ex of first) {
    exerciceMap.set(ex.annee, ex)
  }
  // Le second écrase le premier (priorité)
  for (const ex of second) {
    exerciceMap.set(ex.annee, ex)
  }

  const mergedExercices = Array.from(exerciceMap.values())
    .sort((a, b) => b.annee - a.annee)

  return {
    exercices: mergedExercices,
    metadata: {
      source_documents: [
        ...existing.metadata.source_documents,
        ...incoming.metadata.source_documents,
      ],
      completeness_score: Math.max(
        existing.metadata.completeness_score,
        incoming.metadata.completeness_score
      ),
      missing_critical: incoming.metadata.missing_critical,
      warnings: [
        ...existing.metadata.warnings,
        ...incoming.metadata.warnings,
      ],
    },
  }
}
