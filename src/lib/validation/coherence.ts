// Gate 1 — Validation de coherence du formulaire diagnostic
// Verifie la coherence des donnees saisies vs Pappers et entre elles

export type AlertSeverity = 'error' | 'warning' | 'info'

export type AlertId =
  | 'CA_PAPPERS_DIVERGENCE'
  | 'EBITDA_SUPERIEUR_CA'
  | 'MARGE_EXCESSIVE'
  | 'EBITDA_PAPPERS_DIVERGENCE'
  | 'TRESORERIE_PAPPERS_DIVERGENCE'
  | 'DETTES_PAPPERS_DIVERGENCE'
  | 'MRR_VS_CA_INCOHERENT'
  | 'EFFECTIF_VS_MASSE_SALARIALE'
  | 'CROISSANCE_VS_HISTORIQUE'
  | 'REMUNERATION_VS_CA'

export interface ValidationAlert {
  id: AlertId
  severity: AlertSeverity
  message: string
  detail?: string
  step?: number
}

/** Minimal input shape matching DiagnosticFormData fields used for validation */
export interface DiagnosticValidationInput {
  revenue: number | null
  ebitda: number | null
  growth: number
  recurring: number
  masseSalariale: number
  effectif: string
  remunerationDirigeant: number | null
  dettesFinancieres: number | null
  tresorerieActuelle: number | null
  concentrationClient: number
  mrrMensuel: number | null
  pappersCA: number | null
  pappersEBITDA: number | null
  pappersTresorerie: number | null
  pappersDettes: number | null
}

function divergence(a: number, b: number): number {
  if (b === 0) return 0
  return Math.abs(a - b) / Math.abs(b)
}

/**
 * Validate diagnostic form data for coherence.
 * Returns a list of alerts sorted by severity (errors first).
 */
export function validateDiagnosticInput(data: DiagnosticValidationInput): ValidationAlert[] {
  const alerts: ValidationAlert[] = []
  const revenue = data.revenue
  const ebitda = data.ebitda

  // 1. CA vs Pappers divergence > 50%
  if (revenue != null && revenue > 0 && data.pappersCA != null && data.pappersCA > 0) {
    if (divergence(revenue, data.pappersCA) > 0.5) {
      alerts.push({
        id: 'CA_PAPPERS_DIVERGENCE',
        severity: 'info',
        message: 'Le CA saisi diverge de plus de 50% du CA Pappers.',
        detail: `Saisi : ${revenue.toLocaleString('fr-FR')} € — Pappers : ${data.pappersCA.toLocaleString('fr-FR')} €`,
        step: 2,
      })
    }
  }

  // 2. EBITDA > CA (incoherent)
  if (ebitda != null && revenue != null && revenue > 0 && ebitda > revenue) {
    alerts.push({
      id: 'EBITDA_SUPERIEUR_CA',
      severity: 'error',
      message: "L'EBITDA ne peut pas être supérieur au chiffre d'affaires.",
      detail: `EBITDA : ${ebitda.toLocaleString('fr-FR')} € — CA : ${revenue.toLocaleString('fr-FR')} €`,
      step: 3,
    })
  }

  // 3. Marge EBITDA > 80%
  if (ebitda != null && revenue != null && revenue > 0 && ebitda > 0) {
    const marge = ebitda / revenue
    if (marge > 0.8) {
      alerts.push({
        id: 'MARGE_EXCESSIVE',
        severity: 'warning',
        message: `Marge EBITDA exceptionnellement élevée (${Math.round(marge * 100)}%).`,
        detail: 'Vérifiez que l\'EBITDA saisi est correct.',
        step: 3,
      })
    }
  }

  // 4. EBITDA vs Pappers divergence > 50%
  if (ebitda != null && data.pappersEBITDA != null && data.pappersEBITDA !== 0) {
    if (divergence(ebitda, data.pappersEBITDA) > 0.5) {
      alerts.push({
        id: 'EBITDA_PAPPERS_DIVERGENCE',
        severity: 'info',
        message: 'L\'EBITDA saisi diverge significativement des données Pappers.',
        detail: `Saisi : ${ebitda.toLocaleString('fr-FR')} € — Pappers : ${data.pappersEBITDA.toLocaleString('fr-FR')} €`,
        step: 3,
      })
    }
  }

  // 5. Tresorerie vs Pappers divergence > 50%
  if (data.tresorerieActuelle != null && data.pappersTresorerie != null && data.pappersTresorerie !== 0) {
    if (divergence(data.tresorerieActuelle, data.pappersTresorerie) > 0.5) {
      alerts.push({
        id: 'TRESORERIE_PAPPERS_DIVERGENCE',
        severity: 'info',
        message: 'La trésorerie saisie diverge significativement des données Pappers.',
        detail: `Saisie : ${data.tresorerieActuelle.toLocaleString('fr-FR')} € — Pappers : ${data.pappersTresorerie.toLocaleString('fr-FR')} €`,
        step: 12,
      })
    }
  }

  // 6. Dettes vs Pappers divergence > 50%
  if (data.dettesFinancieres != null && data.pappersDettes != null && data.pappersDettes !== 0) {
    if (divergence(data.dettesFinancieres, data.pappersDettes) > 0.5) {
      alerts.push({
        id: 'DETTES_PAPPERS_DIVERGENCE',
        severity: 'info',
        message: 'Les dettes saisies divergent significativement des données Pappers.',
        detail: `Saisies : ${data.dettesFinancieres.toLocaleString('fr-FR')} € — Pappers : ${data.pappersDettes.toLocaleString('fr-FR')} €`,
        step: 11,
      })
    }
  }

  // 7. MRR * 12 > CA * 3 (ARR >> CA declared)
  if (data.mrrMensuel != null && data.mrrMensuel > 0 && revenue != null && revenue > 0) {
    if (data.mrrMensuel * 12 > revenue * 3) {
      alerts.push({
        id: 'MRR_VS_CA_INCOHERENT',
        severity: 'warning',
        message: `Le MRR annualisé (${(data.mrrMensuel * 12).toLocaleString('fr-FR')} €) dépasse largement le CA déclaré.`,
        detail: 'Le MRR réel peut être supérieur au CA comptable Pappers, mais vérifiez la cohérence.',
        step: 14,
      })
    }
  }

  // 8. Effectif > 10 mais masse salariale < 20%
  if (data.masseSalariale < 20) {
    const effectifNum = parseEffectifToNumber(data.effectif)
    if (effectifNum > 10) {
      alerts.push({
        id: 'EFFECTIF_VS_MASSE_SALARIALE',
        severity: 'info',
        message: `Masse salariale faible (${data.masseSalariale}%) pour ${data.effectif} collaborateurs.`,
        detail: 'Vérifiez si les charges de personnel incluent bien tous les salariés.',
        step: 7,
      })
    }
  }

  // 9. Croissance > 100%
  if (data.growth > 100) {
    alerts.push({
      id: 'CROISSANCE_VS_HISTORIQUE',
      severity: 'info',
      message: `Croissance déclarée exceptionnellement élevée (${data.growth}%).`,
      detail: 'Les croissances > 100% sont rares, assurez-vous que la valeur est correcte.',
      step: 4,
    })
  }

  // 10. Remuneration dirigeant > 50% du CA
  if (data.remunerationDirigeant != null && data.remunerationDirigeant > 0 && revenue != null && revenue > 0) {
    if (data.remunerationDirigeant > revenue * 0.5) {
      alerts.push({
        id: 'REMUNERATION_VS_CA',
        severity: 'warning',
        message: `La rémunération dirigeant représente plus de 50% du CA.`,
        detail: `Rémunération : ${data.remunerationDirigeant.toLocaleString('fr-FR')} € — CA : ${revenue.toLocaleString('fr-FR')} €`,
        step: 10,
      })
    }
  }

  // Sort: errors first, then warnings, then info
  const severityOrder: Record<AlertSeverity, number> = { error: 0, warning: 1, info: 2 }
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return alerts
}

/** Parse effectif string to approximate number for validation */
function parseEffectifToNumber(effectif: string): number {
  if (effectif === '1') return 1
  if (effectif === '2-5') return 3
  if (effectif === '6-20') return 13
  if (effectif === '21-50') return 35
  if (effectif === '50+') return 75
  return 0
}
