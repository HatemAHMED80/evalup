// Types pour le moteur d'évaluation par secteur

export interface ConfigSecteur {
  nom: string
  code: string
  codesNaf: string[]

  // Multiples de valorisation
  multiples: {
    ca?: { min: number; max: number }
    ebitda?: { min: number; max: number }
    arr?: { min: number; max: number } // Pour SaaS
  }

  // Méthodes à utiliser et leur poids
  methodes: {
    code: string
    nom: string
    poids: number // % dans la moyenne finale
  }[]

  // Questions spécifiques à poser
  questions: string[]

  // Facteurs qui augmentent la valeur
  facteursPrime: {
    id: string
    description: string
    impact: string // ex: "+10%"
    question: string
  }[]

  // Facteurs qui diminuent la valeur
  facteursDecote: {
    id: string
    description: string
    impact: string // ex: "-15%"
    question: string
  }[]

  // Explication pédagogique du secteur
  explicationSecteur: string

  // Pourquoi ces méthodes pour ce secteur
  explicationMethodes: string
}

export interface ResultatEvaluation {
  secteur: ConfigSecteur
  valorisation: {
    basse: number
    moyenne: number
    haute: number
  }
  methodes: {
    nom: string
    valeur: number
    poids: number
    explication: string
  }[]
  ajustements: {
    facteur: string
    impact: number
    raison: string
  }[]
  explicationComplete: string
}

export interface DonneesFinancieres {
  ca: number
  ebitda: number
  resultatNet: number
  capitauxPropres: number
  actifNet: number
  tresorerie: number
  dettes: number
  arr?: number // Pour SaaS
  mrr?: number // Pour SaaS
  croissance?: number // % annuel
  churn?: number // % mensuel pour SaaS
}

export interface FacteursAjustement {
  primes: string[] // IDs des facteurs de prime actifs
  decotes: string[] // IDs des facteurs de décote actifs
}
