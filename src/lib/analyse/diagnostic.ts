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
