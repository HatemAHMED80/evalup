// Types pour le moteur d'évaluation par secteur - Version 2.0
// Conforme aux règles de l'art : VE - Dette Nette = Prix de Cession

// ============================================
// CONFIGURATION SECTEUR (inchangé)
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

// ============================================
// RETRAITEMENTS EBITDA
// ============================================

export type CategorieRetraitement =
  | 'remuneration'
  | 'loyer'
  | 'exceptionnel'
  | 'creditbail'
  | 'famille'
  | 'autre'

export type SourceRetraitement = 'automatique' | 'utilisateur' | 'estimation'

export interface RetraitementEbitda {
  id: string
  libelle: string
  categorie: CategorieRetraitement
  montant: number // Positif = ajoute à l'EBITDA, Négatif = retire
  justification: string
  source: SourceRetraitement
}

export interface EbitdaNormalise {
  ebitdaComptable: number
  retraitements: RetraitementEbitda[]
  totalRetraitements: number
  ebitdaNormalise: number
  explicationRetraitements: string
}

// ============================================
// DETTE FINANCIÈRE NETTE
// ============================================

export interface DetailDette {
  libelle: string
  montant: number
  type: 'dette' | 'tresorerie'
}

export interface DetteFinanciereNette {
  // Dettes financières (à ajouter)
  empruntsLongTerme: number
  empruntsCourtTerme: number
  decouvertsBancaires: number
  compteCourantAssociesARembourser: number
  creditBailRestant: number
  participationDue: number
  ifcNonProvisionnees: number // Indemnités fin de carrière non provisionnées
  autresDettesFinancieres: number

  totalDettes: number

  // Trésorerie (à déduire)
  disponibilites: number
  vmp: number // Valeurs Mobilières de Placement

  totalTresorerie: number

  // Résultat
  // Positif = plus de dettes que de tréso → on DÉDUIT du prix
  // Négatif = plus de tréso que de dettes → on AJOUTE au prix
  detteFinanciereNette: number

  detail: DetailDette[]
}

// ============================================
// RÉSULTAT MÉTHODE DE VALORISATION
// ============================================

export type CategorieMethode = 'patrimoine' | 'rentabilite' | 'comparable' | 'mixte'

export interface DetailsMethode {
  agregat: string // Ex: "EBITDA normalisé"
  valeurAgregat: number
  multiple?: number
  formule: string
}

export interface ResultatMethode {
  code: string
  nom: string
  categorie: CategorieMethode

  // Valeur calculée (VE avant ajustement dette)
  valeurEntreprise: number
  poids: number // Poids dans la moyenne (%)

  // Détails du calcul
  details: DetailsMethode

  explication: string
}

// ============================================
// FOURCHETTE DE VALORISATION
// ============================================

export interface FourchetteValorisation {
  basse: number
  moyenne: number
  haute: number
}

// ============================================
// BRIDGE VE → PRIX DE CESSION
// ============================================

export interface BridgeValorisation {
  valeurEntreprise: number
  moinsDettes: number      // Négatif (on retire les dettes)
  plusTresorerie: number   // Positif (on ajoute la trésorerie)
  ajustementBFR?: number   // Si BFR anormal
  prixCession: number      // = VE - Dettes + Trésorerie
}

// ============================================
// AJUSTEMENTS QUALITATIFS
// ============================================

export interface AjustementQualitatif {
  facteur: string
  impact: number // % (ex: 0.10 pour +10%, -0.15 pour -15%)
  raison: string
}

// ============================================
// NIVEAU DE CONFIANCE
// ============================================

export type NiveauConfiance = 'elevee' | 'moyenne' | 'faible'

// ============================================
// RÉSULTAT ÉVALUATION COMPLET (V2)
// ============================================

export interface ResultatEvaluationV2 {
  // Identification
  siren: string
  dateEvaluation: string
  secteur: ConfigSecteur

  // EBITDA normalisé (avec retraitements)
  ebitda: EbitdaNormalise

  // Dette financière nette
  detteNette: DetteFinanciereNette

  // Valeur d'Entreprise (AVANT déduction dette)
  valeurEntreprise: FourchetteValorisation

  // Prix de Cession (APRÈS déduction dette) = CE QUE L'ACHETEUR PAIE
  prixCession: FourchetteValorisation

  // Bridge détaillé VE → Prix
  bridge: BridgeValorisation

  // Détail des méthodes utilisées
  methodes: ResultatMethode[]

  // Ajustements qualitatifs appliqués
  ajustements: AjustementQualitatif[]

  // Analyse qualitative
  pointsForts: string[]
  pointsVigilance: string[]
  recommandations: string[]

  // Niveau de confiance
  niveauConfiance: NiveauConfiance
  facteursIncertitude: string[]

  // Explication complète (markdown)
  explicationComplete: string
}

// ============================================
// RÉTROCOMPATIBILITÉ - Types existants
// ============================================

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
  // Optionnel : bridge VE → Equity (ajouté pour transparence)
  valeurEntreprise?: { basse: number; moyenne: number; haute: number }
  detteNette?: number
  ebitdaNormalise?: number
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
  retraitements?: DonneesRetraitements // Pour normalisation EBITDA
  immobilisationsCorporelles?: number // Pour flotte/matériel (bilan)
  historique?: { ca: number; ebitda: number; resultatNet: number; annee: number }[] // Multi-annuel
}

export interface FacteursAjustement {
  primes: string[] // IDs des facteurs de prime actifs
  decotes: string[] // IDs des facteurs de décote actifs
}

// ============================================
// DONNÉES COLLECTÉES POUR RETRAITEMENTS
// ============================================

export interface DonneesRetraitements {
  // Salaire dirigeant
  salaireDirigeantBrutCharge?: number
  nombreDirigeants?: number

  // Loyer
  loyerAnnuel?: number
  loyerAppartientDirigeant?: boolean
  loyerEstimeMarche?: number

  // Crédit-bail
  loyersCreditBailAnnuels?: number
  creditBailRestant?: number

  // Charges exceptionnelles
  chargesExceptionnelles?: number
  descriptionChargesExceptionnelles?: string

  // Produits exceptionnels
  produitsExceptionnels?: number
  descriptionProduitsExceptionnels?: string

  // Salariés famille
  salairesExcessifsFamille?: number
  salairesInsuffisantsFamille?: number

  // Compte courant
  compteCourantARembourser?: number

  // IFC
  ifcNonProvisionnees?: number

  // Participation
  participationDue?: number
}

// ============================================
// ENTRÉE POUR LE CALCULATEUR V2
// ============================================

export interface DonneesEvaluationV2 {
  siren: string
  nomEntreprise: string
  codeNaf: string
  dateCreation?: string
  effectif?: number
  localisation?: string

  // Bilans (3 dernières années idéalement)
  bilans: BilanAnnuel[]

  // Données pour les retraitements
  retraitements: DonneesRetraitements

  // Données qualitatives (collectées via les questions)
  qualitatif?: {
    dependanceDirigeant?: boolean
    concentrationClients?: number // % du top client
    ancienneteEquipe?: number
    contratsClesSecurises?: boolean
    locauxStrategiques?: boolean
  }
}
