// Router intelligent pour sélectionner le modèle optimal
// Réduit les coûts en utilisant Haiku pour les tâches simples

import { MODELS, TASK_TYPES, estimerCout, type ModelType, type TaskClassification } from './models'
import { calculerScoreComplexite, aDesAnomaliesCritiques } from './anomalies'
import type { DonneesFinancieres } from './ratios'

export interface RoutingContext {
  // Étape de l'évaluation
  step: number
  totalSteps: number

  // Type de message
  messageType: 'question' | 'response' | 'analysis' | 'synthesis'

  // Données financières (si disponibles)
  financialData?: DonneesFinancieres

  // Secteur d'activité
  secteur?: string

  // Historique de la conversation
  conversationLength: number

  // Indicateurs de complexité
  hasAnomalies?: boolean
  isAtypical?: boolean

  // Forcer un modèle spécifique
  forceModel?: ModelType
}

export interface RoutingDecision {
  model: ModelType
  modelId: string
  reason: string
  confidence: number // 0-100
  estimatedCost?: number
  alternativeModel?: ModelType
  alternativeReason?: string
}

/**
 * Détermine le meilleur modèle pour une tâche donnée
 * Logique principale de routage
 */
export function routeToModel(context: RoutingContext): RoutingDecision {
  // 1. Si un modèle est forcé, l'utiliser
  if (context.forceModel) {
    return {
      model: context.forceModel,
      modelId: MODELS[context.forceModel].id,
      reason: `Modèle forcé: ${context.forceModel}`,
      confidence: 100,
    }
  }

  // 2. Synthèse finale → Toujours Sonnet
  if (context.messageType === 'synthesis' || context.step === context.totalSteps) {
    return {
      model: 'sonnet',
      modelId: MODELS.sonnet.id,
      reason: 'Synthèse finale - qualité maximale requise',
      confidence: 100,
      estimatedCost: estimerCout('sonnet', 5000, 4000),
    }
  }

  // 3. Anomalies critiques détectées → Sonnet
  if (context.hasAnomalies || context.isAtypical) {
    return {
      model: 'sonnet',
      modelId: MODELS.sonnet.id,
      reason: 'Situation atypique ou anomalies détectées',
      confidence: 95,
      estimatedCost: estimerCout('sonnet', 3000, 2000),
    }
  }

  // 4. Première question de clarification simple → Haiku
  if (context.step <= 2 && context.messageType === 'question' && context.conversationLength < 4) {
    return {
      model: 'haiku',
      modelId: MODELS.haiku.id,
      reason: 'Question de clarification initiale - tâche simple',
      confidence: 85,
      estimatedCost: estimerCout('haiku', 500, 200),
      alternativeModel: 'sonnet',
      alternativeReason: 'Si la question nécessite plus de contexte',
    }
  }

  // 5. Calculer le score de complexité si données financières disponibles
  if (context.financialData && context.secteur) {
    const scoreComplexite = calculerScoreComplexite(context.financialData, context.secteur)

    // Score < 30: Simple → Haiku possible
    if (scoreComplexite < 30 && context.messageType !== 'analysis') {
      return {
        model: 'haiku',
        modelId: MODELS.haiku.id,
        reason: `Score de complexité faible (${scoreComplexite}/100) - cas standard`,
        confidence: 75,
        estimatedCost: estimerCout('haiku', 800, 400),
        alternativeModel: 'sonnet',
        alternativeReason: 'Pour une analyse plus approfondie',
      }
    }

    // Score 30-70: Moyen → Sonnet recommandé mais Haiku acceptable
    if (scoreComplexite < 70) {
      return {
        model: 'sonnet',
        modelId: MODELS.sonnet.id,
        reason: `Score de complexité moyen (${scoreComplexite}/100) - analyse standard`,
        confidence: 80,
        estimatedCost: estimerCout('sonnet', 2000, 1500),
      }
    }

    // Score > 70: Complexe → Sonnet obligatoire
    return {
      model: 'sonnet',
      modelId: MODELS.sonnet.id,
      reason: `Score de complexité élevé (${scoreComplexite}/100) - analyse approfondie requise`,
      confidence: 95,
      estimatedCost: estimerCout('sonnet', 3000, 2500),
    }
  }

  // 6. Par défaut selon le type de message
  switch (context.messageType) {
    case 'question':
      // Questions intermédiaires → Sonnet pour la qualité
      return {
        model: 'sonnet',
        modelId: MODELS.sonnet.id,
        reason: 'Question sectorielle - qualité requise',
        confidence: 80,
        estimatedCost: estimerCout('sonnet', 1500, 1000),
      }

    case 'response':
      // Analyse de réponse utilisateur → Sonnet
      return {
        model: 'sonnet',
        modelId: MODELS.sonnet.id,
        reason: "Analyse de réponse utilisateur",
        confidence: 85,
        estimatedCost: estimerCout('sonnet', 2000, 1000),
      }

    case 'analysis':
      // Analyse intermédiaire → Sonnet
      return {
        model: 'sonnet',
        modelId: MODELS.sonnet.id,
        reason: 'Analyse intermédiaire',
        confidence: 90,
        estimatedCost: estimerCout('sonnet', 2500, 1500),
      }

    default:
      // Fallback → Sonnet
      return {
        model: 'sonnet',
        modelId: MODELS.sonnet.id,
        reason: 'Modèle par défaut',
        confidence: 70,
      }
  }
}

/**
 * Classifie une tâche pour le routage
 */
export function classifyTask(
  prompt: string,
  context: RoutingContext
): TaskClassification {
  // Mots-clés pour identifier les tâches simples
  const simpleKeywords = [
    'précise', 'confirme', 'quel est', 'combien',
    'oui ou non', 'quelle date', 'quel montant',
  ]

  // Mots-clés pour identifier les tâches complexes
  const complexKeywords = [
    'analyse', 'explique', 'compare', 'synthèse',
    'évalue', 'recommande', 'détaille', 'pourquoi',
    'impact', 'risque', 'stratégie',
  ]

  const promptLower = prompt.toLowerCase()
  const hasSimpleKeywords = simpleKeywords.some(kw => promptLower.includes(kw))
  const hasComplexKeywords = complexKeywords.some(kw => promptLower.includes(kw))

  // Si synthèse finale
  if (context.step === context.totalSteps || promptLower.includes('synthèse')) {
    return {
      type: 'complex',
      recommendedModel: 'sonnet',
      reason: 'Synthèse finale requise',
      estimatedInputTokens: 5000,
      estimatedOutputTokens: 4000,
      estimatedCost: estimerCout('sonnet', 5000, 4000),
    }
  }

  // Si uniquement mots-clés simples et pas de complexité
  if (hasSimpleKeywords && !hasComplexKeywords && context.conversationLength < 6) {
    return {
      type: 'simple',
      recommendedModel: 'haiku',
      reason: 'Question de clarification simple',
      estimatedInputTokens: 500,
      estimatedOutputTokens: 200,
      estimatedCost: estimerCout('haiku', 500, 200),
    }
  }

  // Si mots-clés complexes
  if (hasComplexKeywords) {
    return {
      type: 'complex',
      recommendedModel: 'sonnet',
      reason: 'Analyse ou explication requise',
      estimatedInputTokens: 2500,
      estimatedOutputTokens: 1500,
      estimatedCost: estimerCout('sonnet', 2500, 1500),
    }
  }

  // Par défaut: standard avec Sonnet
  return {
    type: 'standard',
    recommendedModel: 'sonnet',
    reason: 'Tâche standard',
    estimatedInputTokens: 1500,
    estimatedOutputTokens: 1000,
    estimatedCost: estimerCout('sonnet', 1500, 1000),
  }
}

/**
 * Détermine le type de message à partir du contexte
 */
export function detectMessageType(
  step: number,
  totalSteps: number,
  isUserMessage: boolean
): RoutingContext['messageType'] {
  if (step === totalSteps) return 'synthesis'
  if (isUserMessage) return 'response'
  if (step <= 2) return 'question'
  return 'analysis'
}

/**
 * Crée un contexte de routage à partir des données disponibles
 */
export function createRoutingContext(params: {
  step: number
  totalSteps: number
  isUserMessage: boolean
  financialData?: DonneesFinancieres
  secteur?: string
  conversationLength: number
  forceModel?: ModelType
}): RoutingContext {
  const messageType = detectMessageType(params.step, params.totalSteps, params.isUserMessage)

  let hasAnomalies = false
  let isAtypical = false

  if (params.financialData && params.secteur) {
    hasAnomalies = aDesAnomaliesCritiques(params.financialData, params.secteur)

    // Vérifier si la situation est atypique
    const margeEBITDA = params.financialData.ca > 0
      ? (params.financialData.ebitda / params.financialData.ca) * 100
      : 0

    // Marge > 50% ou < -10% = atypique
    isAtypical = margeEBITDA > 50 || margeEBITDA < -10
  }

  return {
    step: params.step,
    totalSteps: params.totalSteps,
    messageType,
    financialData: params.financialData,
    secteur: params.secteur,
    conversationLength: params.conversationLength,
    hasAnomalies,
    isAtypical,
    forceModel: params.forceModel,
  }
}

/**
 * Log la décision de routage (pour debug/analytics)
 */
export function logRoutingDecision(
  context: RoutingContext,
  decision: RoutingDecision
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Router] Décision de routage:', {
      step: `${context.step}/${context.totalSteps}`,
      messageType: context.messageType,
      model: decision.model,
      reason: decision.reason,
      confidence: `${decision.confidence}%`,
      estimatedCost: decision.estimatedCost
        ? `$${decision.estimatedCost.toFixed(6)}`
        : 'N/A',
    })
  }
}
