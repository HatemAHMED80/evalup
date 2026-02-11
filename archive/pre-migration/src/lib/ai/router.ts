// Router intelligent pour sélectionner le modèle optimal
// Version 2.0: Analyse sémantique AVANT toute décision
// Les questions financières → toujours Sonnet

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
 * Résultat de l'analyse sémantique du prompt
 */
export interface PromptSemantics {
  isFinancialQuestion: boolean
  isValuationQuestion: boolean
  isRatioQuestion: boolean
  requiresExplanation: boolean
  requiresComparison: boolean
  requiresSynthesis: boolean
  complexityScore: number // 0-100
  detectedTopics: string[]
  forceSonnet: boolean
  reason?: string
}

/**
 * Patterns pour détecter les questions financières CRITIQUES
 * Ces questions nécessitent TOUJOURS Sonnet
 */
const FINANCIAL_PATTERNS = {
  // Questions de valorisation - TOUJOURS Sonnet
  valuation: [
    /combien.*vaut/i,
    /vaut.*combien/i,
    /valorisation/i,
    /valeur.*entreprise/i,
    /valeur.*société/i,
    /estimer.*valeur/i,
    /estimation.*valeur/i,
    /prix.*vente/i,
    /prix.*cession/i,
    /multiple.*ebitda/i,
    /multiple.*ca/i,
  ],

  // Questions sur les ratios financiers - TOUJOURS Sonnet
  ratios: [
    /ratio.*(dette|ebitda|marge|rentabilité|liquidité)/i,
    /dette.*ebitda/i,
    /marge.*(brute|nette|opérationnelle|ebitda)/i,
    /rentabilité.*(économique|financière|capitaux)/i,
    /roe|roa|roce/i,
    /taux.*(endettement|marge|rentabilité)/i,
    /levier.*financier/i,
    /besoin.*fonds.*roulement/i,
    /bfr/i,
    /trésorerie/i,
  ],

  // Questions d'analyse approfondie - TOUJOURS Sonnet
  analysis: [
    /expliqu.*pourquoi/i,
    /analys.*(détail|approfondi|financ)/i,
    /impact.*sur/i,
    /risque.*(financier|crédit|liquidité)/i,
    /comparer.*avec/i,
    /benchmark/i,
    /secteur/i,
    /tendance/i,
    /évolution/i,
    /prévision/i,
    /projection/i,
  ],
}

/**
 * Patterns pour les clarifications VRAIMENT simples
 * (confirmations oui/non, dates, montants spécifiques)
 */
const SIMPLE_CLARIFICATION_PATTERNS = [
  /^(oui|non|d'accord|ok|parfait)$/i,
  /^\d+(\s*(€|euros?|k€|m€|%))?\s*$/i, // Juste un nombre
  /^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s*\d{4}$/i,
  /^\d{4}$/,  // Juste une année
  /^c'est (correct|exact|ça)$/i,
]

/**
 * Analyse sémantique du prompt - DOIT être appelée AVANT toute décision
 */
export function analyzePromptSemantics(prompt: string): PromptSemantics {
  const promptLower = prompt.toLowerCase().trim()
  const detectedTopics: string[] = []

  // Vérifier les questions de valorisation
  const isValuationQuestion = FINANCIAL_PATTERNS.valuation.some(p => p.test(prompt))
  if (isValuationQuestion) detectedTopics.push('valorisation')

  // Vérifier les questions sur les ratios
  const isRatioQuestion = FINANCIAL_PATTERNS.ratios.some(p => p.test(prompt))
  if (isRatioQuestion) detectedTopics.push('ratios')

  // Vérifier les questions d'analyse
  const requiresAnalysis = FINANCIAL_PATTERNS.analysis.some(p => p.test(prompt))
  if (requiresAnalysis) detectedTopics.push('analyse')

  // Détecter si explication requise
  const requiresExplanation = /expliqu|pourquoi|comment|détail/i.test(prompt)
  if (requiresExplanation) detectedTopics.push('explication')

  // Détecter si comparaison requise
  const requiresComparison = /compar|versus|vs|par rapport|différence/i.test(prompt)
  if (requiresComparison) detectedTopics.push('comparaison')

  // Détecter si synthèse requise
  const requiresSynthesis = /synthèse|résumé|conclusion|récapitul/i.test(prompt)
  if (requiresSynthesis) detectedTopics.push('synthèse')

  // Question financière = valorisation OU ratios OU analyse
  const isFinancialQuestion = isValuationQuestion || isRatioQuestion || requiresAnalysis

  // Calculer le score de complexité sémantique
  let complexityScore = 0

  // Questions financières = haute complexité
  if (isValuationQuestion) complexityScore += 40
  if (isRatioQuestion) complexityScore += 35
  if (requiresAnalysis) complexityScore += 30
  if (requiresExplanation) complexityScore += 20
  if (requiresComparison) complexityScore += 15
  if (requiresSynthesis) complexityScore += 25

  // Longueur du prompt = indicateur de complexité
  if (prompt.length > 200) complexityScore += 10
  if (prompt.length > 500) complexityScore += 10

  // Nombre de questions dans le prompt
  const questionCount = (prompt.match(/\?/g) || []).length
  if (questionCount > 1) complexityScore += questionCount * 5

  complexityScore = Math.min(100, complexityScore)

  // Déterminer si Sonnet est obligatoire
  const forceSonnet = isValuationQuestion || isRatioQuestion || requiresAnalysis ||
    requiresSynthesis || complexityScore >= 50

  // Raison du choix
  let reason: string | undefined
  if (isValuationQuestion) reason = 'Question de valorisation détectée'
  else if (isRatioQuestion) reason = 'Question sur les ratios financiers'
  else if (requiresAnalysis) reason = 'Analyse approfondie requise'
  else if (requiresSynthesis) reason = 'Synthèse requise'
  else if (complexityScore >= 50) reason = `Complexité sémantique élevée (${complexityScore}/100)`

  return {
    isFinancialQuestion,
    isValuationQuestion,
    isRatioQuestion,
    requiresExplanation,
    requiresComparison,
    requiresSynthesis,
    complexityScore,
    detectedTopics,
    forceSonnet,
    reason,
  }
}

/**
 * Vérifie si le prompt est une clarification vraiment simple
 */
export function isSimpleClarification(prompt: string): boolean {
  const promptTrimmed = prompt.trim()

  // Vérifier les patterns simples
  if (SIMPLE_CLARIFICATION_PATTERNS.some(p => p.test(promptTrimmed))) {
    return true
  }

  // Message très court sans question financière
  if (promptTrimmed.length < 30 && !FINANCIAL_PATTERNS.valuation.some(p => p.test(prompt)) &&
      !FINANCIAL_PATTERNS.ratios.some(p => p.test(prompt))) {
    // Vérifier que ce n'est pas une question
    if (!promptTrimmed.includes('?') || /^(oui|non|ok)/i.test(promptTrimmed)) {
      return true
    }
  }

  return false
}

/**
 * Détermine le meilleur modèle pour une tâche donnée
 * NOUVEL ORDRE: Analyse sémantique AVANT tout le reste
 */
export function routeToModel(context: RoutingContext, prompt?: string): RoutingDecision {
  // 1. Si un modèle est forcé, l'utiliser
  if (context.forceModel) {
    return {
      model: context.forceModel,
      modelId: MODELS[context.forceModel].id,
      reason: `Modèle forcé: ${context.forceModel}`,
      confidence: 100,
    }
  }

  // 2. CRITIQUE: Analyse sémantique du prompt AVANT toute autre décision
  if (prompt) {
    const semantics = analyzePromptSemantics(prompt)

    // Si Sonnet est obligatoire selon l'analyse sémantique → Sonnet immédiatement
    if (semantics.forceSonnet) {
      return {
        model: 'sonnet',
        modelId: MODELS.sonnet.id,
        reason: semantics.reason || 'Analyse sémantique → Sonnet requis',
        confidence: 95,
        estimatedCost: estimerCout('sonnet', 2500, 2000),
      }
    }

    // Si c'est une clarification vraiment simple ET pas de contenu financier
    if (isSimpleClarification(prompt) && context.step <= 3 && context.conversationLength < 6) {
      return {
        model: 'haiku',
        modelId: MODELS.haiku.id,
        reason: 'Clarification simple sans contenu financier',
        confidence: 80,
        estimatedCost: estimerCout('haiku', 300, 150),
        alternativeModel: 'sonnet',
        alternativeReason: 'Si contexte financier détecté',
      }
    }
  }

  // 3. Synthèse finale → Toujours Sonnet
  if (context.messageType === 'synthesis' || context.step === context.totalSteps) {
    return {
      model: 'sonnet',
      modelId: MODELS.sonnet.id,
      reason: 'Synthèse finale - qualité maximale requise',
      confidence: 100,
      estimatedCost: estimerCout('sonnet', 5000, 4000),
    }
  }

  // 4. Anomalies critiques détectées → Sonnet
  if (context.hasAnomalies || context.isAtypical) {
    return {
      model: 'sonnet',
      modelId: MODELS.sonnet.id,
      reason: 'Situation atypique ou anomalies détectées',
      confidence: 95,
      estimatedCost: estimerCout('sonnet', 3000, 2000),
    }
  }

  // 5. Calculer le score de complexité si données financières disponibles
  if (context.financialData && context.secteur) {
    const scoreComplexite = calculerScoreComplexite(context.financialData, context.secteur)

    // Score < 30 ET messageType simple → Haiku possible
    // MAIS seulement si on n'a pas de prompt ou si le prompt n'a pas déclenché Sonnet
    const isSimpleMessageType = context.messageType === 'question' || context.messageType === 'response'
    if (scoreComplexite < 30 && isSimpleMessageType) {
      return {
        model: 'haiku',
        modelId: MODELS.haiku.id,
        reason: `Score de complexité faible (${scoreComplexite}/100) - cas standard`,
        confidence: 70,
        estimatedCost: estimerCout('haiku', 800, 400),
        alternativeModel: 'sonnet',
        alternativeReason: 'Pour une analyse plus approfondie',
      }
    }

    // Score >= 30 → Sonnet
    return {
      model: 'sonnet',
      modelId: MODELS.sonnet.id,
      reason: `Score de complexité ${scoreComplexite >= 70 ? 'élevé' : 'moyen'} (${scoreComplexite}/100)`,
      confidence: scoreComplexite >= 70 ? 95 : 85,
      estimatedCost: estimerCout('sonnet', 2500, 1500),
    }
  }

  // 6. Par défaut selon le type de message - TOUJOURS Sonnet pour être sûr
  // On ne risque plus de donner Haiku pour des questions financières
  return {
    model: 'sonnet',
    modelId: MODELS.sonnet.id,
    reason: `Type de message: ${context.messageType} - qualité assurée`,
    confidence: 85,
    estimatedCost: estimerCout('sonnet', 2000, 1500),
  }
}

/**
 * Classifie une tâche pour le routage
 * Version 2.0: Utilise l'analyse sémantique
 */
export function classifyTask(
  prompt: string,
  context: RoutingContext
): TaskClassification {
  const semantics = analyzePromptSemantics(prompt)

  // Si synthèse finale
  if (context.step === context.totalSteps || semantics.requiresSynthesis) {
    return {
      type: 'complex',
      recommendedModel: 'sonnet',
      reason: 'Synthèse finale requise',
      estimatedInputTokens: 5000,
      estimatedOutputTokens: 4000,
      estimatedCost: estimerCout('sonnet', 5000, 4000),
    }
  }

  // Si question financière détectée par sémantique
  if (semantics.isFinancialQuestion) {
    return {
      type: 'complex',
      recommendedModel: 'sonnet',
      reason: semantics.reason || 'Question financière complexe',
      estimatedInputTokens: 2500,
      estimatedOutputTokens: 2000,
      estimatedCost: estimerCout('sonnet', 2500, 2000),
    }
  }

  // Si complexité sémantique élevée
  if (semantics.complexityScore >= 50) {
    return {
      type: 'complex',
      recommendedModel: 'sonnet',
      reason: `Complexité sémantique: ${semantics.complexityScore}/100`,
      estimatedInputTokens: 2000,
      estimatedOutputTokens: 1500,
      estimatedCost: estimerCout('sonnet', 2000, 1500),
    }
  }

  // Si clarification vraiment simple
  if (isSimpleClarification(prompt) && semantics.complexityScore < 20) {
    return {
      type: 'simple',
      recommendedModel: 'haiku',
      reason: 'Clarification simple',
      estimatedInputTokens: 500,
      estimatedOutputTokens: 200,
      estimatedCost: estimerCout('haiku', 500, 200),
    }
  }

  // Par défaut: standard avec Sonnet (choix sûr)
  return {
    type: 'standard',
    recommendedModel: 'sonnet',
    reason: 'Tâche standard - qualité assurée',
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
  decision: RoutingDecision,
  semantics?: PromptSemantics
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
      semantics: semantics ? {
        isFinancial: semantics.isFinancialQuestion,
        complexity: semantics.complexityScore,
        topics: semantics.detectedTopics,
      } : undefined,
    })
  }
}
