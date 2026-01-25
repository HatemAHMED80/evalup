// Module d'analyse financière
// Calcule les indicateurs de performance et les points forts/faibles

import { BilanNormalise, DonneesEntreprisePappers } from './pappers'
import { getSecteurByCode } from './secteurs'

// ============================================================
// TYPES
// ============================================================

export interface PointAnalyse {
  titre: string
  description: string
  type: 'fort' | 'vigilance' | 'neutre'
  importance: 'haute' | 'moyenne' | 'basse'
}

export interface AnalyseFinanciere {
  // Indicateurs de performance
  indicateurs: {
    // Marges
    margeNette: number | null
    margeEbitda: number | null
    margeBrute: number | null

    // Croissance
    croissanceCA: number | null
    croissanceResultat: number | null

    // Rentabilité
    rentabiliteCapitauxPropres: number | null // ROE

    // Structure
    ratioEndettement: number | null
    couvertureDetteParEbitda: number | null // Dette nette / EBITDA
    bfrEnJoursCA: number | null
  }

  // Points forts et de vigilance
  pointsForts: PointAnalyse[]
  pointsVigilance: PointAnalyse[]

  // Tendance générale
  tendance: 'croissance' | 'stable' | 'decroissance' | 'inconnue'
  scoreGlobal: number // 0-100

  // Comparaison sectorielle
  comparaisonSecteur: {
    margeNetteVsSecteur: 'superieure' | 'inferieure' | 'conforme' | 'inconnue'
    ecartMarge: number | null
  }
}

export interface ValorisationComplete {
  // Valeur d'entreprise (EV)
  valeurEntreprise: {
    basse: number
    moyenne: number
    haute: number
  }

  // Ajustements pour obtenir le prix de cession
  ajustements: {
    tresorerie: number // + (on ajoute)
    detteNette: number // - (on soustrait)
    ajustementBfr: number // ± selon BFR normatif
  }

  // Prix de cession final
  prixCession: {
    bas: number
    moyen: number
    haut: number
  }

  // Détail des méthodes
  methodes: {
    multipleCA: {
      valeur: number
      multiple: { min: number; max: number }
    }
    multipleEbitda: {
      valeur: number
      multiple: { min: number; max: number }
    }
  }

  // Explications
  hypotheses: string[]
}

// ============================================================
// FONCTIONS D'ANALYSE
// ============================================================

export function analyserEntreprise(entreprise: DonneesEntreprisePappers): AnalyseFinanciere {
  const bilans = entreprise.bilans
  const secteur = entreprise.secteurEvalup ? getSecteurByCode(entreprise.secteurEvalup) ?? undefined : undefined

  // Dernier bilan disponible
  const dernierBilan = bilans.length > 0 ? bilans[0] : null

  // Calcul des indicateurs
  const indicateurs = calculerIndicateurs(bilans, entreprise)

  // Déterminer les points forts et de vigilance
  const { pointsForts, pointsVigilance } = determinerPoints(entreprise, indicateurs, secteur)

  // Tendance
  const tendance = determinerTendance(entreprise.evolutionCA)

  // Score global
  const scoreGlobal = calculerScoreGlobal(pointsForts, pointsVigilance, indicateurs)

  // Comparaison sectorielle
  const comparaisonSecteur = comparerAuSecteur(indicateurs, secteur)

  return {
    indicateurs,
    pointsForts,
    pointsVigilance,
    tendance,
    scoreGlobal,
    comparaisonSecteur,
  }
}

function calculerIndicateurs(
  bilans: BilanNormalise[],
  entreprise: DonneesEntreprisePappers
): AnalyseFinanciere['indicateurs'] {
  const dernierBilan = bilans.length > 0 ? bilans[0] : null

  if (!dernierBilan) {
    return {
      margeNette: null,
      margeEbitda: null,
      margeBrute: null,
      croissanceCA: entreprise.evolutionCA,
      croissanceResultat: entreprise.evolutionResultat,
      rentabiliteCapitauxPropres: null,
      ratioEndettement: null,
      couvertureDetteParEbitda: null,
      bfrEnJoursCA: null,
    }
  }

  // Marges
  const margeNette = dernierBilan.margeNette
  const margeEbitda = dernierBilan.margeEbitda

  // ROE (Return on Equity)
  const rentabiliteCapitauxPropres =
    dernierBilan.capitauxPropres > 0
      ? Math.round((dernierBilan.resultatNet / dernierBilan.capitauxPropres) * 100 * 10) / 10
      : null

  // Ratio d'endettement
  const ratioEndettement = dernierBilan.ratioEndettement

  // Couverture de la dette par l'EBITDA
  const couvertureDetteParEbitda =
    dernierBilan.ebitda > 0
      ? Math.round((dernierBilan.detteNette / dernierBilan.ebitda) * 10) / 10
      : null

  // BFR en jours de CA
  const bfrEnJoursCA =
    dernierBilan.chiffreAffaires > 0
      ? Math.round((dernierBilan.bfr / dernierBilan.chiffreAffaires) * 365)
      : null

  return {
    margeNette,
    margeEbitda,
    margeBrute: null, // Nécessiterait le coût des ventes
    croissanceCA: entreprise.evolutionCA,
    croissanceResultat: entreprise.evolutionResultat,
    rentabiliteCapitauxPropres,
    ratioEndettement,
    couvertureDetteParEbitda,
    bfrEnJoursCA,
  }
}

function determinerPoints(
  entreprise: DonneesEntreprisePappers,
  indicateurs: AnalyseFinanciere['indicateurs'],
  secteur: ReturnType<typeof getSecteurByCode>
): { pointsForts: PointAnalyse[]; pointsVigilance: PointAnalyse[] } {
  const pointsForts: PointAnalyse[] = []
  const pointsVigilance: PointAnalyse[] = []

  const dernierBilan = entreprise.bilans.length > 0 ? entreprise.bilans[0] : null

  // === POINTS FORTS ===

  // Croissance du CA
  if (entreprise.evolutionCA !== null && entreprise.evolutionCA > 10) {
    pointsForts.push({
      titre: 'Forte croissance',
      description: `Chiffre d'affaires en hausse de ${entreprise.evolutionCA}% sur les dernières années`,
      type: 'fort',
      importance: 'haute',
    })
  } else if (entreprise.evolutionCA !== null && entreprise.evolutionCA > 0) {
    pointsForts.push({
      titre: 'Croissance positive',
      description: `Chiffre d'affaires en progression de ${entreprise.evolutionCA}%`,
      type: 'fort',
      importance: 'moyenne',
    })
  }

  // Marge nette vs secteur
  if (secteur && indicateurs.margeNette !== null) {
    if (indicateurs.margeNette > secteur.margeNetteMoyenne + 5) {
      pointsForts.push({
        titre: 'Rentabilité excellente',
        description: `Marge nette de ${indicateurs.margeNette}% supérieure à la moyenne du secteur (${secteur.margeNetteMoyenne}%)`,
        type: 'fort',
        importance: 'haute',
      })
    } else if (indicateurs.margeNette >= secteur.margeNetteMoyenne) {
      pointsForts.push({
        titre: 'Bonne rentabilité',
        description: `Marge nette de ${indicateurs.margeNette}% conforme au secteur`,
        type: 'fort',
        importance: 'moyenne',
      })
    }
  }

  // Trésorerie positive et confortable
  if (dernierBilan && dernierBilan.tresorerie > 0) {
    const moisDeCharges = dernierBilan.chiffreAffaires > 0
      ? (dernierBilan.tresorerie / (dernierBilan.chiffreAffaires / 12))
      : 0

    if (moisDeCharges >= 3) {
      pointsForts.push({
        titre: 'Trésorerie solide',
        description: `${Math.round(moisDeCharges)} mois de CA en trésorerie`,
        type: 'fort',
        importance: 'haute',
      })
    } else if (moisDeCharges >= 1) {
      pointsForts.push({
        titre: 'Trésorerie positive',
        description: `${Math.round(moisDeCharges * 10) / 10} mois de CA en trésorerie`,
        type: 'fort',
        importance: 'moyenne',
      })
    }
  }

  // Pas de dettes financières
  if (dernierBilan && dernierBilan.dettesFinancieres === 0) {
    pointsForts.push({
      titre: 'Aucune dette financière',
      description: "L'entreprise n'a pas d'emprunts bancaires",
      type: 'fort',
      importance: 'haute',
    })
  }

  // Ancienneté
  if (entreprise.anciennete >= 10) {
    pointsForts.push({
      titre: 'Entreprise mature',
      description: `${entreprise.anciennete} ans d'existence - stabilité prouvée`,
      type: 'fort',
      importance: 'moyenne',
    })
  } else if (entreprise.anciennete >= 5) {
    pointsForts.push({
      titre: 'Track record solide',
      description: `${entreprise.anciennete} ans d'existence`,
      type: 'fort',
      importance: 'basse',
    })
  }

  // Capitaux propres solides
  if (dernierBilan && dernierBilan.capitauxPropres > 0) {
    if (indicateurs.ratioEndettement !== null && indicateurs.ratioEndettement < 0.5) {
      pointsForts.push({
        titre: 'Structure financière saine',
        description: `Faible endettement (ratio ${Math.round(indicateurs.ratioEndettement * 100)}%)`,
        type: 'fort',
        importance: 'moyenne',
      })
    }
  }

  // === POINTS DE VIGILANCE ===

  // Entreprise cessée
  if (entreprise.entrepriseCessee) {
    pointsVigilance.push({
      titre: 'Entreprise cessée',
      description: "L'activité de cette entreprise est officiellement arrêtée",
      type: 'vigilance',
      importance: 'haute',
    })
  }

  // CA en décroissance
  if (entreprise.evolutionCA !== null && entreprise.evolutionCA < -10) {
    pointsVigilance.push({
      titre: 'Forte baisse du CA',
      description: `Chiffre d'affaires en baisse de ${Math.abs(entreprise.evolutionCA)}%`,
      type: 'vigilance',
      importance: 'haute',
    })
  } else if (entreprise.evolutionCA !== null && entreprise.evolutionCA < 0) {
    pointsVigilance.push({
      titre: 'CA en recul',
      description: `Chiffre d'affaires en baisse de ${Math.abs(entreprise.evolutionCA)}%`,
      type: 'vigilance',
      importance: 'moyenne',
    })
  }

  // Marge nette négative ou faible
  if (indicateurs.margeNette !== null) {
    if (indicateurs.margeNette < 0) {
      pointsVigilance.push({
        titre: 'Entreprise déficitaire',
        description: `Marge nette négative de ${indicateurs.margeNette}%`,
        type: 'vigilance',
        importance: 'haute',
      })
    } else if (secteur && indicateurs.margeNette < secteur.margeNetteMoyenne - 5) {
      pointsVigilance.push({
        titre: 'Rentabilité insuffisante',
        description: `Marge nette de ${indicateurs.margeNette}% inférieure au secteur (${secteur.margeNetteMoyenne}%)`,
        type: 'vigilance',
        importance: 'moyenne',
      })
    }
  }

  // Dette nette élevée
  if (dernierBilan && dernierBilan.ebitda > 0) {
    const ratioDetteEbitda = dernierBilan.detteNette / dernierBilan.ebitda

    if (ratioDetteEbitda > 3) {
      pointsVigilance.push({
        titre: 'Endettement élevé',
        description: `Dette nette représente ${ratioDetteEbitda.toFixed(1)}x l'EBITDA`,
        type: 'vigilance',
        importance: 'haute',
      })
    } else if (ratioDetteEbitda > 2) {
      pointsVigilance.push({
        titre: 'Endettement à surveiller',
        description: `Dette nette représente ${ratioDetteEbitda.toFixed(1)}x l'EBITDA`,
        type: 'vigilance',
        importance: 'moyenne',
      })
    }
  }

  // Capitaux propres négatifs
  if (dernierBilan && dernierBilan.capitauxPropres < 0) {
    pointsVigilance.push({
      titre: 'Capitaux propres négatifs',
      description: "Les pertes cumulées dépassent le capital - situation de quasi-faillite",
      type: 'vigilance',
      importance: 'haute',
    })
  }

  // Jeune entreprise
  if (entreprise.anciennete < 3) {
    pointsVigilance.push({
      titre: 'Entreprise récente',
      description: `Seulement ${entreprise.anciennete} an(s) d'existence - historique limité`,
      type: 'vigilance',
      importance: 'moyenne',
    })
  }

  // Peu de bilans disponibles
  if (entreprise.bilans.length < 2) {
    pointsVigilance.push({
      titre: 'Données financières limitées',
      description: `Seulement ${entreprise.bilans.length} bilan(s) disponible(s)`,
      type: 'vigilance',
      importance: 'basse',
    })
  }

  // Petite équipe (risque de dépendance)
  if (entreprise.effectif !== null && entreprise.effectif < 3) {
    pointsVigilance.push({
      titre: 'Équipe réduite',
      description: `Seulement ${entreprise.effectif} employé(s) - risque de dépendance au dirigeant`,
      type: 'vigilance',
      importance: 'moyenne',
    })
  }

  return { pointsForts, pointsVigilance }
}

function determinerTendance(evolutionCA: number | null): AnalyseFinanciere['tendance'] {
  if (evolutionCA === null) return 'inconnue'
  if (evolutionCA > 5) return 'croissance'
  if (evolutionCA < -5) return 'decroissance'
  return 'stable'
}

function calculerScoreGlobal(
  pointsForts: PointAnalyse[],
  pointsVigilance: PointAnalyse[],
  indicateurs: AnalyseFinanciere['indicateurs']
): number {
  let score = 50 // Score de base

  // Points forts ajoutent des points
  for (const point of pointsForts) {
    switch (point.importance) {
      case 'haute':
        score += 10
        break
      case 'moyenne':
        score += 5
        break
      case 'basse':
        score += 2
        break
    }
  }

  // Points de vigilance retirent des points
  for (const point of pointsVigilance) {
    switch (point.importance) {
      case 'haute':
        score -= 15
        break
      case 'moyenne':
        score -= 8
        break
      case 'basse':
        score -= 3
        break
    }
  }

  // Bonus/malus supplémentaires basés sur les indicateurs
  if (indicateurs.margeNette !== null) {
    if (indicateurs.margeNette > 15) score += 5
    if (indicateurs.margeNette < 0) score -= 10
  }

  if (indicateurs.croissanceCA !== null) {
    if (indicateurs.croissanceCA > 20) score += 5
    if (indicateurs.croissanceCA < -20) score -= 10
  }

  // Normaliser entre 0 et 100
  return Math.max(0, Math.min(100, Math.round(score)))
}

function comparerAuSecteur(
  indicateurs: AnalyseFinanciere['indicateurs'],
  secteur: ReturnType<typeof getSecteurByCode>
): AnalyseFinanciere['comparaisonSecteur'] {
  if (!secteur || indicateurs.margeNette === null) {
    return {
      margeNetteVsSecteur: 'inconnue',
      ecartMarge: null,
    }
  }

  const ecart = indicateurs.margeNette - secteur.margeNetteMoyenne

  let comparaison: 'superieure' | 'inferieure' | 'conforme'
  if (ecart > 3) {
    comparaison = 'superieure'
  } else if (ecart < -3) {
    comparaison = 'inferieure'
  } else {
    comparaison = 'conforme'
  }

  return {
    margeNetteVsSecteur: comparaison,
    ecartMarge: Math.round(ecart * 10) / 10,
  }
}

// ============================================================
// VALORISATION
// ============================================================

export function calculerValorisationComplete(
  entreprise: DonneesEntreprisePappers,
  analyse: AnalyseFinanciere
): ValorisationComplete | null {
  const dernierBilan = entreprise.bilans.length > 0 ? entreprise.bilans[0] : null

  // Si pas de données financières, impossible de valoriser
  if (!dernierBilan || dernierBilan.chiffreAffaires === 0) {
    return null
  }

  const secteur = entreprise.secteurEvalup ? getSecteurByCode(entreprise.secteurEvalup) ?? undefined : undefined

  // Multiples par défaut si secteur inconnu
  const multiplesCA = secteur?.multipleCA || { min: 0.3, max: 0.8 }
  const multiplesEbitda = secteur?.multipleEBITDA || { min: 3, max: 6 }

  // Valorisation par multiple du CA
  const valorisationCABasse = dernierBilan.chiffreAffaires * multiplesCA.min
  const valorisationCAHaute = dernierBilan.chiffreAffaires * multiplesCA.max
  const valorisationCAMoyenne = (valorisationCABasse + valorisationCAHaute) / 2

  // Valorisation par multiple de l'EBITDA
  const ebitdaPourValo = Math.max(0, dernierBilan.ebitda) // Ne pas utiliser EBITDA négatif
  const valorisationEbitdaBasse = ebitdaPourValo * multiplesEbitda.min
  const valorisationEbitdaHaute = ebitdaPourValo * multiplesEbitda.max
  const valorisationEbitdaMoyenne = (valorisationEbitdaBasse + valorisationEbitdaHaute) / 2

  // Pondération : 60% EBITDA, 40% CA (si EBITDA positif)
  let ponderationEbitda = 0.6
  let ponderationCA = 0.4

  // Si EBITDA négatif ou nul, utiliser uniquement le CA
  if (dernierBilan.ebitda <= 0) {
    ponderationEbitda = 0
    ponderationCA = 1
  }

  // Valeur d'entreprise (EV)
  const evBasse = valorisationEbitdaBasse * ponderationEbitda + valorisationCABasse * ponderationCA
  const evHaute = valorisationEbitdaHaute * ponderationEbitda + valorisationCAHaute * ponderationCA
  const evMoyenne = (evBasse + evHaute) / 2

  // Ajustements pour le prix de cession
  const tresorerie = dernierBilan.tresorerie
  const detteNette = dernierBilan.detteNette

  // BFR normatif (environ 30-45 jours de CA selon secteur)
  const bfrNormatifJours = 30
  const bfrNormatif = (dernierBilan.chiffreAffaires / 365) * bfrNormatifJours
  const ajustementBfr = bfrNormatif - dernierBilan.bfr // Positif si BFR actuel inférieur au normatif

  // Prix de cession = EV + Trésorerie - Dettes + Ajustement BFR
  const prixBas = Math.max(0, evBasse + tresorerie - Math.max(0, detteNette) + ajustementBfr)
  const prixHaut = evHaute + tresorerie - Math.max(0, detteNette) + ajustementBfr
  const prixMoyen = (prixBas + prixHaut) / 2

  // Hypothèses
  const hypotheses: string[] = []

  if (secteur) {
    hypotheses.push(`Multiples basés sur le secteur "${secteur.nom}"`)
  } else {
    hypotheses.push('Multiples génériques appliqués (secteur non identifié)')
  }

  if (dernierBilan.ebitda <= 0) {
    hypotheses.push("EBITDA négatif : valorisation basée uniquement sur le CA")
  } else {
    hypotheses.push('Pondération : 60% multiple EBITDA, 40% multiple CA')
  }

  hypotheses.push(`BFR normatif estimé à ${bfrNormatifJours} jours de CA`)

  if (analyse.tendance === 'croissance') {
    hypotheses.push("Prime de croissance possible (non incluse dans l'estimation)")
  } else if (analyse.tendance === 'decroissance') {
    hypotheses.push('Décote possible liée à la baisse du CA')
  }

  return {
    valeurEntreprise: {
      basse: Math.round(evBasse),
      moyenne: Math.round(evMoyenne),
      haute: Math.round(evHaute),
    },
    ajustements: {
      tresorerie: Math.round(tresorerie),
      detteNette: Math.round(detteNette),
      ajustementBfr: Math.round(ajustementBfr),
    },
    prixCession: {
      bas: Math.round(prixBas),
      moyen: Math.round(prixMoyen),
      haut: Math.round(prixHaut),
    },
    methodes: {
      multipleCA: {
        valeur: Math.round(valorisationCAMoyenne),
        multiple: multiplesCA,
      },
      multipleEbitda: {
        valeur: Math.round(valorisationEbitdaMoyenne),
        multiple: multiplesEbitda,
      },
    },
    hypotheses,
  }
}
