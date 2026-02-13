// Module de calcul des ratios financiers
// Analyse complète de la santé financière d'une entreprise

import type { BilanAnnuel } from '@/lib/evaluation/types'

// ============================================
// TYPES
// ============================================

export interface RatiosFinanciers {
  // RENTABILITÉ
  margeBrute: number        // (CA - Achats) / CA
  margeEbitda: number       // EBITDA / CA
  margeEbit: number         // EBIT / CA (après amortissements)
  margeNette: number        // RN / CA
  roe: number               // RN / Capitaux propres

  // STRUCTURE FINANCIÈRE
  ratioEndettement: number  // Dettes financières / Capitaux propres
  detteNetteEbitda: number  // Dette nette / EBITDA
  autonomieFinanciere: number // Capitaux propres / Total bilan

  // LIQUIDITÉ
  liquiditeGenerale: number // Actif circulant / Passif circulant
  tresorerieNette: number   // Trésorerie - Dettes CT

  // BFR
  dso: number               // Délai clients (jours)
  dpo: number               // Délai fournisseurs (jours)
  bfrSurCa: number          // BFR / CA

  // CASH
  fcf: number               // Free Cash Flow
  fcfSurCa: number          // FCF / CA
  capexSurAmortissements: number // Capex / Amortissements
}

export interface SeuilsRatios {
  bon: number
  moyen: number
  mauvais: number
  sensPlusEstMieux: boolean // true = plus c'est haut mieux c'est
}

// ============================================
// SEUILS DE RÉFÉRENCE
// ============================================

export const SEUILS_RATIOS: Record<string, SeuilsRatios> = {
  margeBrute: { bon: 0.35, moyen: 0.25, mauvais: 0.15, sensPlusEstMieux: true },
  margeEbitda: { bon: 0.10, moyen: 0.06, mauvais: 0.03, sensPlusEstMieux: true },
  margeEbit: { bon: 0.07, moyen: 0.04, mauvais: 0.02, sensPlusEstMieux: true },
  margeNette: { bon: 0.05, moyen: 0.02, mauvais: 0.01, sensPlusEstMieux: true },
  roe: { bon: 0.15, moyen: 0.08, mauvais: 0.03, sensPlusEstMieux: true },

  ratioEndettement: { bon: 0.5, moyen: 1.0, mauvais: 2.0, sensPlusEstMieux: false },
  detteNetteEbitda: { bon: 1.5, moyen: 3.0, mauvais: 5.0, sensPlusEstMieux: false },
  autonomieFinanciere: { bon: 0.40, moyen: 0.25, mauvais: 0.15, sensPlusEstMieux: true },

  liquiditeGenerale: { bon: 1.5, moyen: 1.2, mauvais: 1.0, sensPlusEstMieux: true },

  dso: { bon: 45, moyen: 60, mauvais: 90, sensPlusEstMieux: false },
  dpo: { bon: 60, moyen: 45, mauvais: 30, sensPlusEstMieux: true },
  bfrSurCa: { bon: 0.10, moyen: 0.20, mauvais: 0.30, sensPlusEstMieux: false },

  fcfSurCa: { bon: 0.05, moyen: 0.02, mauvais: 0, sensPlusEstMieux: true },
  capexSurAmortissements: { bon: 1.0, moyen: 0.7, mauvais: 0.5, sensPlusEstMieux: true },
}

// Seuils par secteur
export const SEUILS_PAR_SECTEUR: Record<string, Partial<Record<string, SeuilsRatios>>> = {
  transport: {
    margeEbitda: { bon: 0.08, moyen: 0.05, mauvais: 0.03, sensPlusEstMieux: true },
    margeNette: { bon: 0.04, moyen: 0.02, mauvais: 0.01, sensPlusEstMieux: true },
  },
  restaurant: {
    margeEbitda: { bon: 0.12, moyen: 0.08, mauvais: 0.04, sensPlusEstMieux: true },
    margeNette: { bon: 0.08, moyen: 0.05, mauvais: 0.02, sensPlusEstMieux: true },
  },
  saas: {
    margeBrute: { bon: 0.75, moyen: 0.65, mauvais: 0.55, sensPlusEstMieux: true },
    margeEbitda: { bon: 0.20, moyen: 0.10, mauvais: 0.0, sensPlusEstMieux: true },
  },
  commerce: {
    margeBrute: { bon: 0.30, moyen: 0.25, mauvais: 0.20, sensPlusEstMieux: true },
    margeNette: { bon: 0.04, moyen: 0.02, mauvais: 0.01, sensPlusEstMieux: true },
  },
  btp: {
    margeEbitda: { bon: 0.08, moyen: 0.05, mauvais: 0.02, sensPlusEstMieux: true },
    bfrSurCa: { bon: 0.15, moyen: 0.25, mauvais: 0.35, sensPlusEstMieux: false },
  },
  services: {
    margeBrute: { bon: 0.50, moyen: 0.40, mauvais: 0.30, sensPlusEstMieux: true },
    margeEbitda: { bon: 0.18, moyen: 0.12, mauvais: 0.06, sensPlusEstMieux: true },
  },
}

// ============================================
// CALCUL DES RATIOS
// ============================================

/**
 * Calcule tous les ratios financiers à partir du bilan
 */
export function calculerRatios(bilan: BilanAnnuel, capex?: number): RatiosFinanciers {
  const ca = bilan.chiffreAffaires || 1
  const achats = bilan.achatsConsommes ?? ca * 0.6
  const _chargesExternes = bilan.chargesExternes ?? 0
  const _chargesPersonnel = bilan.chargesPersonnel ?? 0

  // EBITDA et EBIT
  const ebitda = bilan.resultatExploitation + (bilan.dotationsAmortissements ?? 0) + (bilan.dotationsProvisions ?? 0)
  const ebit = bilan.resultatExploitation
  const rn = bilan.resultatNet
  const cp = bilan.capitauxPropres || 1

  // Dettes et trésorerie
  const dettesFinancieres = bilan.empruntsEtablissementsCredit ?? bilan.dettesFinancieres ?? 0
  const tresorerie = bilan.disponibilites ?? 0
  const vmp = bilan.vmp ?? 0
  const detteNette = dettesFinancieres - tresorerie - vmp

  // BFR
  const stocks = bilan.stocks ?? 0
  const creancesClients = bilan.creancesClients ?? 0
  const dettesFournisseurs = bilan.dettesFournisseurs ?? 0
  const dettesFiscales = bilan.dettesFiscalesSociales ?? 0

  const actifCirculant = stocks + creancesClients + tresorerie + vmp
  const passifCirculant = dettesFournisseurs + dettesFiscales
  const totalBilan = cp + dettesFinancieres + passifCirculant
  const bfr = stocks + creancesClients - dettesFournisseurs

  // Free Cash Flow (approximation)
  const impots = bilan.impotSurBenefices ?? rn * 0.25
  const investissements = capex ?? bilan.dotationsAmortissements ?? 0
  const fcf = ebitda - impots - investissements

  return {
    // Rentabilité
    margeBrute: (ca - achats) / ca,
    margeEbitda: ebitda / ca,
    margeEbit: ebit / ca,
    margeNette: rn / ca,
    roe: cp > 0 ? rn / cp : 0,

    // Structure
    ratioEndettement: cp > 0 ? dettesFinancieres / cp : 0,
    detteNetteEbitda: ebitda > 0 ? detteNette / ebitda : 0,
    autonomieFinanciere: totalBilan > 0 ? cp / totalBilan : 0,

    // Liquidité
    liquiditeGenerale: passifCirculant > 0 ? actifCirculant / passifCirculant : 999,
    tresorerieNette: tresorerie + vmp - passifCirculant,

    // BFR
    dso: ca > 0 ? (creancesClients / ca) * 365 : 0,
    dpo: achats > 0 ? (dettesFournisseurs / achats) * 365 : 0,
    bfrSurCa: ca > 0 ? bfr / ca : 0,

    // Cash
    fcf,
    fcfSurCa: ca > 0 ? fcf / ca : 0,
    capexSurAmortissements: bilan.dotationsAmortissements
      ? (capex ?? bilan.dotationsAmortissements) / bilan.dotationsAmortissements
      : 1,
  }
}

// ============================================
// ÉVALUATION DES RATIOS
// ============================================

export type EvaluationRatio = 'bon' | 'moyen' | 'mauvais'

/**
 * Évalue un ratio par rapport aux seuils
 */
export function evaluerRatio(
  nomRatio: string,
  valeur: number,
  secteur?: string
): EvaluationRatio {
  // Chercher d'abord les seuils sectoriels
  let seuils = secteur ? SEUILS_PAR_SECTEUR[secteur]?.[nomRatio] : undefined
  // Sinon utiliser les seuils généraux
  if (!seuils) {
    seuils = SEUILS_RATIOS[nomRatio]
  }
  if (!seuils) return 'moyen'

  if (seuils.sensPlusEstMieux) {
    if (valeur >= seuils.bon) return 'bon'
    if (valeur >= seuils.moyen) return 'moyen'
    return 'mauvais'
  } else {
    if (valeur <= seuils.bon) return 'bon'
    if (valeur <= seuils.moyen) return 'moyen'
    return 'mauvais'
  }
}

/**
 * Retourne l'icône correspondant à l'évaluation
 */
export function getIconeEvaluation(evaluation: EvaluationRatio): string {
  switch (evaluation) {
    case 'bon':
      return '+'
    case 'moyen':
      return '~'
    case 'mauvais':
      return '!'
  }
}

// ============================================
// FORMATAGE
// ============================================

/**
 * Formate un ratio pour l'affichage
 */
export function formaterRatio(nomRatio: string, valeur: number): string {
  // Délais en jours
  if (['dso', 'dpo'].includes(nomRatio)) {
    return `${Math.round(valeur)} j`
  }

  // Multiples
  if (['detteNetteEbitda', 'liquiditeGenerale', 'capexSurAmortissements'].includes(nomRatio)) {
    return `${valeur.toFixed(1)}x`
  }

  // Montants
  if (['tresorerieNette', 'fcf'].includes(nomRatio)) {
    return formatMontant(valeur)
  }

  // Par défaut : pourcentage
  return `${(valeur * 100).toFixed(1)}%`
}

function formatMontant(montant: number): string {
  const absM = Math.abs(montant)
  const prefix = montant < 0 ? '-' : '+'

  if (absM >= 1_000_000) {
    return `${prefix}${(absM / 1_000_000).toFixed(1)}M€`
  }
  if (absM >= 1_000) {
    return `${prefix}${(absM / 1_000).toFixed(0)}k€`
  }
  return `${prefix}${absM.toFixed(0)}€`
}

// ============================================
// LABELS
// ============================================

export const LABELS_RATIOS: Record<string, { nom: string; description: string }> = {
  margeBrute: { nom: 'Marge brute', description: 'Rentabilite apres cout des ventes' },
  margeEbitda: { nom: 'Marge EBITDA', description: 'Rentabilite operationnelle brute' },
  margeEbit: { nom: 'Marge EBIT', description: 'Rentabilite apres amortissements' },
  margeNette: { nom: 'Marge nette', description: 'Rentabilite finale' },
  roe: { nom: 'ROE', description: 'Rentabilite des capitaux propres' },

  ratioEndettement: { nom: 'Endettement', description: 'Dettes / Capitaux propres' },
  detteNetteEbitda: { nom: 'Dette nette / EBITDA', description: 'Capacite de remboursement' },
  autonomieFinanciere: { nom: 'Autonomie financiere', description: 'Independance financiere' },

  liquiditeGenerale: { nom: 'Liquidite generale', description: 'Capacite a payer les dettes CT' },
  tresorerieNette: { nom: 'Tresorerie nette', description: 'Cash disponible' },

  dso: { nom: 'Delai clients (DSO)', description: 'Temps pour etre paye' },
  dpo: { nom: 'Delai fournisseurs (DPO)', description: 'Temps pour payer' },
  bfrSurCa: { nom: 'BFR / CA', description: 'Besoin en fonds de roulement' },

  fcf: { nom: 'Free Cash Flow', description: 'Cash reellement disponible' },
  fcfSurCa: { nom: 'FCF / CA', description: 'Conversion du CA en cash' },
  capexSurAmortissements: { nom: 'Capex / Amort.', description: 'Niveau d\'investissement' },
}
