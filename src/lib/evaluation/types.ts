// Types pour le module d'évaluation
// BilanAnnuel : structure enrichie des données de bilan
// ConfigSecteur : configuration des secteurs (NAF → multiples)

// ============================================
// CONFIGURATION SECTEUR
// ============================================

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

// ============================================
// DONNÉES BILAN ANNUEL (enrichi)
// ============================================

export interface BilanAnnuel {
  annee: number
  dateCloture?: string
  dureeExercice?: number // en mois (12 par défaut)

  // Compte de résultat
  chiffreAffaires: number
  productionStockee?: number
  productionImmobilisee?: number
  subventionsExploitation?: number
  autresProduits?: number

  achatsConsommes?: number
  chargesExternes?: number
  impotsTaxes?: number
  chargesPersonnel?: number
  dotationsAmortissements: number
  dotationsProvisions?: number
  autresCharges?: number

  resultatExploitation: number
  resultatFinancier?: number
  resultatExceptionnel?: number
  participationSalaries?: number
  impotSurBenefices?: number
  resultatNet: number

  // Bilan - Actif
  immobilisationsIncorporelles?: number
  immobilisationsCorporelles?: number
  immobilisationsFinancieres?: number
  stocks?: number
  creancesClients?: number
  autresCreances?: number
  vmp?: number // Valeurs Mobilières de Placement
  disponibilites: number // Trésorerie

  // Bilan - Passif
  capitalSocial?: number
  reserves?: number
  reportANouveau?: number
  resultatExercice?: number
  capitauxPropres: number

  provisionsRisques?: number
  empruntsEtablissementsCredit?: number // Emprunts bancaires
  empruntsObligataires?: number
  avancesConditionnees?: number
  compteCourantAssocies?: number
  dettesFournisseurs?: number
  dettesFiscalesSociales?: number
  autresDettes?: number

  // Dettes financières agrégées (si détail non disponible)
  dettesFinancieres?: number

  // Éléments hors bilan (à collecter via questions)
  creditBailRestant?: number
  engagementsHorsBilan?: number
}
