// Moteur de calcul d'évaluation d'entreprise

import { DonneesEntreprise, ResultatEvaluation, Ajustement, Secteur } from './types'
import { getSecteurByCode } from './secteurs'
import {
  type ReponseQualitative,
  type ResultatQualitatif,
  calculerScoreQualitatif,
} from './scoring-qualitatif'

// Type pour les statistiques de marché (optionnel)
export interface StatistiquesMarche {
  nombreTransactions: number
  prixMoyen: number
  multipleCAMoyen?: number
}

// Options pour le calcul d'évaluation
export interface OptionsEvaluation {
  statsMarche?: StatistiquesMarche | null
  reponsesQualitatives?: ReponseQualitative[]
}

// Calcule la valorisation complète d'une entreprise
export function calculerEvaluation(
  donnees: DonneesEntreprise,
  options: OptionsEvaluation = {}
): ResultatEvaluation {
  const secteur = getSecteurByCode(donnees.secteur)

  if (!secteur) {
    throw new Error(`Secteur inconnu: ${donnees.secteur}`)
  }

  const { statsMarche, reponsesQualitatives } = options

  // 1. Calcul par multiple du CA (théorique)
  let multipleCAMin = secteur.multipleCA.min
  let multipleCAMax = secteur.multipleCA.max

  // Si on a des données de marché, ajuster les multiples (pondération 70% théorique, 30% réel)
  if (statsMarche && statsMarche.multipleCAMoyen && statsMarche.nombreTransactions >= 3) {
    const multipleCAMarche = statsMarche.multipleCAMoyen
    multipleCAMin = multipleCAMin * 0.7 + (multipleCAMarche * 0.8) * 0.3
    multipleCAMax = multipleCAMax * 0.7 + (multipleCAMarche * 1.2) * 0.3
  }

  const valorisationCABasse = donnees.chiffreAffaires * multipleCAMin
  const valorisationCAHaute = donnees.chiffreAffaires * multipleCAMax

  // 2. Calcul par multiple de l'EBITDA
  const valorisationEBITDABasse = donnees.ebitda * secteur.multipleEBITDA.min
  const valorisationEBITDAHaute = donnees.ebitda * secteur.multipleEBITDA.max

  // 3. Calcul des ajustements (financiers)
  const ajustements = calculerAjustements(donnees, secteur)

  // 4. Coefficient d'ajustement total (financier)
  const coefficientAjustementFinancier = 1 + ajustements.reduce((acc, a) => acc + a.pourcentage, 0) / 100

  // 5. Calcul du score qualitatif si réponses fournies
  let scoreQualitatif: ResultatQualitatif | undefined
  let coefficientQualitatif = 1

  if (reponsesQualitatives && reponsesQualitatives.length > 0) {
    scoreQualitatif = calculerScoreQualitatif(reponsesQualitatives)
    coefficientQualitatif = 1 + scoreQualitatif.impactValorisationPct / 100
  }

  // 6. Coefficient total (financier + qualitatif)
  const coefficientTotal = coefficientAjustementFinancier * coefficientQualitatif

  // 7. Calcul de la valorisation moyenne pondérée (60% EBITDA, 40% CA)
  const valorisationBasseBrute = valorisationEBITDABasse * 0.6 + valorisationCABasse * 0.4
  const valorisationHauteBrute = valorisationEBITDAHaute * 0.6 + valorisationCAHaute * 0.4

  // 8. Application des ajustements
  const valorisationBasse = Math.round(valorisationBasseBrute * coefficientTotal)
  const valorisationHaute = Math.round(valorisationHauteBrute * coefficientTotal)
  const valorisationMoyenne = Math.round((valorisationBasse + valorisationHaute) / 2)

  // 9. Calcul du score global (0-100)
  let scoreGlobal = calculerScoreGlobal(donnees, secteur, ajustements)

  // Ajuster le score global avec le score qualitatif (moyenne pondérée)
  if (scoreQualitatif) {
    scoreGlobal = Math.round(scoreGlobal * 0.6 + scoreQualitatif.scoreTotal * 0.4)
  }

  // 10. Préparer les données de marché si disponibles
  const donneesMarche = statsMarche && statsMarche.nombreTransactions > 0
    ? {
        nombreTransactions: statsMarche.nombreTransactions,
        prixMoyenMarche: statsMarche.prixMoyen,
        multipleCAMarche: statsMarche.multipleCAMoyen,
        source: 'BODACC',
      }
    : undefined

  return {
    valorisation: {
      basse: valorisationBasse,
      moyenne: valorisationMoyenne,
      haute: valorisationHaute,
    },
    methodes: {
      multipleCA: {
        valeurBasse: Math.round(valorisationCABasse * coefficientTotal),
        valeurHaute: Math.round(valorisationCAHaute * coefficientTotal),
        multipleUtilise: { min: Math.round(multipleCAMin * 100) / 100, max: Math.round(multipleCAMax * 100) / 100 },
      },
      multipleEBITDA: {
        valeurBasse: Math.round(valorisationEBITDABasse * coefficientTotal),
        valeurHaute: Math.round(valorisationEBITDAHaute * coefficientTotal),
        multipleUtilise: secteur.multipleEBITDA,
      },
    },
    ajustements,
    scoreGlobal,
    secteur,
    entreprise: donnees,
    donneesMarche,
    scoreQualitatif: scoreQualitatif
      ? {
          scoreTotal: scoreQualitatif.scoreTotal,
          impactValorisationPct: scoreQualitatif.impactValorisationPct,
          detailParCategorie: scoreQualitatif.detailParCategorie,
        }
      : undefined,
  }
}

// Calcule les ajustements selon les caractéristiques de l'entreprise
function calculerAjustements(donnees: DonneesEntreprise, secteur: Secteur): Ajustement[] {
  const ajustements: Ajustement[] = []

  // 1. Ajustement taille (basé sur le CA)
  if (donnees.chiffreAffaires < 500000) {
    ajustements.push({
      nom: 'Petite entreprise',
      description: 'CA inférieur à 500k€ - décote de taille',
      impact: 'negatif',
      pourcentage: -15,
    })
  } else if (donnees.chiffreAffaires > 5000000) {
    ajustements.push({
      nom: 'Entreprise établie',
      description: 'CA supérieur à 5M€ - prime de taille',
      impact: 'positif',
      pourcentage: 10,
    })
  } else if (donnees.chiffreAffaires > 2000000) {
    ajustements.push({
      nom: 'Taille intermédiaire',
      description: 'CA entre 2M€ et 5M€ - légère prime',
      impact: 'positif',
      pourcentage: 5,
    })
  }

  // 2. Ajustement ancienneté
  if (donnees.anciennete < 3) {
    ajustements.push({
      nom: 'Jeune entreprise',
      description: 'Moins de 3 ans d\'existence - risque plus élevé',
      impact: 'negatif',
      pourcentage: -10,
    })
  } else if (donnees.anciennete >= 10) {
    ajustements.push({
      nom: 'Entreprise mature',
      description: 'Plus de 10 ans d\'existence - stabilité prouvée',
      impact: 'positif',
      pourcentage: 10,
    })
  } else if (donnees.anciennete >= 5) {
    ajustements.push({
      nom: 'Track record solide',
      description: 'Entre 5 et 10 ans d\'existence',
      impact: 'positif',
      pourcentage: 5,
    })
  }

  // 3. Ajustement rentabilité (marge nette vs moyenne secteur)
  const margeNette = (donnees.ebitda / donnees.chiffreAffaires) * 100
  const ecartMarge = margeNette - secteur.margeNetteMoyenne

  if (ecartMarge > 5) {
    ajustements.push({
      nom: 'Rentabilité excellente',
      description: `Marge de ${margeNette.toFixed(1)}% vs ${secteur.margeNetteMoyenne}% du secteur`,
      impact: 'positif',
      pourcentage: Math.min(15, Math.round(ecartMarge)),
    })
  } else if (ecartMarge < -5) {
    ajustements.push({
      nom: 'Rentabilité faible',
      description: `Marge de ${margeNette.toFixed(1)}% vs ${secteur.margeNetteMoyenne}% du secteur`,
      impact: 'negatif',
      pourcentage: Math.max(-15, Math.round(ecartMarge)),
    })
  }

  // 4. Ajustement équipe (nombre d'employés par rapport au CA)
  const caParEmploye = donnees.chiffreAffaires / donnees.nombreEmployes
  if (caParEmploye > 200000) {
    ajustements.push({
      nom: 'Équipe efficace',
      description: `${Math.round(caParEmploye / 1000)}k€ de CA par employé - haute productivité`,
      impact: 'positif',
      pourcentage: 5,
    })
  } else if (caParEmploye < 80000) {
    ajustements.push({
      nom: 'Équipe surdimensionnée',
      description: `${Math.round(caParEmploye / 1000)}k€ de CA par employé - productivité à améliorer`,
      impact: 'negatif',
      pourcentage: -5,
    })
  }

  // 5. Ajustement localisation
  if (donnees.localisation === 'Île-de-France') {
    ajustements.push({
      nom: 'Localisation premium',
      description: 'Basé en Île-de-France - accès au marché principal',
      impact: 'positif',
      pourcentage: 5,
    })
  }

  return ajustements
}

// Calcule un score global de 0 à 100
function calculerScoreGlobal(
  donnees: DonneesEntreprise,
  secteur: Secteur,
  ajustements: Ajustement[]
): number {
  let score = 50 // Score de base

  // Impact des ajustements sur le score
  const totalAjustements = ajustements.reduce((acc, a) => acc + a.pourcentage, 0)
  score += totalAjustements

  // Bonus si EBITDA positif
  if (donnees.ebitda > 0) {
    score += 10
  }

  // Bonus si marge nette supérieure à la moyenne du secteur
  const margeNette = (donnees.ebitda / donnees.chiffreAffaires) * 100
  if (margeNette > secteur.margeNetteMoyenne) {
    score += 10
  }

  // Normalisation entre 0 et 100
  return Math.max(0, Math.min(100, Math.round(score)))
}

// Formate un nombre en euros
export function formaterEuros(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(montant)
}

// Formate un nombre avec des espaces (pour les grands nombres)
export function formaterNombre(nombre: number): string {
  return new Intl.NumberFormat('fr-FR').format(nombre)
}
