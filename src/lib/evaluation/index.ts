// Module d'évaluation par secteur
// Exporte toutes les fonctionnalités du moteur d'évaluation

// Types
export type {
  ConfigSecteur,
  ResultatEvaluation,
  DonneesFinancieres,
  FacteursAjustement,
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

// Calculateur
export {
  evaluerEntreprise,
  evaluerRapide,
  getQuestionsParSecteur,
  getFacteursParSecteur,
} from './calculateur'
