// Module d'évaluation par secteur
// Exporte toutes les fonctionnalités du moteur d'évaluation

// Types
export type {
  ConfigSecteur,
  ResultatEvaluation,
  DonneesFinancieres,
  FacteursAjustement,
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
} from './secteurs'

// Calculateur
export { evaluerEntrepriseV2 } from './calculateur'

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
