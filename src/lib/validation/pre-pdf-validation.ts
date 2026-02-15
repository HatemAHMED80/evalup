// Gate 3 — Validation pre-PDF
// Checks critiques avant generation du rapport. Errors = bloquants, Warnings = notes dans le PDF.

import type { ConversationContext } from '../anthropic'

export interface PrePDFValidationResult {
  canGenerate: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate conversation context before PDF generation.
 * Errors block generation. Warnings are included as coherence notes in the PDF.
 */
export function validateBeforePDFGeneration(
  context: ConversationContext
): PrePDFValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const diag = context.diagnosticData
  const bilans = context.financials?.bilans
  const dernierBilan = bilans?.[bilans.length - 1]

  // ── ERRORS (blocking) ──────────────────────────────────────────────────

  // 1. Effectif aberrant (code INSEE brut non converti)
  const effectifStr = context.entreprise?.effectif
  if (effectifStr) {
    const effectifNum = Number(effectifStr)
    if (!isNaN(effectifNum) && effectifNum > 10_000) {
      errors.push(
        `Effectif aberrant (${effectifStr}) — probablement un code INSEE non converti.`
      )
    }
  }

  // 2. EBITDA > CA (donnees fondamentalement incoherentes)
  if (diag && diag.ebitda > 0 && diag.revenue > 0 && diag.ebitda > diag.revenue) {
    errors.push(
      `EBITDA (${diag.ebitda.toLocaleString('fr-FR')} €) supérieur au CA (${diag.revenue.toLocaleString('fr-FR')} €).`
    )
  }

  // ── WARNINGS (non-blocking, included as PDF notes) ─────────────────────

  // 3. Risques manquants + EBITDA negatif
  if (diag && diag.ebitda < 0) {
    const hasRisques = context.qualitativeData?.litiges !== undefined ||
      context.qualitativeData?.dependanceDirigeant !== undefined
    if (!hasRisques) {
      warnings.push(
        'EBITDA négatif sans analyse de risques documentée — la section risques pourrait être incomplète.'
      )
    }
  }

  // 4. SaaS sans metriques
  if (context.archetype?.startsWith('saas') && !context.saasMetrics) {
    warnings.push(
      'Archétype SaaS détecté sans métriques SaaS (MRR, churn, NRR) — l\'évaluation repose uniquement sur les données comptables.'
    )
  }

  // 5. Confiance sans retraitements
  const retraitements = context.retraitements
  const hasRetraitements = retraitements && Object.values(retraitements).some((v) => v != null && v !== 0 && v !== false)
  if (!hasRetraitements) {
    warnings.push(
      'Aucun retraitement EBITDA effectué — le niveau de confiance de l\'évaluation est limité.'
    )
  }

  // 6. Donnees obsoletes (dernier bilan > 24 mois)
  if (dernierBilan?.annee) {
    const currentYear = new Date().getFullYear()
    const ageMonths = (currentYear - dernierBilan.annee) * 12
    if (ageMonths > 24) {
      warnings.push(
        `Dernier bilan datant de ${dernierBilan.annee} (> 24 mois) — les données financières sont potentiellement obsolètes.`
      )
    }
  }

  // 7. SWOT vide
  const qualData = context.qualitativeData
  const hasSomeQualitative = qualData && (
    qualData.dependanceDirigeant !== undefined ||
    qualData.concentrationClients !== undefined ||
    qualData.litiges !== undefined ||
    qualData.contratsCles !== undefined
  )
  if (!hasSomeQualitative) {
    warnings.push(
      'Aucune donnée qualitative collectée (dépendance dirigeant, litiges, contrats clés) — l\'analyse SWOT sera limitée.'
    )
  }

  return {
    canGenerate: errors.length === 0,
    errors,
    warnings,
  }
}
