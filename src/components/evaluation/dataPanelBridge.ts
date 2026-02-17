// Bridge : convertit entre ConversationContext et l'etat local du DataPanel
// Fonctions pures, pas de React

import type { ConversationContext, BilanAnnuel, ExtractedExercice } from '@/lib/anthropic'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditableBilan {
  annee: number
  chiffre_affaires: number | null
  resultat_net: number | null
  resultat_exploitation: number | null
  dotations_amortissements: number | null
  stocks: number | null
  creances_clients: number | null
  tresorerie: number | null
  capitaux_propres: number | null
  dettes_financieres: number | null
  dettes_fournisseurs: number | null
  provisions: number | null
}

export interface DataPanelState {
  financials: Record<number, EditableBilan>
  retraitements: {
    salaireDirigeant?: number | null
    loyerAnnuel?: number | null
    loyerMarche?: number | null
    loyerAppartientDirigeant?: boolean
    creditBailAnnuel?: number | null
    creditBailRestant?: number | null
    chargesExceptionnelles?: number | null
    produitsExceptionnels?: number | null
    salairesExcessifsFamille?: number | null
    salairesInsuffisantsFamille?: number | null
  }
  qualitativeData: {
    dependanceDirigeant?: 'faible' | 'moyenne' | 'forte' | null
    concentrationClients?: number | null
    participationMinoritaire?: boolean
    litiges?: boolean
    contratsCles?: boolean
  }
  saasMetrics: {
    mrr?: number | null
    churnMensuel?: number | null
    nrr?: number | null
    cac?: number | null
    cacPayback?: number | null
    runway?: number | null
    gmv?: number | null
  }
}

// ---------------------------------------------------------------------------
// Context → Panel State
// ---------------------------------------------------------------------------

// Convert 0 to null only for fields where 0 means "not available" (CA, RE, RN must be >0 to be meaningful)
// Keep 0 for balance-sheet fields where 0 is a valid value (tresorerie, dettes, etc.)
function toNullable(v: number): number | null {
  return v !== 0 ? v : null
}

function bilanToEditable(b: BilanAnnuel): EditableBilan {
  // If the bilan has any non-zero value, it's a real Pappers bilan — preserve zeros as real values
  const hasData = b.chiffre_affaires !== 0 || b.resultat_net !== 0 || b.resultat_exploitation !== 0 || b.tresorerie !== 0
  return {
    annee: b.annee,
    chiffre_affaires: hasData ? b.chiffre_affaires : null,
    resultat_net: hasData ? b.resultat_net : null,
    resultat_exploitation: hasData ? b.resultat_exploitation : null,
    dotations_amortissements: hasData ? b.dotations_amortissements : null,
    stocks: hasData ? toNullable(b.stocks) : null,
    creances_clients: hasData ? toNullable(b.creances_clients) : null,
    tresorerie: hasData ? b.tresorerie : null,
    capitaux_propres: hasData ? b.capitaux_propres : null,
    dettes_financieres: hasData ? b.dettes_financieres : null,
    dettes_fournisseurs: hasData ? toNullable(b.dettes_fournisseurs) : null,
    provisions: hasData ? toNullable(b.provisions) : null,
  }
}

function exerciceToEditable(ex: ExtractedExercice): EditableBilan {
  return {
    annee: ex.annee,
    chiffre_affaires: ex.ca,
    resultat_net: ex.resultat_net,
    resultat_exploitation: ex.resultat_exploitation,
    dotations_amortissements: ex.dotations_amortissements,
    stocks: ex.stocks,
    creances_clients: ex.creances_clients,
    tresorerie: ex.tresorerie,
    capitaux_propres: ex.capitaux_propres,
    dettes_financieres: ex.dettes_financieres,
    dettes_fournisseurs: ex.dettes_fournisseurs,
    provisions: null,
  }
}

function mergeEditable(base: EditableBilan, override: EditableBilan): EditableBilan {
  const merged = { ...base }
  for (const key of Object.keys(override) as (keyof EditableBilan)[]) {
    if (key === 'annee') continue
    if (override[key] != null) {
      (merged as Record<string, unknown>)[key] = override[key]
    }
  }
  return merged
}

export function contextToPanel(ctx: ConversationContext): DataPanelState {
  const financials: Record<number, EditableBilan> = {}

  // 1. Bilans Pappers (base)
  for (const b of ctx.financials?.bilans || []) {
    financials[b.annee] = bilanToEditable(b)
  }

  // 2. Merge extracted document data (override Pappers where doc data is more complete)
  if (ctx.extractedDocData?.exercices) {
    for (const ex of ctx.extractedDocData.exercices) {
      const docBilan = exerciceToEditable(ex)
      if (financials[ex.annee]) {
        financials[ex.annee] = mergeEditable(financials[ex.annee], docBilan)
      } else {
        financials[ex.annee] = docBilan
      }
    }
  }

  // 3. Ajouter annee courante + annee precedente si absentes
  const currentYear = new Date().getFullYear()
  if (!financials[currentYear]) {
    financials[currentYear] = emptyBilan(currentYear)
  }
  if (!financials[currentYear - 1]) {
    financials[currentYear - 1] = emptyBilan(currentYear - 1)
  }

  // Extract retraitements from document data (most recent exercice)
  const latestExercice = ctx.extractedDocData?.exercices?.[0]

  return {
    financials,
    retraitements: {
      salaireDirigeant: ctx.retraitements?.salaireDirigeant ?? latestExercice?.remuneration_dirigeant ?? null,
      loyerAnnuel: ctx.retraitements?.loyerAnnuel ?? latestExercice?.loyers ?? null,
      loyerMarche: ctx.retraitements?.loyerMarche ?? null,
      loyerAppartientDirigeant: ctx.retraitements?.loyerAppartientDirigeant,
      creditBailAnnuel: ctx.retraitements?.creditBailAnnuel ?? latestExercice?.credit_bail ?? null,
      creditBailRestant: ctx.retraitements?.creditBailRestant ?? null,
      chargesExceptionnelles: ctx.retraitements?.chargesExceptionnelles ?? null,
      produitsExceptionnels: ctx.retraitements?.produitsExceptionnels ?? null,
      salairesExcessifsFamille: ctx.retraitements?.salairesExcessifsFamille ?? null,
      salairesInsuffisantsFamille: ctx.retraitements?.salairesInsuffisantsFamille ?? null,
    },
    qualitativeData: {
      dependanceDirigeant: ctx.qualitativeData?.dependanceDirigeant ?? null,
      concentrationClients: ctx.qualitativeData?.concentrationClients ?? null,
      participationMinoritaire: ctx.qualitativeData?.participationMinoritaire,
      litiges: ctx.qualitativeData?.litiges,
      contratsCles: ctx.qualitativeData?.contratsCles,
    },
    saasMetrics: {
      mrr: ctx.saasMetrics?.mrr ?? null,
      churnMensuel: ctx.saasMetrics?.churnMensuel ?? null,
      nrr: ctx.saasMetrics?.nrr ?? null,
      cac: ctx.saasMetrics?.cac ?? null,
      cacPayback: ctx.saasMetrics?.cacPayback ?? null,
      runway: ctx.saasMetrics?.runway ?? null,
      gmv: ctx.saasMetrics?.gmv ?? null,
    },
  }
}

function emptyBilan(year: number): EditableBilan {
  return {
    annee: year,
    chiffre_affaires: null,
    resultat_net: null,
    resultat_exploitation: null,
    dotations_amortissements: null,
    stocks: null,
    creances_clients: null,
    tresorerie: null,
    capitaux_propres: null,
    dettes_financieres: null,
    dettes_fournisseurs: null,
    provisions: null,
  }
}

// ---------------------------------------------------------------------------
// Panel State → Context Update
// ---------------------------------------------------------------------------

function editableToBilan(e: EditableBilan): BilanAnnuel {
  return {
    annee: e.annee,
    chiffre_affaires: e.chiffre_affaires ?? 0,
    resultat_net: e.resultat_net ?? 0,
    resultat_exploitation: e.resultat_exploitation ?? 0,
    dotations_amortissements: e.dotations_amortissements ?? 0,
    stocks: e.stocks ?? 0,
    creances_clients: e.creances_clients ?? 0,
    tresorerie: e.tresorerie ?? 0,
    capitaux_propres: e.capitaux_propres ?? 0,
    dettes_financieres: e.dettes_financieres ?? 0,
    dettes_fournisseurs: e.dettes_fournisseurs ?? 0,
    provisions: e.provisions ?? 0,
  }
}

function stripNulls<T extends Record<string, unknown>>(obj: T): { [K in keyof T]?: NonNullable<T[K]> } {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value != null) {
      result[key] = value
    }
  }
  return result as { [K in keyof T]?: NonNullable<T[K]> }
}

export function panelToContext(
  panel: DataPanelState,
  existingCtx: ConversationContext
): ConversationContext {
  // Bilans : convert all editable bilans to BilanAnnuel, sorted desc by year
  const bilans = Object.values(panel.financials)
    .filter((b) => hasAnyFinancialData(b))
    .map(editableToBilan)
    .sort((a, b) => b.annee - a.annee)

  // Recalculate ratios from the most recent bilan
  const dernierBilan = bilans[0]
  const ratios = dernierBilan
    ? {
        margeNette:
          dernierBilan.chiffre_affaires > 0
            ? (dernierBilan.resultat_net / dernierBilan.chiffre_affaires) * 100
            : 0,
        margeEbitda:
          dernierBilan.chiffre_affaires > 0
            ? ((dernierBilan.resultat_exploitation + dernierBilan.dotations_amortissements) /
                dernierBilan.chiffre_affaires) *
              100
            : 0,
        ebitda: dernierBilan.resultat_exploitation + dernierBilan.dotations_amortissements,
        dso:
          dernierBilan.chiffre_affaires > 0
            ? (dernierBilan.creances_clients / dernierBilan.chiffre_affaires) * 365
            : 0,
        ratioEndettement:
          dernierBilan.capitaux_propres > 0
            ? dernierBilan.dettes_financieres / dernierBilan.capitaux_propres
            : 0,
      }
    : existingCtx.financials.ratios

  // Retraitements — only set fields that have values
  const retraitements = stripNulls(panel.retraitements)

  // Qualitative data
  const qualitativeData = stripNulls(panel.qualitativeData)

  // SaaS metrics — auto-calculate derived fields
  const saasMetrics = stripNulls(panel.saasMetrics) as ConversationContext['saasMetrics']
  if (saasMetrics && panel.saasMetrics.mrr != null) {
    saasMetrics.arr = panel.saasMetrics.mrr * 12
    if (panel.saasMetrics.churnMensuel != null && panel.saasMetrics.churnMensuel > 0) {
      saasMetrics.ltv = panel.saasMetrics.mrr / (panel.saasMetrics.churnMensuel / 100)
    }
  }

  return {
    ...existingCtx,
    financials: {
      ...existingCtx.financials,
      bilans: bilans.length > 0 ? bilans : existingCtx.financials.bilans,
      ratios,
    },
    retraitements:
      Object.keys(retraitements).length > 0
        ? { ...existingCtx.retraitements, ...retraitements }
        : existingCtx.retraitements,
    qualitativeData:
      Object.keys(qualitativeData).length > 0
        ? { ...existingCtx.qualitativeData, ...qualitativeData }
        : existingCtx.qualitativeData,
    saasMetrics:
      saasMetrics && Object.keys(saasMetrics).length > 0
        ? { ...existingCtx.saasMetrics, ...saasMetrics }
        : existingCtx.saasMetrics,
  }
}

function hasAnyFinancialData(b: EditableBilan): boolean {
  return (
    b.chiffre_affaires != null ||
    b.resultat_net != null ||
    b.resultat_exploitation != null ||
    b.tresorerie != null ||
    b.dettes_financieres != null ||
    b.capitaux_propres != null
  )
}

// ---------------------------------------------------------------------------
// Completeness
// ---------------------------------------------------------------------------

const FINANCIER_FIELDS: (keyof EditableBilan)[] = [
  'chiffre_affaires',
  'resultat_net',
  'resultat_exploitation',
  'dotations_amortissements',
  'stocks',
  'creances_clients',
  'tresorerie',
  'capitaux_propres',
  'dettes_financieres',
  'dettes_fournisseurs',
  'provisions',
]

const CRITICAL_FINANCIER_FIELDS: (keyof EditableBilan)[] = [
  'chiffre_affaires',
  'resultat_net',
  'resultat_exploitation',
]

export function computeCompleteness(
  panel: DataPanelState,
  tab: 'financier' | 'qualitatif' | 'saas',
  archetype?: string
): number {
  if (tab === 'financier') {
    // Only count bilans that have data (exclude empty future-year tabs)
    const years = Object.values(panel.financials).filter((b) => hasAnyFinancialData(b))
    if (years.length === 0) return 0
    let total = 0
    let filled = 0
    for (const bilan of years) {
      for (const field of FINANCIER_FIELDS) {
        const weight = CRITICAL_FINANCIER_FIELDS.includes(field) ? 2 : 1
        total += weight
        // Check non-null AND non-zero: the null→0→non-null round-trip
        // (editableToBilan converts null to 0, bilanToEditable keeps 0 as non-null)
        // inflates unfilled fields. Only count genuinely filled values.
        if (bilan[field] != null && bilan[field] !== 0) filled += weight
      }
    }
    return total > 0 ? Math.round((filled / total) * 100) : 0
  }

  if (tab === 'qualitatif') {
    const fields = [
      panel.retraitements.salaireDirigeant,
      panel.retraitements.loyerAnnuel,
      panel.retraitements.chargesExceptionnelles,
      panel.qualitativeData.dependanceDirigeant,
      panel.qualitativeData.concentrationClients,
    ]
    const filled = fields.filter((v) => v != null).length
    return Math.round((filled / fields.length) * 100)
  }

  if (tab === 'saas') {
    if (!archetype?.startsWith('saas_') && archetype !== 'marketplace') return 0
    const fields = [
      panel.saasMetrics.mrr,
      panel.saasMetrics.churnMensuel,
      panel.saasMetrics.nrr,
      panel.saasMetrics.cac,
    ]
    const filled = fields.filter((v) => v != null).length
    return Math.round((filled / fields.length) * 100)
  }

  return 0
}

export function computeOverallCompleteness(
  panel: DataPanelState,
  archetype?: string
): number {
  const hasSaaS = archetype?.startsWith('saas_') || archetype === 'marketplace'

  const financier = computeCompleteness(panel, 'financier', archetype)
  const qualitatif = computeCompleteness(panel, 'qualitatif', archetype)

  if (hasSaaS) {
    const saas = computeCompleteness(panel, 'saas', archetype)
    return Math.round(financier * 0.5 + qualitatif * 0.3 + saas * 0.2)
  }

  return Math.round(financier * 0.6 + qualitatif * 0.4)
}
