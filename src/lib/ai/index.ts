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
  analyzePromptSemantics,
  isSimpleClarification,
  type RoutingContext,
  type RoutingDecision,
  type PromptSemantics,
} from './router'

// Système de cache
export {
  generateCacheKey,
  getCacheType,
  getFromCache,
  addToCache,
  invalidateByTag,
  invalidateBySiren,
  invalidateOnDocumentUpload,
  cleanupCache,
  getCacheStats,
  clearCache,
  checkCache,
  saveToCache,
  determineContentType,
  type CacheEntry,
  type CacheConfig,
  type CacheContentType,
} from './cache'

// Stockage de session serveur
export {
  createSession,
  getSession,
  findSessionBySiren,
  updateSession,
  addConversationEntry,
  addDocumentToSession,
  updateDocumentAnalysis,
  updateEvaluationStep,
  getConversationContext,
  cleanupExpiredSessions,
  deleteSession,
  getSessionStats,
  listActiveSessions,
  type SessionData,
  type DocumentReference,
  type DocumentAnalysisResult,
  type ConversationEntry,
  type FinancialContext,
  type EvaluationState,
} from './session-store'

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
