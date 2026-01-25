// Module d'optimisation des coûts API
// Centralise toutes les fonctionnalités d'optimisation

// Calculs locaux (GRATUITS - pas d'appel API)
export {
  calculerRatios,
  interpreterRatio,
  genererResumeRatios,
  calculerMultiplesSuggeres,
  BENCHMARKS_SECTEUR,
  type DonneesFinancieres,
  type RatiosCalcules,
  type InterpretationRatio,
} from './ratios'

export {
  detecterAnomalies,
  formaterAnomaliesMarkdown,
  aDesAnomaliesCritiques,
  calculerScoreComplexite,
  type Anomalie,
  type SeveriteAnomalie,
  type ResultatDetection,
} from './anomalies'

// Configuration des modèles
export {
  MODELS,
  DEFAULT_MODEL,
  FAST_MODEL,
  SMART_MODEL,
  TASK_TYPES,
  estimerCout,
  comparerCouts,
  getStatsEvaluationType,
  type ModelConfig,
  type ModelType,
  type TaskClassification,
} from './models'

// Router intelligent
export {
  routeToModel,
  classifyTask,
  detectMessageType,
  createRoutingContext,
  logRoutingDecision,
  type RoutingContext,
  type RoutingDecision,
} from './router'

// Système de cache
export {
  generateCacheKey,
  getCacheType,
  getFromCache,
  addToCache,
  invalidateByTag,
  invalidateBySiren,
  cleanupCache,
  getCacheStats,
  clearCache,
  checkCache,
  saveToCache,
  type CacheEntry,
  type CacheConfig,
} from './cache'

// Optimisation du contexte
export {
  estimerTokens,
  compresserHistorique,
  extraireDonneesStructurees,
  optimiserContexte,
  genererPromptCondense,
  necessiteCompression,
  type OptimizedContext,
  type ExtractedData,
  type SimpleMessage,
} from './context-optimizer'

// Suivi d'utilisation
export {
  trackUsage,
  getUsageStats,
  getEvaluationCost,
  estimerCoutEvaluation,
  genererRapportUtilisation,
  resetUsageStats,
  exportUsageData,
  importUsageData,
  type UsageRecord,
  type UsageStats,
} from './usage-tracker'
