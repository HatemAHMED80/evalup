// Module d'évaluation par secteur
// Exporte toutes les fonctionnalités du moteur d'évaluation

// Types V1 (rétrocompatibilité)
export type {
  ConfigSecteur,
  ResultatEvaluation,
  DonneesFinancieres,
  FacteursAjustement,
} from './types'

// Types V2 (nouvelle méthodologie)
export type {
  BilanAnnuel,
  RetraitementEbitda,
  EbitdaNormalise,
  DetteFinanciereNette,
  ResultatMethode,
  FourchetteValorisation,
  BridgeValorisation,
  AjustementQualitatif,
  ResultatEvaluationV2,
  DonneesRetraitements,
  DonneesEvaluationV2,
  CategorieRetraitement,
  CategorieMethode,
  NiveauConfiance,
} from './types'

// Secteurs
export {
  SECTEURS,
  detecterSecteurEvaluation,
  getSecteurParCode,
  getTousLesSecteurs,
  TRANSPORT,
  SAAS,
  RESTAURANT,
  COMMERCE,
  ECOMMERCE,
  BTP,
  INDUSTRIE,
  SERVICES,
  SANTE,
  DEFAULT,
} from './secteurs'

// Calculateur V1 (rétrocompatibilité)
export {
  evaluerEntreprise,
  evaluerRapide,
  getQuestionsParSecteur,
  getFacteursParSecteur,
} from './calculateur'

// Calculateur V2 (nouvelle méthodologie)
export { evaluerEntrepriseV2 } from './calculateur-v2'

// EBITDA normalisé
export {
  calculerEbitdaNormalise,
  calculerEbitdaComptable,
  calculerEbitdaComptableMoyen,
  getSalaireNormatifDirigeant,
  calculerRetraitementRemuneration,
  calculerRetraitementLoyer,
  calculerRetraitementCreditBail,
  calculerRetraitementChargesExceptionnelles,
  calculerRetraitementProduitsExceptionnels,
} from './ebitda-normalise'

// Dette nette
export {
  calculerDetteNette,
  genererExplicationDetteNette,
} from './dette-nette'
