// EvaluationData — source de verite centralisee pour la valorisation et le PDF.
// Alimentee par la sidebar (DataPanel) via le ConversationContext.
// Remplace le parcours DATA_UPDATE du chat comme source de donnees.

import type { ConversationContext } from '@/lib/anthropic'

// ─────────────────────────────────────────────────────────────────────────────
// Types principaux
// ─────────────────────────────────────────────────────────────────────────────

export interface EvalBilan {
  year: number
  source: 'pappers' | 'document' | 'manual'

  // Compte de resultat
  ca: number | null
  ebitda: number | null
  resultatNet: number | null
  resultatExploitation: number | null
  masseSalariale: number | null
  amortissements: number | null

  // Bilan
  tresorerie: number | null
  dettesFinancieres: number | null
  creancesClients: number | null
  dettesFournisseurs: number | null
  stocks: number | null
  capitauxPropres: number | null
  provisions: number | null

  isComplete: boolean
}

export interface EvalRetraitement {
  type:
    | 'salaire_dirigeant'
    | 'credit_bail'
    | 'charge_exceptionnelle'
    | 'produit_exceptionnel'
    | 'loyer'
    | 'salaire_famille_excessif'
    | 'salaire_famille_insuffisant'
  label: string
  montantActuel: number
  montantRetraite: number
  impactEbitda: number
  justification: string
}

export interface EvalSaaSMetrics {
  mrr: number | null
  arr: number | null
  churnMensuel: number | null
  nrr: number | null
  cac: number | null
  cacPayback: number | null
  runway: number | null
  ltv: number | null
  ltvCacRatio: number | null
  dureeVieMois: number | null
  gmv: number | null
}

export interface EvalQualitativeData {
  remunerationDirigeant: number | null
  concentrationTop1: number | null
  effectifReel: number | null
  recurring: number | null
  croissanceActuelle: number | null
  dependanceDirigeant: 'faible' | 'moyenne' | 'forte' | null
  participationMinoritaire: boolean | null
  litiges: boolean | null
  contratsCles: boolean | null
}

export interface EvaluationData {
  // Identite
  entreprise: {
    nom: string
    siren: string
    nafCode: string
    ville: string
    dateCreation: string
    effectifLabel: string
    effectifEstimation: number
    secteur: string
  }

  // Archetype et objectif
  archetype: string
  objectif: string

  // Donnees financieres par annee
  bilans: EvalBilan[]

  // Retraitements structures
  retraitements: EvalRetraitement[]
  ebitdaNormalise: number | null

  // Metriques SaaS (null si pas SaaS)
  saasMetrics: EvalSaaSMetrics | null

  // Donnees qualitatives
  qualitative: EvalQualitativeData

  // Documents uploades
  documents: Array<{
    name: string
    type: string
    extractedFields: string[]
  }>

  // Completude
  completude: {
    global: number
    financier: number
    qualitatif: number
    saas: number | null
  }

  // Coherence
  coherence: {
    alerts: Array<{
      field: string
      type: 'info' | 'warning' | 'error'
      message: string
      userConfirmed: boolean
    }>
    pappersEcarts: Array<{
      field: string
      pappersValue: number
      declaredValue: number
      ecartPct: number
    }>
  }

  // Source tracking
  sources: Record<string, 'pappers' | 'document' | 'manual' | 'diagnostic'>
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder : ConversationContext → EvaluationData
// ─────────────────────────────────────────────────────────────────────────────

function parseEffectifToNumber(effectifStr?: string | number): number {
  if (effectifStr === undefined || effectifStr === null) return 0
  if (typeof effectifStr === 'number') return effectifStr
  const trimmed = effectifStr.trim()
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10)
  const rangeMatch = trimmed.match(/(\d+)\s*[àa]\s*(\d+)/)
  if (rangeMatch) return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2)
  if (/non.?employeur/i.test(trimmed) || trimmed === '0') return 1
  const parsed = parseInt(trimmed.replace(/\s/g, ''), 10)
  return isNaN(parsed) ? 0 : parsed
}

export function buildEvaluationData(context: ConversationContext): EvaluationData {
  const { entreprise, financials } = context

  // ── Bilans ──
  const bilans: EvalBilan[] = (financials?.bilans || []).map((b) => {
    const re = b.resultat_exploitation ?? 0
    const amort = b.dotations_amortissements ?? 0
    const ebitda = re + amort
    const criticalFilled =
      b.chiffre_affaires > 0 && b.resultat_net !== 0 && b.resultat_exploitation !== 0

    return {
      year: b.annee,
      source: 'pappers' as const,
      ca: b.chiffre_affaires || null,
      ebitda: ebitda || null,
      resultatNet: b.resultat_net || null,
      resultatExploitation: b.resultat_exploitation || null,
      masseSalariale: null, // Not in BilanAnnuel snake_case
      amortissements: b.dotations_amortissements || null,
      tresorerie: b.tresorerie || null,
      dettesFinancieres: b.dettes_financieres || null,
      creancesClients: b.creances_clients || null,
      dettesFournisseurs: b.dettes_fournisseurs || null,
      stocks: b.stocks || null,
      capitauxPropres: b.capitaux_propres || null,
      provisions: b.provisions || null,
      isComplete: criticalFilled,
    }
  })

  // ── Retraitements ──
  const retraitements: EvalRetraitement[] = []
  const ret = context.retraitements
  if (ret) {
    if (ret.salaireDirigeant != null) {
      // We compute impact against normative later in the adapter
      retraitements.push({
        type: 'salaire_dirigeant',
        label: 'Remuneration dirigeant',
        montantActuel: ret.salaireDirigeant,
        montantRetraite: ret.salaireDirigeant, // actual — normatif computed in calculator
        impactEbitda: 0, // computed by calculator
        justification: 'Ecart entre salaire reel et salaire normatif du bareme',
      })
    }
    if (ret.loyerAnnuel != null && ret.loyerAppartientDirigeant) {
      const loyerMarche = ret.loyerMarche ?? ret.loyerAnnuel
      retraitements.push({
        type: 'loyer',
        label: 'Loyer au dirigeant / SCI',
        montantActuel: ret.loyerAnnuel,
        montantRetraite: loyerMarche,
        impactEbitda: ret.loyerAnnuel - loyerMarche,
        justification: 'Loyer paye au dirigeant ajuste au prix du marche',
      })
    }
    if (ret.creditBailAnnuel != null) {
      retraitements.push({
        type: 'credit_bail',
        label: 'Credit-bail',
        montantActuel: ret.creditBailAnnuel,
        montantRetraite: 0,
        impactEbitda: ret.creditBailAnnuel,
        justification: 'Reintegration des loyers de credit-bail dans l\'EBITDA',
      })
    }
    if (ret.chargesExceptionnelles != null && ret.chargesExceptionnelles > 0) {
      retraitements.push({
        type: 'charge_exceptionnelle',
        label: 'Charges exceptionnelles',
        montantActuel: ret.chargesExceptionnelles,
        montantRetraite: 0,
        impactEbitda: ret.chargesExceptionnelles,
        justification: 'Neutralisation des charges non recurrentes',
      })
    }
    if (ret.produitsExceptionnels != null && ret.produitsExceptionnels > 0) {
      retraitements.push({
        type: 'produit_exceptionnel',
        label: 'Produits exceptionnels',
        montantActuel: ret.produitsExceptionnels,
        montantRetraite: 0,
        impactEbitda: -ret.produitsExceptionnels,
        justification: 'Neutralisation des produits non recurrents',
      })
    }
    if (ret.salairesExcessifsFamille != null && ret.salairesExcessifsFamille > 0) {
      retraitements.push({
        type: 'salaire_famille_excessif',
        label: 'Salaires famille excessifs',
        montantActuel: ret.salairesExcessifsFamille,
        montantRetraite: 0,
        impactEbitda: ret.salairesExcessifsFamille,
        justification: 'Partie excessive des remunerations familiales',
      })
    }
    if (ret.salairesInsuffisantsFamille != null && ret.salairesInsuffisantsFamille > 0) {
      retraitements.push({
        type: 'salaire_famille_insuffisant',
        label: 'Salaires famille insuffisants',
        montantActuel: 0,
        montantRetraite: ret.salairesInsuffisantsFamille,
        impactEbitda: -ret.salairesInsuffisantsFamille,
        justification: 'Complement de remuneration familiale sous-payee',
      })
    }
  }

  // Fallback salaireDirigeant from diagnosticData
  if (
    retraitements.every((r) => r.type !== 'salaire_dirigeant') &&
    context.diagnosticData?.remunerationDirigeant != null
  ) {
    retraitements.push({
      type: 'salaire_dirigeant',
      label: 'Remuneration dirigeant',
      montantActuel: context.diagnosticData.remunerationDirigeant,
      montantRetraite: context.diagnosticData.remunerationDirigeant,
      impactEbitda: 0,
      justification: 'Depuis le diagnostic (source declarative)',
    })
  }

  // EBITDA normalise
  const lastBilan = bilans.sort((a, b) => b.year - a.year)[0]
  const baseEbitda = lastBilan?.ebitda ?? null
  const totalRetraitementImpact = retraitements.reduce((sum, r) => sum + r.impactEbitda, 0)
  const ebitdaNormalise = baseEbitda != null ? baseEbitda + totalRetraitementImpact : null

  // ── SaaS Metrics ──
  const saas = context.saasMetrics
  const diagMrr = context.diagnosticData?.mrrMensuel
  const isSaaS =
    context.archetype?.startsWith('saas_') || context.archetype === 'marketplace'
  let saasMetrics: EvalSaaSMetrics | null = null

  if (isSaaS || saas) {
    const mrr = saas?.mrr ?? diagMrr ?? null
    const churn = saas?.churnMensuel ?? null
    const arr = mrr != null ? mrr * 12 : saas?.arr ?? null
    const ltv = mrr != null && churn != null && churn > 0 ? mrr / (churn / 100) : null
    const cac = saas?.cac ?? null
    const ltvCacRatio = ltv != null && cac != null && cac > 0 ? Math.round((ltv / cac) * 10) / 10 : null
    const dureeVieMois = churn != null && churn > 0 ? Math.round(1 / (churn / 100)) : null

    saasMetrics = {
      mrr,
      arr,
      churnMensuel: churn,
      nrr: saas?.nrr ?? null,
      cac,
      cacPayback: saas?.cacPayback ?? null,
      runway: saas?.runway ?? null,
      ltv: ltv != null ? Math.round(ltv) : null,
      ltvCacRatio,
      dureeVieMois,
      gmv: saas?.gmv ?? null,
    }
  }

  // ── Qualitative ──
  const qual = context.qualitativeData
  const diag = context.diagnosticData

  const qualitative: EvalQualitativeData = {
    remunerationDirigeant: ret?.salaireDirigeant ?? diag?.remunerationDirigeant ?? null,
    concentrationTop1: qual?.concentrationClients ?? diag?.concentrationClient ?? null,
    effectifReel: parseEffectifToNumber(entreprise.effectif) || null,
    recurring: diag?.recurring ?? null,
    croissanceActuelle: diag?.growth ?? null,
    dependanceDirigeant: qual?.dependanceDirigeant ?? null,
    participationMinoritaire: qual?.participationMinoritaire ?? null,
    litiges: qual?.litiges ?? null,
    contratsCles: qual?.contratsCles ?? null,
  }

  // ── Documents ──
  const documents = (context.documents || []).map((d) => ({
    name: d.name,
    type: d.type,
    extractedFields: d.analysis?.chiffresExtraits
      ? Object.keys(d.analysis.chiffresExtraits)
      : [],
  }))

  // ── Completude ──
  const completude = computeCompletude(bilans, qualitative, saasMetrics, isSaaS)

  // ── Coherence (Pappers ecarts) ──
  const pappersEcarts: EvaluationData['coherence']['pappersEcarts'] = []
  if (lastBilan && diag) {
    if (
      diag.revenue != null &&
      lastBilan.ca != null &&
      lastBilan.ca > 0 &&
      Math.abs(diag.revenue - lastBilan.ca) / lastBilan.ca > 0.2
    ) {
      pappersEcarts.push({
        field: 'CA',
        pappersValue: lastBilan.ca,
        declaredValue: diag.revenue,
        ecartPct: Math.round(
          (Math.abs(diag.revenue - lastBilan.ca) / lastBilan.ca) * 100
        ),
      })
    }
  }

  // ── Sources ──
  const sources: Record<string, 'pappers' | 'document' | 'manual' | 'diagnostic'> = {}
  if (lastBilan) {
    sources.ca = 'pappers'
    sources.ebitda = 'pappers'
    sources.tresorerie = 'pappers'
    sources.dettesFinancieres = 'pappers'
  }
  if (diag) {
    if (diag.remunerationDirigeant != null) sources.remunerationDirigeant = 'diagnostic'
    if (diag.concentrationClient != null) sources.concentrationClient = 'diagnostic'
    if (diag.growth != null) sources.croissance = 'diagnostic'
  }
  if (qual) {
    if (qual.dependanceDirigeant) sources.dependanceDirigeant = 'manual'
    if (qual.litiges !== undefined) sources.litiges = 'manual'
  }

  return {
    entreprise: {
      nom: entreprise.nom || '',
      siren: entreprise.siren || '',
      nafCode: entreprise.codeNaf || '',
      ville: entreprise.ville || '',
      dateCreation: entreprise.dateCreation || '',
      effectifLabel: entreprise.effectif || '',
      effectifEstimation: parseEffectifToNumber(entreprise.effectif),
      secteur: entreprise.secteur || '',
    },
    archetype: context.archetype || 'services_recurrents',
    objectif: context.objectif || '',
    bilans,
    retraitements,
    ebitdaNormalise,
    saasMetrics,
    qualitative,
    documents,
    completude,
    coherence: {
      alerts: [],
      pappersEcarts,
    },
    sources,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived metrics
// ─────────────────────────────────────────────────────────────────────────────

export function computeDerivedMetrics(data: EvaluationData): EvaluationData {
  const updated = { ...data }

  // SaaS derives
  if (updated.saasMetrics?.mrr) {
    const s = { ...updated.saasMetrics }
    s.arr = s.mrr! * 12
    if (s.churnMensuel && s.churnMensuel > 0) {
      s.dureeVieMois = Math.round(1 / (s.churnMensuel / 100))
      s.ltv = Math.round(s.mrr! / (s.churnMensuel / 100))
      if (s.cac && s.cac > 0) {
        s.ltvCacRatio = Math.round((s.ltv / s.cac) * 10) / 10
      }
    }
    updated.saasMetrics = s
  }

  // EBITDA normalise
  const lastBilan = [...updated.bilans].sort((a, b) => b.year - a.year)[0]
  if (lastBilan?.ebitda != null) {
    const totalImpact = updated.retraitements.reduce((sum, r) => sum + r.impactEbitda, 0)
    updated.ebitdaNormalise = lastBilan.ebitda + totalImpact
  }

  // Completude
  const isSaaS =
    updated.archetype?.startsWith('saas_') || updated.archetype === 'marketplace'
  updated.completude = computeCompletude(
    updated.bilans,
    updated.qualitative,
    updated.saasMetrics,
    isSaaS
  )

  return updated
}

// ─────────────────────────────────────────────────────────────────────────────
// Completude
// ─────────────────────────────────────────────────────────────────────────────

function computeCompletude(
  bilans: EvalBilan[],
  qualitative: EvalQualitativeData,
  saasMetrics: EvalSaaSMetrics | null,
  isSaaS: boolean
): EvaluationData['completude'] {
  const lastBilan = bilans[0]

  const financierFields: (keyof EvalBilan)[] = [
    'ca',
    'ebitda',
    'resultatNet',
    'tresorerie',
    'dettesFinancieres',
    'capitauxPropres',
  ]
  const financierFilled = lastBilan
    ? financierFields.filter((f) => lastBilan[f] != null).length
    : 0
  const financier = Math.round((financierFilled / financierFields.length) * 100)

  const qualFields: (keyof EvalQualitativeData)[] = [
    'remunerationDirigeant',
    'concentrationTop1',
    'effectifReel',
    'recurring',
    'croissanceActuelle',
  ]
  const qualFilled = qualFields.filter((f) => qualitative[f] != null).length
  const qualitatif = Math.round((qualFilled / qualFields.length) * 100)

  let saas: number | null = null
  if (isSaaS && saasMetrics) {
    const saasFields: (keyof EvalSaaSMetrics)[] = [
      'mrr',
      'churnMensuel',
      'nrr',
      'cac',
      'cacPayback',
      'runway',
    ]
    const saasFilled = saasFields.filter((f) => saasMetrics[f] != null).length
    saas = Math.round((saasFilled / saasFields.length) * 100)
  }

  const totalFields =
    financierFields.length + qualFields.length + (isSaaS ? 6 : 0)
  const totalFilled =
    financierFilled +
    qualFilled +
    (saas != null ? Math.round((saas / 100) * 6) : 0)
  const global = Math.round((totalFilled / totalFields) * 100)

  return { global, financier, qualitatif, saas }
}
