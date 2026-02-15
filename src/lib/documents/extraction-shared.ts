// Module partagé d'extraction de données financières depuis documents comptables
// Utilisé par : /api/documents/extract (upload manuel) ET pappers-documents.ts (fetch auto)

import { anthropic } from '@/lib/anthropic'
import type { PdfPageImage } from './pdf-vision'

// ── Types ──

export interface ExerciceData {
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

export interface ExtractionMetadata {
  source_documents: string[]
  completeness_score: number
  missing_critical: string[]
  warnings: string[]
}

export interface ExtractionResult {
  exercices: ExerciceData[]
  metadata: ExtractionMetadata
}

// ── Prompt d'extraction ──

export const EXTRACTION_PROMPT = `Tu es un expert-comptable. Extrais les données financières structurées de ces documents comptables.

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

// ── Extraction depuis contenu pré-parsé ──

export interface DocumentContent {
  name: string
  text?: string
  images?: PdfPageImage[]
}

const TIMEOUT_PER_DOCUMENT_MS = 60_000

export async function extractFinancialsFromContent(
  contents: DocumentContent[]
): Promise<ExtractionResult> {
  const hasVisionContent = contents.some(d => d.images && d.images.length > 0)

  type TextBlock = { type: 'text'; text: string }
  type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png'; data: string } }
  type ContentBlock = TextBlock | ImageBlock

  const userContent: ContentBlock[] = []

  // Add text documents
  const textDocs = contents.filter(d => d.text && (!d.images || d.images.length === 0))
  if (textDocs.length > 0) {
    const combined = textDocs
      .map(d => `=== Document : ${d.name} ===\n\n${d.text!.substring(0, 40_000)}`)
      .join('\n\n---\n\n')
    userContent.push({ type: 'text', text: combined })
  }

  // Add vision documents (images)
  const visionDocs = contents.filter(d => d.images && d.images.length > 0)
  for (const doc of visionDocs) {
    userContent.push({
      type: 'text',
      text: `=== Document (image/scan) : ${doc.name} ===`,
    })
    if (doc.images) {
      for (const img of doc.images) {
        userContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: img.base64,
          },
        })
      }
    }
  }

  // Final instruction
  userContent.push({
    type: 'text',
    text: `Extrais les données financières de ${contents.length === 1 ? 'ce document' : `ces ${contents.length} documents`}. Retourne UNIQUEMENT le JSON demandé.`,
  })

  // Call Claude with timeout
  const timeoutMs = Math.min(contents.length * TIMEOUT_PER_DOCUMENT_MS, 120_000)
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
      throw new Error('Timeout: extraction trop longue')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  // Parse JSON response
  const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

  let extraction: ExtractionResult
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    extraction = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error(`extraction_failed: ${responseText.substring(0, 500)}`)
  }

  // Validate & enrich
  extraction = validateAndEnrich(extraction, contents.map(d => d.name))

  return extraction
}

// ── Validation & enrichissement ──

export function validateAndEnrich(extraction: ExtractionResult, fileNames: string[]): ExtractionResult {
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

    for (const [field, _label] of criticalFields) {
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

export function computeCompletenessScore(exercices: ExerciceData[]): number {
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
