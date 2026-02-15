// Module de diagnostic financier complet
// Génère une analyse structurée de la santé financière

import type { BilanAnnuel } from '@/lib/evaluation/types'
import {
  RatiosFinanciers,
  calculerRatios,
  evaluerRatio,
  formaterRatio,
  getIconeEvaluation,
  LABELS_RATIOS,
  EvaluationRatio,
} from './ratios'

// ============================================
// TYPES
// ============================================

export interface LigneRatio {
  cle: string
  nom: string
  description: string
  valeur: number
  valeurFormatee: string
  medianneSecteur?: number
  medianneSecteurFormatee?: string
  evaluation: EvaluationRatio
  icone: string
}

export interface CategorieRatios {
  nom: string
  ratios: LigneRatio[]
}

export interface DiagnosticFinancier {
  rentabilite: LigneRatio[]
  structure: LigneRatio[]
  liquidite: LigneRatio[]
  bfr: LigneRatio[]
  cash: LigneRatio[]

  categories: CategorieRatios[]

  synthese: {
    pointsForts: string[]
    pointsVigilance: string[]
    noteGlobale: 'A' | 'B' | 'C' | 'D' | 'E'
    score: number
  }
}

// ============================================
// GÉNÉRATION DU DIAGNOSTIC
// ============================================

/**
 * Génère le diagnostic financier complet
 */
export function genererDiagnostic(
  bilan: BilanAnnuel,
  secteur?: string,
  capex?: number,
  benchmarkSecteur?: Partial<RatiosFinanciers>
): DiagnosticFinancier {
  const ratios = calculerRatios(bilan, capex)

  function creerLigne(cle: keyof RatiosFinanciers): LigneRatio {
    const valeur = ratios[cle]
    const evaluation = evaluerRatio(cle, valeur, secteur)
    const label = LABELS_RATIOS[cle] || { nom: cle, description: '' }

    return {
      cle,
      nom: label.nom,
      description: label.description,
      valeur,
      valeurFormatee: formaterRatio(cle, valeur),
      medianneSecteur: benchmarkSecteur?.[cle],
      medianneSecteurFormatee: benchmarkSecteur?.[cle]
        ? formaterRatio(cle, benchmarkSecteur[cle]!)
        : undefined,
      evaluation,
      icone: getIconeEvaluation(evaluation),
    }
  }

  // Catégories de ratios
  const rentabilite: LigneRatio[] = [
    creerLigne('margeBrute'),
    creerLigne('margeEbitda'),
    creerLigne('margeEbit'),
    creerLigne('margeNette'),
    creerLigne('roe'),
  ]

  const structure: LigneRatio[] = [
    creerLigne('ratioEndettement'),
    creerLigne('detteNetteEbitda'),
    creerLigne('autonomieFinanciere'),
  ]

  const liquidite: LigneRatio[] = [
    creerLigne('liquiditeGenerale'),
    creerLigne('tresorerieNette'),
  ]

  const bfr: LigneRatio[] = [
    creerLigne('dso'),
    creerLigne('dpo'),
    creerLigne('bfrSurCa'),
  ]

  const cash: LigneRatio[] = [
    creerLigne('fcf'),
    creerLigne('fcfSurCa'),
    creerLigne('capexSurAmortissements'),
  ]

  // Catégories pour l'affichage
  const categories: CategorieRatios[] = [
    { nom: 'Rentabilite', ratios: rentabilite },
    { nom: 'Structure financiere', ratios: structure },
    { nom: 'Liquidite', ratios: liquidite },
    { nom: 'BFR', ratios: bfr },
    { nom: 'Generation de cash', ratios: cash },
  ]

  // Synthèse
  const toutesLignes = [...rentabilite, ...structure, ...liquidite, ...bfr, ...cash]
  const nbBons = toutesLignes.filter((l) => l.evaluation === 'bon').length
  const nbMoyens = toutesLignes.filter((l) => l.evaluation === 'moyen').length
  const _nbMauvais = toutesLignes.filter((l) => l.evaluation === 'mauvais').length

  // Points forts = ratios "bons"
  const pointsForts = toutesLignes
    .filter((l) => l.evaluation === 'bon')
    .map((l) => `${l.nom} : ${l.valeurFormatee}`)

  // Points de vigilance = ratios "mauvais"
  const pointsVigilance = toutesLignes
    .filter((l) => l.evaluation === 'mauvais')
    .map((l) => `${l.nom} : ${l.valeurFormatee}`)

  // Score et note globale
  const score = (nbBons * 2 + nbMoyens * 1) / (toutesLignes.length * 2) * 100
  let noteGlobale: 'A' | 'B' | 'C' | 'D' | 'E'
  if (score >= 80) noteGlobale = 'A'
  else if (score >= 65) noteGlobale = 'B'
  else if (score >= 50) noteGlobale = 'C'
  else if (score >= 35) noteGlobale = 'D'
  else noteGlobale = 'E'

  return {
    rentabilite,
    structure,
    liquidite,
    bfr,
    cash,
    categories,
    synthese: {
      pointsForts,
      pointsVigilance,
      noteGlobale,
      score: Math.round(score),
    },
  }
}

// ============================================
// AJUSTEMENT CONTEXTUEL DU SCORE
// ============================================

export interface ScoreAjustement {
  label: string
  points: number
  reason: string
}

/**
 * Applique des ajustements contextuels au score de base du diagnostic.
 * Appelé par l'API diagnostic (sans pappersContext) et le pipeline PDF (avec pappersContext).
 */
export function ajusterScoreDiagnostic(
  baseScore: number,
  input: {
    revenue?: number
    ebitda?: number
    growth?: number
    recurring?: number
    masseSalariale?: number
    concentrationClient?: number
    remunerationDirigeant?: number
    dettesFinancieres?: number
    tresorerieActuelle?: number
    mrrMensuel?: number
  },
  pappersContext?: {
    nombreBilans: number
    dernierBilanAge: number
    ancienneteAnnees: number
    ebitdaNegatif2Ans: boolean
  }
): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'E'; ajustements: ScoreAjustement[] } {
  const ajustements: ScoreAjustement[] = []
  let plafond = 100
  let plancher = 0

  // --- MALUS ---

  // CA < 50k → plafond score 65 (B max)
  if (input.revenue != null && input.revenue < 50_000 && input.revenue > 0) {
    plafond = 65
    ajustements.push({ label: 'CA < 50k€', points: 0, reason: 'Score plafonné à 65 (B max)' })
  }

  // Concentration client > 50% → -15 ; > 30% → -5
  if (input.concentrationClient != null) {
    if (input.concentrationClient > 50) {
      ajustements.push({ label: 'Concentration client > 50%', points: -15, reason: 'Dépendance critique à quelques clients' })
    } else if (input.concentrationClient > 30) {
      ajustements.push({ label: 'Concentration client > 30%', points: -5, reason: 'Concentration client élevée' })
    }
  }

  // P2: Rémunération dirigeant = 0 → malus variable selon le profil
  if (input.remunerationDirigeant === 0 && input.revenue != null && input.revenue > 0) {
    if (input.revenue < 100_000) {
      // Micro non valorisable : EBITDA = salaire déguisé, transférabilité nulle
      plafond = Math.min(plafond, 40)
      ajustements.push({ label: 'Micro non valorisable', points: -10, reason: 'CA < 100k€ + rémunération 0€ — EBITDA fictif, transférabilité nulle' })
    } else if (input.masseSalariale != null && input.masseSalariale <= 5) {
      // Solo > 100k avec rému 0 : EBITDA non représentatif
      plafond = Math.min(plafond, 55)
      ajustements.push({ label: 'Solo non rémunéré', points: -10, reason: 'Rémunération 0€ + activité solo — EBITDA non représentatif' })
    } else {
      ajustements.push({ label: 'Dirigeant non rémunéré', points: -5, reason: 'Rémunération dirigeant à 0 sur CA > 100k€' })
    }
  }

  // Croissance < 0 → -10
  if (input.growth != null && input.growth < 0) {
    ajustements.push({ label: 'CA en décroissance', points: -10, reason: `Croissance négative (${input.growth}%)` })
  }

  // EBITDA < 0 → -10
  if (input.ebitda != null && input.ebitda < 0) {
    ajustements.push({ label: 'EBITDA négatif', points: -10, reason: "L'entreprise n'est pas rentable" })
  }

  // EBITDA négatif 2 ans consécutifs (pappersContext) → -5
  if (pappersContext?.ebitdaNegatif2Ans) {
    ajustements.push({ label: 'EBITDA négatif 2 ans', points: -5, reason: 'Pertes consécutives sur 2 exercices' })
  }

  // Masse salariale > 60% → -5
  if (input.masseSalariale != null && input.masseSalariale > 60) {
    ajustements.push({ label: 'Masse salariale > 60%', points: -5, reason: 'Charges de personnel très élevées' })
  }

  // Dernier bilan > 18 mois (pappersContext) → -10
  if (pappersContext && pappersContext.dernierBilanAge > 18) {
    ajustements.push({ label: 'Bilan ancien (> 18 mois)', points: -10, reason: 'Données financières potentiellement obsolètes' })
  }

  // Moins de 2 bilans (pappersContext) → -5
  if (pappersContext && pappersContext.nombreBilans < 2) {
    ajustements.push({ label: 'Historique limité', points: -5, reason: 'Moins de 2 bilans disponibles' })
  }

  // Ancienneté > 3 ans et CA < 100k (pappersContext) → -10
  if (pappersContext && pappersContext.ancienneteAnnees > 3 && input.revenue != null && input.revenue < 100_000) {
    ajustements.push({ label: 'Entreprise mature à faible CA', points: -10, reason: 'Plus de 3 ans d\'ancienneté avec CA < 100k€' })
  }

  // --- BONUS ---

  // Croissance > 40% → +5
  if (input.growth != null && input.growth > 40) {
    ajustements.push({ label: 'Forte croissance', points: +5, reason: `Croissance > 40% (${input.growth}%)` })
  }

  // Récurrence > 80% → +5
  if (input.recurring != null && input.recurring > 80) {
    ajustements.push({ label: 'Récurrence élevée', points: +5, reason: `${input.recurring}% de revenus récurrents` })
  }

  // Ancienneté > 10 ans et croissance >= 0 (pappersContext) → +5
  if (pappersContext && pappersContext.ancienneteAnnees > 10 && input.growth != null && input.growth >= 0) {
    ajustements.push({ label: 'Entreprise établie', points: +5, reason: 'Plus de 10 ans avec croissance positive' })
  }

  // Concentration client < 10% → +3
  if (input.concentrationClient != null && input.concentrationClient < 10) {
    ajustements.push({ label: 'Base client diversifiée', points: +3, reason: 'Concentration < 10%, portefeuille diversifié' })
  }

  // P1: Hyper-croissance avec MRR (SaaS/Marketplace)
  // L'EBITDA négatif est structurel dans ce modèle → plancher pour ne pas sous-noter
  // Seuil : CA >= 200k (sinon c'est du pré-revenu, pas de l'hyper-croissance)
  if (input.growth != null && input.growth > 40
    && input.mrrMensuel != null && input.mrrMensuel > 0
    && input.revenue != null && input.revenue >= 200_000) {
    if (input.growth > 60) {
      plancher = Math.max(plancher, 70)
      ajustements.push({ label: 'Hyper-croissance SaaS/Marketplace', points: 0, reason: `Plancher B+ : croissance ${input.growth}% avec MRR ${input.mrrMensuel}€/mois — EBITDA négatif attendu` })
    } else {
      plancher = Math.max(plancher, 65)
      ajustements.push({ label: 'Croissance SaaS/Marketplace', points: 0, reason: `Plancher B : croissance ${input.growth}% avec MRR — modèle en phase d'investissement` })
    }
  }

  // Calcul final
  const totalPoints = ajustements.reduce((sum, a) => sum + a.points, 0)
  const rawScore = Math.round(baseScore + totalPoints)
  const score = Math.max(plancher, Math.min(plafond, rawScore))

  let grade: 'A' | 'B' | 'C' | 'D' | 'E'
  if (score >= 80) grade = 'A'
  else if (score >= 65) grade = 'B'
  else if (score >= 50) grade = 'C'
  else if (score >= 35) grade = 'D'
  else grade = 'E'

  return { score, grade, ajustements }
}

// ============================================
// GÉNÉRATION D'EXPLICATION
// ============================================

/**
 * Génère une explication textuelle du diagnostic
 */
export function genererExplicationDiagnostic(diagnostic: DiagnosticFinancier): string {
  const lignes: string[] = []

  lignes.push(`# Diagnostic Financier - Note ${diagnostic.synthese.noteGlobale}`)
  lignes.push('')

  // Points forts
  if (diagnostic.synthese.pointsForts.length > 0) {
    lignes.push('## Points forts')
    diagnostic.synthese.pointsForts.forEach((p) => {
      lignes.push(`+ ${p}`)
    })
    lignes.push('')
  }

  // Points de vigilance
  if (diagnostic.synthese.pointsVigilance.length > 0) {
    lignes.push('## Points de vigilance')
    diagnostic.synthese.pointsVigilance.forEach((p) => {
      lignes.push(`! ${p}`)
    })
    lignes.push('')
  }

  // Détail par catégorie
  for (const cat of diagnostic.categories) {
    lignes.push(`## ${cat.nom}`)
    lignes.push('')
    lignes.push('| Ratio | Valeur | Statut |')
    lignes.push('|-------|--------|--------|')
    for (const r of cat.ratios) {
      const status = r.evaluation === 'bon' ? '+' : r.evaluation === 'mauvais' ? '!' : '~'
      lignes.push(`| ${r.nom} | ${r.valeurFormatee} | ${status} |`)
    }
    lignes.push('')
  }

  return lignes.join('\n')
}

// ============================================
// COMPARAISON TEMPORELLE
// ============================================

export interface EvolutionRatio {
  cle: string
  nom: string
  valeurN: number
  valeurN1: number
  variation: number
  variationPourcent: number
  tendance: 'hausse' | 'baisse' | 'stable'
  tendancePositive: boolean
}

/**
 * Compare les ratios entre deux années
 */
export function comparerRatios(
  bilanN: BilanAnnuel,
  bilanN1: BilanAnnuel
): EvolutionRatio[] {
  const ratiosN = calculerRatios(bilanN)
  const ratiosN1 = calculerRatios(bilanN1)

  const evolutions: EvolutionRatio[] = []

  const clesPrincipales: (keyof RatiosFinanciers)[] = [
    'margeEbitda',
    'margeNette',
    'roe',
    'ratioEndettement',
    'liquiditeGenerale',
    'dso',
    'fcfSurCa',
  ]

  for (const cle of clesPrincipales) {
    const valeurN = ratiosN[cle]
    const valeurN1 = ratiosN1[cle]
    const variation = valeurN - valeurN1
    const variationPourcent = valeurN1 !== 0 ? (variation / Math.abs(valeurN1)) * 100 : 0

    let tendance: 'hausse' | 'baisse' | 'stable'
    if (Math.abs(variationPourcent) < 5) {
      tendance = 'stable'
    } else if (variation > 0) {
      tendance = 'hausse'
    } else {
      tendance = 'baisse'
    }

    // Déterminer si la tendance est positive
    // Pour la plupart des ratios, hausse = positif
    // Sauf pour endettement et DSO où baisse = positif
    const sensInverse = ['ratioEndettement', 'dso', 'bfrSurCa'].includes(cle)
    const tendancePositive = sensInverse
      ? tendance === 'baisse' || tendance === 'stable'
      : tendance === 'hausse' || tendance === 'stable'

    const label = LABELS_RATIOS[cle] || { nom: cle }

    evolutions.push({
      cle,
      nom: label.nom,
      valeurN,
      valeurN1,
      variation,
      variationPourcent,
      tendance,
      tendancePositive,
    })
  }

  return evolutions
}
