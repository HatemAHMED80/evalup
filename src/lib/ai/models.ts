// Configuration des modèles Claude pour le routage intelligent
// Optimisation des coûts API via sélection du modèle approprié

export interface ModelConfig {
  id: string
  name: string
  inputCostPer1M: number // $ par million de tokens en entrée
  outputCostPer1M: number // $ par million de tokens en sortie
  maxTokens: number
  contextWindow: number
  strengths: string[]
  useCases: string[]
}

export const MODELS: Record<string, ModelConfig> = {
  haiku: {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    maxTokens: 8192,
    contextWindow: 200000,
    strengths: [
      'Très rapide',
      'Économique',
      'Bon pour les tâches simples',
    ],
    useCases: [
      'Questions clarification simples',
      'Reformulation de réponses',
      'Extraction de données structurées',
      'Classification simple',
    ],
  },
  sonnet: {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    inputCostPer1M: 3,
    outputCostPer1M: 15,
    maxTokens: 8192,
    contextWindow: 200000,
    strengths: [
      'Analyse approfondie',
      'Raisonnement complexe',
      'Synthèse de qualité',
    ],
    useCases: [
      'Analyse financière détaillée',
      'Rédaction de rapport final',
      'Cas complexes ou atypiques',
      'Situations critiques',
    ],
  },
}

// Alias par défaut
export const DEFAULT_MODEL = MODELS.sonnet
export const FAST_MODEL = MODELS.haiku
export const SMART_MODEL = MODELS.sonnet

export type ModelType = 'haiku' | 'sonnet'

export interface TaskClassification {
  type: 'simple' | 'standard' | 'complex'
  recommendedModel: ModelType
  reason: string
  estimatedInputTokens?: number
  estimatedOutputTokens?: number
  estimatedCost?: number
}

/**
 * Types de tâches prédéfinis pour le routage
 */
export const TASK_TYPES = {
  // Tâches SIMPLES → Haiku (~$0.25/1M tokens)
  CLARIFICATION_SIMPLE: {
    type: 'simple' as const,
    recommendedModel: 'haiku' as ModelType,
    description: 'Question de clarification basique',
    avgInputTokens: 500,
    avgOutputTokens: 200,
  },
  EXTRACTION_DONNEES: {
    type: 'simple' as const,
    recommendedModel: 'haiku' as ModelType,
    description: 'Extraction de données structurées',
    avgInputTokens: 800,
    avgOutputTokens: 300,
  },
  REFORMULATION: {
    type: 'simple' as const,
    recommendedModel: 'haiku' as ModelType,
    description: 'Reformulation ou résumé simple',
    avgInputTokens: 600,
    avgOutputTokens: 400,
  },

  // Tâches STANDARD → Sonnet pour la qualité
  QUESTION_SECTORIELLE: {
    type: 'standard' as const,
    recommendedModel: 'sonnet' as ModelType,
    description: 'Question spécifique au secteur',
    avgInputTokens: 1500,
    avgOutputTokens: 800,
  },
  ANALYSE_REPONSE: {
    type: 'standard' as const,
    recommendedModel: 'sonnet' as ModelType,
    description: "Analyse d'une réponse utilisateur",
    avgInputTokens: 2000,
    avgOutputTokens: 1000,
  },

  // Tâches COMPLEXES → Sonnet obligatoire
  ANALYSE_FINANCIERE: {
    type: 'complex' as const,
    recommendedModel: 'sonnet' as ModelType,
    description: 'Analyse financière approfondie',
    avgInputTokens: 3000,
    avgOutputTokens: 2000,
  },
  SYNTHESE_FINALE: {
    type: 'complex' as const,
    recommendedModel: 'sonnet' as ModelType,
    description: 'Rédaction de la synthèse finale',
    avgInputTokens: 5000,
    avgOutputTokens: 4000,
  },
  CAS_ATYPIQUE: {
    type: 'complex' as const,
    recommendedModel: 'sonnet' as ModelType,
    description: 'Situation atypique ou complexe',
    avgInputTokens: 3000,
    avgOutputTokens: 2000,
  },
}

/**
 * Calcule le coût estimé d'un appel API
 */
export function estimerCout(
  modelType: ModelType,
  inputTokens: number,
  outputTokens: number
): number {
  const model = MODELS[modelType]
  const inputCost = (inputTokens / 1_000_000) * model.inputCostPer1M
  const outputCost = (outputTokens / 1_000_000) * model.outputCostPer1M
  return inputCost + outputCost
}

/**
 * Compare les coûts entre les modèles pour une tâche donnée
 */
export function comparerCouts(
  inputTokens: number,
  outputTokens: number
): { haiku: number; sonnet: number; economie: number; pourcentageEconomie: number } {
  const haikuCost = estimerCout('haiku', inputTokens, outputTokens)
  const sonnetCost = estimerCout('sonnet', inputTokens, outputTokens)
  const economie = sonnetCost - haikuCost
  const pourcentageEconomie = (economie / sonnetCost) * 100

  return {
    haiku: haikuCost,
    sonnet: sonnetCost,
    economie,
    pourcentageEconomie,
  }
}

/**
 * Retourne les statistiques d'utilisation recommandées pour une évaluation type
 * Utilisé pour les estimations de coûts
 */
export function getStatsEvaluationType(): {
  totalAppels: number
  appelsSonnet: number
  appelsHaiku: number
  coutEstime: { min: number; max: number; moyen: number }
} {
  // Évaluation type: ~8-12 échanges
  // - 2-3 questions clarification (Haiku)
  // - 4-6 questions sectorielles (Sonnet)
  // - 1-2 analyses intermédiaires (Sonnet)
  // - 1 synthèse finale (Sonnet)

  const stats = {
    haikuCalls: 3,
    sonnetCalls: 7,
    haikuTokens: { input: 2000, output: 900 },
    sonnetTokens: { input: 15000, output: 12000 },
  }

  const haikuCost = estimerCout('haiku', stats.haikuTokens.input, stats.haikuTokens.output)
  const sonnetCost = estimerCout('sonnet', stats.sonnetTokens.input, stats.sonnetTokens.output)

  // Avec optimisation: ~$0.05-0.10
  // Sans optimisation (tout Sonnet): ~$0.15-0.25

  return {
    totalAppels: stats.haikuCalls + stats.sonnetCalls,
    appelsSonnet: stats.sonnetCalls,
    appelsHaiku: stats.haikuCalls,
    coutEstime: {
      min: haikuCost + sonnetCost * 0.7, // Cas optimiste
      max: haikuCost + sonnetCost * 1.2, // Cas pessimiste
      moyen: haikuCost + sonnetCost, // Cas moyen
    },
  }
}
