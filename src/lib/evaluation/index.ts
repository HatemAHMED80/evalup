// Module d'évaluation
// Types + détection de secteur par code NAF

// Types
export type {
  ConfigSecteur,
  BilanAnnuel,
} from './types'

// Secteurs
export {
  SECTEURS,
  detecterSecteurEvaluation,
  getSecteurParCode,
  getTousLesSecteurs,
} from './secteurs'
