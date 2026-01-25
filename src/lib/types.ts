// Types pour EvalUp - Évaluation d'entreprises

// Données d'entrée du formulaire
export interface DonneesEntreprise {
  nom: string
  secteur: string
  chiffreAffaires: number      // CA annuel en euros
  ebitda: number               // Résultat net / EBITDA en euros
  nombreEmployes: number
  anciennete: number           // En années
  localisation: string         // Région
}

// Configuration d'un secteur d'activité
export interface Secteur {
  nom: string
  code: string
  multipleCA: {
    min: number
    max: number
  }
  multipleEBITDA: {
    min: number
    max: number
  }
  margeNetteMoyenne: number    // En pourcentage (ex: 10 = 10%)
  tauxCroissanceMoyen: number  // En pourcentage
}

// Résultat de l'évaluation
export interface ResultatEvaluation {
  // Valorisation finale
  valorisation: {
    basse: number
    moyenne: number
    haute: number
  }

  // Détail par méthode
  methodes: {
    multipleCA: {
      valeurBasse: number
      valeurHaute: number
      multipleUtilise: { min: number; max: number }
    }
    multipleEBITDA: {
      valeurBasse: number
      valeurHaute: number
      multipleUtilise: { min: number; max: number }
    }
  }

  // Ajustements appliqués
  ajustements: Ajustement[]

  // Score global de l'entreprise (0-100)
  scoreGlobal: number

  // Secteur utilisé
  secteur: Secteur

  // Données de l'entreprise
  entreprise: DonneesEntreprise

  // Données de marché (transactions réelles)
  donneesMarche?: {
    nombreTransactions: number
    prixMoyenMarche: number
    multipleCAMarche?: number
    source: string
  }

  // Score qualitatif (critères non-financiers)
  scoreQualitatif?: {
    scoreTotal: number
    impactValorisationPct: number
    detailParCategorie: {
      categorie: string
      nom: string
      score: number
      impact: number
    }[]
  }
}

// Un ajustement de valorisation
export interface Ajustement {
  nom: string
  description: string
  impact: 'positif' | 'negatif' | 'neutre'
  pourcentage: number          // Pourcentage d'ajustement (ex: +10 ou -5)
}

// Options pour les régions françaises
export const REGIONS = [
  'Île-de-France',
  'Auvergne-Rhône-Alpes',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Hauts-de-France',
  'Provence-Alpes-Côte d\'Azur',
  'Grand Est',
  'Pays de la Loire',
  'Bretagne',
  'Normandie',
  'Bourgogne-Franche-Comté',
  'Centre-Val de Loire',
  'Corse',
  'DOM-TOM',
] as const

export type Region = typeof REGIONS[number]
