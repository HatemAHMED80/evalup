// Module d'analyse financière
// Exporte les fonctions de calcul de ratios et diagnostic

export {
  calculerRatios,
  evaluerRatio,
  formaterRatio,
  getIconeEvaluation,
  LABELS_RATIOS,
  SEUILS_RATIOS,
  SEUILS_PAR_SECTEUR,
} from './ratios'

export type {
  RatiosFinanciers,
  SeuilsRatios,
  EvaluationRatio,
} from './ratios'

export {
  genererDiagnostic,
  genererExplicationDiagnostic,
  comparerRatios,
} from './diagnostic'

export type {
  LigneRatio,
  CategorieRatios,
  DiagnosticFinancier,
  EvolutionRatio,
} from './diagnostic'
