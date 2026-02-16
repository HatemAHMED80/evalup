// Calculateur de valorisation V2 — par archétype
// Chaque archétype utilise une méthode de valorisation spécifique
// Source des multiples : data/multiples.json (Damodaran 2026)
// Ce fichier est autonome : il ne référence PAS l'ancien calculateur

import { getMultiplesForArchetype } from './multiples'
import type { ArchetypeMultiples } from './multiples'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface Retraitements {
  salaireDirigeant?: number
  loyerAnnuel?: number
  loyerMarche?: number
  loyerAppartientDirigeant?: boolean
  creditBailAnnuel?: number
  creditBailRestant?: number
  chargesExceptionnelles?: number
  produitsExceptionnels?: number
  salairesExcessifsFamille?: number
  salairesInsuffisantsFamille?: number
}

export interface FinancialData {
  revenue: number
  ebitda: number
  netIncome: number
  equity: number
  cash: number
  debt: number
  arr?: number
  mrr?: number
  gmv?: number
  netRevenue?: number
  assets?: number
  growth?: number
  recurring?: number
  retraitements?: Retraitements
}

export interface QualitativeData {
  dependanceDirigeant?: 'faible' | 'moyenne' | 'forte'
  concentrationClients?: number
  participationMinoritaire?: boolean
  litiges?: boolean
  contratsCles?: boolean
}

export interface Adjustment {
  name: string
  impact: number
  reason: string
}

export interface Decote {
  name: string
  percentage: number
  reason: string
}

export interface Range {
  low: number
  median: number
  high: number
}

export interface ValuationResult {
  archetype: string
  methodUsed: string
  valuationRange: Range
  adjustments: Adjustment[]
  decotes: Decote[]
  enterpriseValue: Range
  netDebt: number
  equityValue: Range
  confidenceScore: number
}

// -----------------------------------------------------------------------------
// Barème salaire normatif dirigeant
// -----------------------------------------------------------------------------

const TRANCHES_SALAIRE: Array<{ min: number; max: number; salaire: number }> = [
  { min: 0, max: 500_000, salaire: 50_000 },
  { min: 500_000, max: 1_000_000, salaire: 70_000 },
  { min: 1_000_000, max: 2_000_000, salaire: 90_000 },
  { min: 2_000_000, max: 5_000_000, salaire: 110_000 },
  { min: 5_000_000, max: 10_000_000, salaire: 140_000 },
  { min: 10_000_000, max: 20_000_000, salaire: 170_000 },
  { min: 20_000_000, max: Infinity, salaire: 200_000 },
]

function getSalaireNormatif(ca: number): number {
  const t = TRANCHES_SALAIRE.find(tr => ca >= tr.min && ca < tr.max)
  return t?.salaire ?? 80_000
}

// -----------------------------------------------------------------------------
// Retraitements EBITDA
// -----------------------------------------------------------------------------

function normaliserEbitda(
  revenue: number,
  ebitda: number,
  r?: Retraitements,
): { ebitdaNormalise: number; adjustments: Adjustment[] } {
  const adjustments: Adjustment[] = []
  let norm = ebitda

  if (!r) return { ebitdaNormalise: norm, adjustments }

  // Salaire dirigeant
  if (r.salaireDirigeant !== undefined) {
    const normatif = getSalaireNormatif(revenue)
    const diff = r.salaireDirigeant - normatif
    if (Math.abs(diff) > normatif * 0.1) {
      norm += diff
      adjustments.push({
        name: 'Retraitement salaire dirigeant',
        impact: diff,
        reason: diff > 0
          ? `Salaire (${fmtK(r.salaireDirigeant)}) > normatif (${fmtK(normatif)})`
          : `Salaire (${fmtK(r.salaireDirigeant)}) < normatif (${fmtK(normatif)})`,
      })
    }
  }

  // Loyer
  if (r.loyerAppartientDirigeant && r.loyerAnnuel !== undefined && r.loyerMarche !== undefined) {
    const diff = r.loyerAnnuel - r.loyerMarche
    if (Math.abs(diff) > r.loyerMarche * 0.1) {
      norm += diff
      adjustments.push({
        name: 'Retraitement loyer',
        impact: diff,
        reason: `Loyer payé (${fmtK(r.loyerAnnuel)}) vs marché (${fmtK(r.loyerMarche)})`,
      })
    }
  }

  // Crédit-bail
  if (r.creditBailAnnuel && r.creditBailAnnuel > 0) {
    norm += r.creditBailAnnuel
    adjustments.push({
      name: 'Réintégration crédit-bail',
      impact: r.creditBailAnnuel,
      reason: `Loyers crédit-bail (${fmtK(r.creditBailAnnuel)}) réintégrés`,
    })
  }

  // Charges exceptionnelles
  if (r.chargesExceptionnelles && r.chargesExceptionnelles > 0) {
    norm += r.chargesExceptionnelles
    adjustments.push({
      name: 'Neutralisation charges exceptionnelles',
      impact: r.chargesExceptionnelles,
      reason: `Charges non récurrentes : +${fmtK(r.chargesExceptionnelles)}`,
    })
  }

  // Produits exceptionnels
  if (r.produitsExceptionnels && r.produitsExceptionnels > 0) {
    norm -= r.produitsExceptionnels
    adjustments.push({
      name: 'Neutralisation produits exceptionnels',
      impact: -r.produitsExceptionnels,
      reason: `Produits non récurrents : -${fmtK(r.produitsExceptionnels)}`,
    })
  }

  // Salaires famille excessifs
  if (r.salairesExcessifsFamille && r.salairesExcessifsFamille > 0) {
    norm += r.salairesExcessifsFamille
    adjustments.push({
      name: 'Salaires famille excessifs',
      impact: r.salairesExcessifsFamille,
      reason: `Partie excessive : +${fmtK(r.salairesExcessifsFamille)}`,
    })
  }

  // Salaires famille insuffisants
  if (r.salairesInsuffisantsFamille && r.salairesInsuffisantsFamille > 0) {
    norm -= r.salairesInsuffisantsFamille
    adjustments.push({
      name: 'Salaires famille insuffisants',
      impact: -r.salairesInsuffisantsFamille,
      reason: `Travail non rémunéré : -${fmtK(r.salairesInsuffisantsFamille)}`,
    })
  }

  return { ebitdaNormalise: norm, adjustments }
}

// -----------------------------------------------------------------------------
// Décotes multiplicatives
// -----------------------------------------------------------------------------

function calculerDecotes(qual?: QualitativeData): Decote[] {
  const decotes: Decote[] = []
  if (!qual) return decotes

  if (qual.participationMinoritaire) {
    decotes.push({ name: 'Décote minoritaire', percentage: 20, reason: 'Participation < 50%' })
  }

  // Illiquidité toujours appliquée (non coté)
  decotes.push({ name: "Décote d'illiquidité", percentage: 15, reason: 'Actions non cotées' })

  if (qual.dependanceDirigeant === 'forte') {
    decotes.push({ name: 'Décote homme-clé', percentage: 20, reason: 'Forte dépendance au dirigeant' })
  } else if (qual.dependanceDirigeant === 'moyenne') {
    decotes.push({ name: 'Décote homme-clé', percentage: 10, reason: 'Dépendance moyenne au dirigeant' })
  }

  if (qual.concentrationClients && qual.concentrationClients > 30) {
    const pct = Math.min(30, Math.round(qual.concentrationClients * 0.5))
    decotes.push({ name: 'Décote concentration clients', percentage: pct, reason: `Top client = ${qual.concentrationClients}% du CA` })
  }

  if (qual.litiges) {
    decotes.push({ name: 'Décote litiges', percentage: 10, reason: 'Litiges en cours' })
  }

  return decotes
}

function appliquerDecotes(valeur: number, decotes: Decote[]): number {
  if (decotes.length === 0 || valeur <= 0) return valeur

  let facteur = 1
  for (const d of decotes) {
    facteur *= (1 - d.percentage / 100)
  }

  // Plafond : décote totale max 45%
  if (1 - facteur > 0.45) {
    facteur = 0.55
  }

  return valeur * facteur
}

// -----------------------------------------------------------------------------
// Pondération par archétype [primaryWeight, secondaryWeight]
// -----------------------------------------------------------------------------

const WEIGHTS: Record<string, [number, number]> = {
  saas_hyper:             [80, 20],
  saas_mature:            [40, 60],
  saas_decline:           [80, 20],
  marketplace:            [60, 40],
  ecommerce:              [40, 60],
  conseil:                [80, 20],
  services_recurrents:    [80, 20],
  commerce_retail:        [60, 40],
  commerce_gros:          [75, 25],
  industrie:              [75, 25],
  patrimoine:             [20, 80],
  patrimoine_dominant:    [20, 80],
  deficit_structurel:     [70, 30],
  masse_salariale_lourde: [90, 10],
  micro_solo:             [70, 30],
  pre_revenue:            [0, 0],
}

// -----------------------------------------------------------------------------
// Résolution des métriques par archétype
// -----------------------------------------------------------------------------

function getPrimaryMetric(archetype: string, data: FinancialData, ebitdaNorm: number): number {
  switch (archetype) {
    case 'saas_hyper':
      return data.arr ?? (data.mrr ? data.mrr * 12 : data.revenue)
    case 'saas_mature':
    case 'saas_decline':
    case 'conseil':
    case 'services_recurrents':
    case 'commerce_retail':
    case 'commerce_gros':
    case 'industrie':
    case 'masse_salariale_lourde':
      return ebitdaNorm
    case 'marketplace':
      // GMV (volume total) → fallback ARR (commissions annualisées) → fallback CA Pappers
      return data.gmv ?? data.arr ?? (data.mrr ? data.mrr * 12 : data.revenue)
    case 'ecommerce':
      return data.revenue
    case 'patrimoine':
    case 'patrimoine_dominant':
      return data.assets ?? data.equity
    case 'deficit_structurel':
      return data.revenue
    case 'micro_solo':
      return ebitdaNorm > 0 ? ebitdaNorm : Math.max(0, data.netIncome)
    default:
      return ebitdaNorm
  }
}

function getSecondaryMetric(archetype: string, data: FinancialData, ebitdaNorm: number): number {
  switch (archetype) {
    case 'saas_hyper':
      return data.revenue
    case 'saas_mature':
      return data.arr ?? (data.mrr ? data.mrr * 12 : data.revenue)
    case 'saas_decline':
      return data.revenue
    case 'marketplace':
      // CA net (commissions) → fallback ARR → fallback CA Pappers
      return data.arr ?? data.netRevenue ?? data.revenue
    case 'ecommerce':
      return ebitdaNorm > 0 ? ebitdaNorm : 0
    case 'conseil':
    case 'commerce_retail':
    case 'commerce_gros':
    case 'industrie':
    case 'masse_salariale_lourde':
    case 'micro_solo':
      return data.revenue
    case 'services_recurrents':
      return data.revenue * ((data.recurring ?? 0) / 100)
    case 'patrimoine':
      return ebitdaNorm > 0 ? ebitdaNorm : data.revenue * 0.6
    case 'patrimoine_dominant':
      return ebitdaNorm > 0 ? ebitdaNorm : 0
    case 'deficit_structurel':
      return Math.max(0, data.equity)
    default:
      return data.revenue
  }
}

// -----------------------------------------------------------------------------
// Calcul VE pondéré
// -----------------------------------------------------------------------------

function calculateVE(
  archetype: string,
  primaryMetric: number,
  secondaryMetric: number,
  multiples: ArchetypeMultiples,
): Range {
  const w = WEIGHTS[archetype] ?? [70, 30]
  let [wp, ws] = w

  const prim = multiples.primaryMultiple
  let primaryVE: Range | null = null
  if (primaryMetric > 0 && (prim.low > 0 || prim.median > 0 || prim.high > 0)) {
    primaryVE = {
      low: primaryMetric * prim.low,
      median: primaryMetric * prim.median,
      high: primaryMetric * prim.high,
    }
  }

  const sec = multiples.secondaryMultiple
  let secondaryVE: Range | null = null
  if (secondaryMetric > 0 && (sec.low > 0 || sec.median > 0 || sec.high > 0)) {
    secondaryVE = {
      low: secondaryMetric * sec.low,
      median: secondaryMetric * sec.median,
      high: secondaryMetric * sec.high,
    }
  }

  // ecommerce sans EBITDA → 100% CA
  if (archetype === 'ecommerce' && !secondaryVE) {
    wp = 100
    ws = 0
  }

  // Si primary manquant → 100% secondary
  if (!primaryVE && secondaryVE) return secondaryVE
  // Si secondary manquant → 100% primary
  if (primaryVE && !secondaryVE) return primaryVE
  // Si les deux disponibles → blend pondéré
  if (primaryVE && secondaryVE) {
    const totalW = wp + ws
    return {
      low: (primaryVE.low * wp + secondaryVE.low * ws) / totalW,
      median: (primaryVE.median * wp + secondaryVE.median * ws) / totalW,
      high: (primaryVE.high * wp + secondaryVE.high * ws) / totalW,
    }
  }
  // Rien → 0
  return { low: 0, median: 0, high: 0 }
}

// -----------------------------------------------------------------------------
// Dette financière nette
// -----------------------------------------------------------------------------

function calculateNetDebt(data: FinancialData): number {
  let totalDebt = data.debt
  if (data.retraitements?.creditBailRestant) {
    totalDebt += data.retraitements.creditBailRestant
  }
  return totalDebt - data.cash
}

// -----------------------------------------------------------------------------
// Label de méthode
// -----------------------------------------------------------------------------

function getMethodLabel(archetype: string): string {
  switch (archetype) {
    case 'saas_hyper': return 'Multiple ARR'
    case 'saas_mature': return "Multiple EBITDA + validation ARR"
    case 'saas_decline': return "Multiple EBITDA avec décote"
    case 'marketplace': return 'Multiple GMV + CA net'
    case 'ecommerce': return 'Multiple CA / EBITDA'
    case 'conseil': return 'Multiple EBITDA retraité'
    case 'services_recurrents': return 'Multiple EBITDA + CA récurrent'
    case 'commerce_retail': return 'Multiple EBITDA + fonds de commerce'
    case 'commerce_gros': return 'Multiple EBITDA (commerce de gros)'
    case 'industrie': return 'Multiple EBITDA + validation ANR'
    case 'patrimoine': return 'ANR (Actif Net Réévalué)'
    case 'patrimoine_dominant': return 'ANR avec décote liquidité'
    case 'deficit_structurel': return 'Multiple CA (retournement)'
    case 'masse_salariale_lourde': return 'Multiple EBITDA prudent'
    case 'micro_solo': return 'Multiple bénéfice retraité'
    case 'pre_revenue': return 'Valorisation non standard (DCF / Méthode VC)'
    default: return 'Multiple EBITDA'
  }
}

// -----------------------------------------------------------------------------
// Score de confiance (0-100)
// -----------------------------------------------------------------------------

function calculateConfidence(
  archetype: string,
  primaryMetric: number,
  secondaryMetric: number,
  data: FinancialData,
  qual?: QualitativeData,
): number {
  if (archetype === 'pre_revenue') return 0

  let score = 100

  if (primaryMetric <= 0) score -= 25
  if (secondaryMetric <= 0) score -= 10
  if (!qual) score -= 10

  const ebitdaBased = [
    'saas_mature', 'saas_decline', 'conseil', 'services_recurrents',
    'commerce_retail', 'commerce_gros', 'industrie', 'masse_salariale_lourde',
  ]
  if (ebitdaBased.includes(archetype) && !data.retraitements) score -= 10
  if (ebitdaBased.includes(archetype) && data.ebitda <= 0) score -= 20

  // Conseil/micro_solo sans salaire dirigeant : EBITDA probablement gonflé
  // Pénalité supplémentaire car le dirigeant EST souvent le produit
  if ((archetype === 'conseil' || archetype === 'micro_solo') &&
      (!data.retraitements || data.retraitements.salaireDirigeant === undefined)) {
    score -= 10
  }

  if (archetype === 'saas_hyper' && !data.arr && !data.mrr) score -= 15
  if ((archetype === 'patrimoine' || archetype === 'patrimoine_dominant') && !data.assets) score -= 15
  if (archetype === 'marketplace' && !data.gmv) score -= 15

  return Math.max(0, Math.min(100, score))
}

// -----------------------------------------------------------------------------
// Fonction principale
// -----------------------------------------------------------------------------

export function calculateValuation(
  archetype: string,
  financialData: FinancialData,
  qualitativeData?: QualitativeData,
): ValuationResult {
  // Pre-revenue : VE = 0 (pas de multiples), mais bridge tréso/dette calculé
  if (archetype === 'pre_revenue') {
    const netDebt = calculateNetDebt(financialData)
    // Equity = VE - DFN ; quand VE=0, equity = tréso nette (si positive)
    const equityFromBridge = Math.max(0, -netDebt)
    return {
      archetype,
      methodUsed: getMethodLabel(archetype),
      valuationRange: { low: 0, median: equityFromBridge, high: equityFromBridge },
      adjustments: [],
      decotes: [],
      enterpriseValue: { low: 0, median: 0, high: 0 },
      netDebt,
      equityValue: { low: 0, median: equityFromBridge, high: equityFromBridge },
      confidenceScore: 0,
    }
  }

  // 1. Charger les multiples
  const multiples = getMultiplesForArchetype(archetype)
  if (!multiples) {
    throw new Error(`Archétype inconnu : ${archetype}`)
  }

  // 2. Normaliser l'EBITDA (retraitements)
  const { ebitdaNormalise, adjustments } = normaliserEbitda(
    financialData.revenue,
    financialData.ebitda,
    financialData.retraitements,
  )

  // 3. Résoudre les métriques
  const primaryMetric = getPrimaryMetric(archetype, financialData, ebitdaNormalise)
  const secondaryMetric = getSecondaryMetric(archetype, financialData, ebitdaNormalise)

  // 4. Calculer la VE
  let enterpriseValue = calculateVE(archetype, primaryMetric, secondaryMetric, multiples)

  // micro_solo + remu=0 + CA<100k : EBITDA et RN sont fictifs (salaire déguisé)
  // Plafonner la VE pour refléter la non-transférabilité
  if (archetype === 'micro_solo'
      && financialData.retraitements?.salaireDirigeant === 0
      && financialData.revenue < 100_000) {
    const capVE = Math.max(0, ebitdaNormalise)
    enterpriseValue = {
      low: Math.min(enterpriseValue.low, 0),
      median: Math.min(enterpriseValue.median, capVE),
      high: Math.min(enterpriseValue.high, Math.max(capVE, 5_000)),
    }
  }

  // 5. Calculer la dette nette
  // Pour patrimoine/patrimoine_dominant : la tréso est un actif (déjà dans VE via ANR),
  // donc on ne la soustrait PAS de la dette dans le bridge
  let netDebt: number
  if (archetype === 'patrimoine' || archetype === 'patrimoine_dominant') {
    netDebt = financialData.debt + (financialData.retraitements?.creditBailRestant ?? 0)
  } else {
    netDebt = calculateNetDebt(financialData)
  }

  // 6. Equity avant décotes = VE - DFN
  const equityBeforeDecotes: Range = {
    low: Math.max(0, enterpriseValue.low - netDebt),
    median: Math.max(0, enterpriseValue.median - netDebt),
    high: Math.max(0, enterpriseValue.high - netDebt),
  }

  // 7. Calculer et appliquer les décotes
  const decotes = calculerDecotes(qualitativeData)
  const equityValue: Range = {
    low: appliquerDecotes(equityBeforeDecotes.low, decotes),
    median: appliquerDecotes(equityBeforeDecotes.median, decotes),
    high: appliquerDecotes(equityBeforeDecotes.high, decotes),
  }

  // 8. Score de confiance
  const confidenceScore = calculateConfidence(
    archetype, primaryMetric, secondaryMetric, financialData, qualitativeData,
  )

  return {
    archetype,
    methodUsed: getMethodLabel(archetype),
    valuationRange: equityValue,
    adjustments,
    decotes,
    enterpriseValue,
    netDebt,
    equityValue,
    confidenceScore,
  }
}

// -----------------------------------------------------------------------------
// Utilitaire
// -----------------------------------------------------------------------------

function fmtK(n: number): string {
  const abs = Math.abs(n)
  const prefix = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${prefix}${(abs / 1_000_000).toFixed(1)}M€`
  if (abs >= 1_000) return `${prefix}${(abs / 1_000).toFixed(0)}k€`
  return `${prefix}${abs.toFixed(0)}€`
}

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper pour EvaluationData (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

import type { EvaluationData } from '../evaluation/evaluation-data'
import { evaluationDataToFinancialData, evaluationDataToQualitativeData } from './evaluation-adapter'

export function calculateFromEvaluationData(data: EvaluationData): ValuationResult {
  const financialData = evaluationDataToFinancialData(data)
  const qualitativeData = evaluationDataToQualitativeData(data)
  return calculateValuation(data.archetype, financialData, qualitativeData)
}

// Exports pour les tests
export { getSalaireNormatif, normaliserEbitda, calculerDecotes, appliquerDecotes, WEIGHTS }
