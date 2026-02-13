// API Route pour le chat avec Claude (streaming + optimisation des coûts)
// Version 2.0: Avec analyse sémantique et sessions serveur
import { NextRequest } from 'next/server'
import { anthropic, isAnthropicConfigured } from '@/lib/anthropic'
import { getModelFallbacks } from '@/lib/ai/models'
import type { ConversationContext, Message } from '@/lib/anthropic'
import { buildArchetypePrompt } from '@/lib/prompts/builder'
import { createClient } from '@/lib/supabase/server'
import { chatBodySchema } from '@/lib/security/schemas'
import {
  recordTokenUsage,
  checkEvaluationAccess,
  incrementQuestionCount,
  checkTokenUsage,
} from '@/lib/usage'
import {
  // Router intelligent (v2 avec analyse sémantique)
  routeToModel,
  createRoutingContext,
  logRoutingDecision,
  analyzePromptSemantics,
  type ModelType,

  // Cache (v2 avec SIREN et types de contenu)
  checkCache,
  saveToCache,

  // Sessions serveur
  findSessionBySiren,
  createSession,
  addConversationEntry,
  updateEvaluationStep,

  // Optimisation contexte
  optimiserContexte,
  necessiteCompression,
  estimerTokens,

  // Calculs locaux
  calculerRatios,
  detecterAnomalies,
  genererResumeRatios,
  formaterAnomaliesMarkdown,
  type DonneesFinancieres,

  // Tracking
  trackUsage,
} from '@/lib/ai'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Vérifier la configuration
    if (!isAnthropicConfigured()) {
      return new Response(
        JSON.stringify({ error: 'API Anthropic non configurée. Ajoutez ANTHROPIC_API_KEY dans .env.local' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ============================================
    // 0. AUTHENTIFICATION (obligatoire)
    // ============================================
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentification requise' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    const rawBody = await request.json()
    const parseResult = chatBodySchema.safeParse(rawBody)
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Données invalides', fields: parseResult.error.flatten().fieldErrors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const {
      messages,
      context,
      options = {},
    } = rawBody as {
      messages: Message[]
      context: ConversationContext
      options?: {
        includeLocalAnalysis?: boolean
      }
    }

    // ============================================
    // 0.5 VERIFICATION TOKENS + ACCES
    // ============================================

    // Vérifier les limites de tokens (toujours, même sans siren)
    const tokenUsage = await checkTokenUsage(userId)
    if (!tokenUsage.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Limite de tokens quotidienne atteinte. Réessayez demain ou passez au plan Pro.',
          code: 'TOKEN_LIMIT_REACHED',
          tokensUsed: tokenUsage.tokensUsed,
          tokenLimit: tokenUsage.tokenLimit,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const evalSiren = context.entreprise?.siren

    // Exiger un SIREN pour toute utilisation du chat
    if (!evalSiren) {
      return new Response(
        JSON.stringify({ error: 'SIREN requis pour démarrer une évaluation' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const evalAccess = await checkEvaluationAccess(userId, evalSiren)

    // Si l'utilisateur ne peut pas continuer -> bloquer
    if (!evalAccess.canContinue) {
      if (evalAccess.needsPayment) {
        return new Response(
          JSON.stringify({
            error: 'Paiement requis pour acceder a l\'evaluation complete.',
            code: 'PAYMENT_REQUIRED',
            upgrade: {
              url: `/checkout?siren=${evalSiren}&eval=${evalAccess.evaluation?.id}`,
              price: 79,
            },
          }),
          { status: 402, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({
          error: 'Acces non autorise a cette evaluation.',
          code: 'ACCESS_DENIED',
          status: evalAccess.evaluation?.status,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Incrementer le compteur de questions
    if (evalAccess.evaluation?.id) {
      await incrementQuestionCount(evalAccess.evaluation.id)
    }

    // Extraire les données financières du contexte
    const bilans = context.financials?.bilans
    const lastBilan = bilans?.[0] // Le bilan le plus récent
    const ratiosCtx = context.financials?.ratios

    const financialData: DonneesFinancieres | undefined = lastBilan
      ? {
          ca: lastBilan.chiffre_affaires || 0,
          ebitda: ratiosCtx?.ebitda || 0,
          resultatNet: lastBilan.resultat_net || 0,
          capitauxPropres: lastBilan.capitaux_propres || 0,
          dettes: lastBilan.dettes_financieres || 0,
          tresorerie: lastBilan.tresorerie || 0,
          effectif: context.entreprise?.effectif
            ? parseInt(context.entreprise.effectif.replace(/\D/g, ''), 10) || undefined
            : undefined,
        }
      : undefined

    // Déterminer le secteur
    const secteur = context.entreprise?.secteur || detectSectorFromNaf(context.entreprise?.codeNaf)

    // ============================================
    // 1. CALCULS LOCAUX (GRATUITS)
    // ============================================
    let localAnalysis: string | null = null

    if (options.includeLocalAnalysis && financialData && secteur) {
      const ratios = calculerRatios(financialData)
      const anomalies = detecterAnomalies(financialData, secteur)

      const ratiosMarkdown = genererResumeRatios(ratios, secteur)
      const anomaliesMarkdown = formaterAnomaliesMarkdown(anomalies)

      localAnalysis = `${ratiosMarkdown}\n\n${anomaliesMarkdown}`

      console.log('[API] Analyse locale générée (GRATUIT):', {
        ratios: Object.keys(ratios).length,
        anomalies: anomalies.anomalies.length,
      })
    }

    // ============================================
    // 2. GESTION DE SESSION SERVEUR (async avec Redis)
    // ============================================
    const siren = context.entreprise?.siren || ''
    let session = siren ? await findSessionBySiren(siren) : null

    if (!session && siren) {
      session = await createSession({
        siren,
        entrepriseNom: context.entreprise?.nom || 'Inconnu',
        secteur: secteur,
        initialFinancialData: financialData ? {
          chiffreAffaires: financialData.ca,
          ebitda: financialData.ebitda,
          resultatNet: financialData.resultatNet,
          capitauxPropres: financialData.capitauxPropres,
          dettesFinancieres: financialData.dettes,
          tresorerie: financialData.tresorerie,
        } : undefined,
      })
    }

    // ============================================
    // 3. ROUTAGE DU MODÈLE (v2 avec analyse sémantique)
    // ============================================
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
    // Récupérer le dernier message assistant (la question à laquelle l'utilisateur répond)
    // Utilisé pour différencier les réponses courtes dans le cache (ex: "20" pour % parts vs "20" pour places)
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()?.content || ''

    // Analyser la sémantique du message pour le routage et le logging
    const semantics = analyzePromptSemantics(lastUserMessage)

    const routingContext = createRoutingContext({
      step: context.evaluationProgress?.step || 1,
      totalSteps: 6,
      isUserMessage: messages[messages.length - 1]?.role === 'user',
      financialData,
      secteur,
      conversationLength: messages.length,
    })

    // IMPORTANT: Passer le prompt à routeToModel pour l'analyse sémantique
    const routingDecision = routeToModel(routingContext, lastUserMessage)
    logRoutingDecision(routingContext, routingDecision, semantics)

    // ============================================
    // 4. VÉRIFICATION DU CACHE (v2 avec SIREN obligatoire)
    // ============================================
    {
      const cacheResult = checkCache(lastUserMessage, {
        secteur,
        siren,  // SIREN maintenant inclus dans la clé de cache
        step: context.evaluationProgress?.step,
        totalSteps: 6,
        lastAssistantMessage,  // Pour différencier les réponses courtes
      })

      if (cacheResult.cached) {
        console.log('[API] Cache HIT - économie d\'appel API')

        // Tracker l'utilisation (cache hit)
        trackUsage({
          timestamp: Date.now(),
          model: routingDecision.model,
          modelId: routingDecision.modelId,
          inputTokens: cacheResult.entry.inputTokens,
          outputTokens: cacheResult.entry.outputTokens,
          cost: 0, // Gratuit car caché
          duration: Date.now() - startTime,
          cached: true,
          cacheHit: true,
          taskType: routingContext.messageType,
          siren: context.entreprise?.siren,
          step: context.evaluationProgress?.step,
        })

        // Enregistrer l'usage des tokens (meme cache, on compte quand meme)
        if (userId) {
          await recordTokenUsage(userId, cacheResult.entry.inputTokens + cacheResult.entry.outputTokens)
        }

        // Retourner la réponse cachée en stream simulé
        const encoder = new TextEncoder()
        const cachedResponse = localAnalysis
          ? `${localAnalysis}\n\n---\n\n${cacheResult.response}`
          : cacheResult.response

        const readableStream = new ReadableStream({
          start(controller) {
            // Envoyer la réponse en chunks
            const chunkSize = 100
            for (let i = 0; i < cachedResponse.length; i += chunkSize) {
              const chunk = cachedResponse.slice(i, i + chunkSize)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
            }
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
            controller.close()
          },
        })

        return new Response(readableStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Cache': 'HIT',
            'X-Model': routingDecision.model,
          },
        })
      }
    }

    // ============================================
    // 5. OPTIMISATION DU CONTEXTE
    // ============================================
    const contextWithProgress = {
      ...context,
      evaluationProgress: {
        ...context.evaluationProgress,
        step: (evalAccess.evaluation?.questions_count || 0) + 1,
      },
    }

    // ── Prompt archétype (seul chemin depuis la migration) ──
    const archetypeId = context.archetype || 'services_recurrents'
    if (!context.archetype) {
      console.warn('[API] Pas d\'archétype fourni — fallback services_recurrents')
    } else {
      console.log(`[API] Flow archétype: ${context.archetype}`)
    }

    let systemPrompt = buildArchetypePrompt({
      archetypeId,
      context: contextWithProgress,
      parcours: context.parcours,
      pedagogyLevel: context.pedagogyLevel,
      includeFondsCommerce: context.objet === 'fonds_commerce',
    })

    // Ajouter l'analyse locale au prompt si disponible
    if (localAnalysis) {
      systemPrompt += `\n\n## Analyse préliminaire (calculée automatiquement)\n${localAnalysis}`
    }

    let claudeMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,  // Le contenu inclut déjà l'analyse des documents formatée
    }))

    // Compresser le contexte si nécessaire
    if (necessiteCompression(systemPrompt, claudeMessages as Message[])) {
      console.log('[API] Compression du contexte activée')
      const optimized = optimiserContexte(systemPrompt, claudeMessages as Message[])
      claudeMessages = optimized.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
      console.log(`[API] Compression: ${(optimized.compressionRatio * 100).toFixed(1)}% économisé`)
    }

    // ============================================
    // 6. APPEL API CLAUDE
    // ============================================
    const inputTokensEstimate = estimerTokens(systemPrompt) +
      claudeMessages.reduce((sum, m) => sum + estimerTokens(m.content), 0)

    console.log('[API] Appel Claude:', {
      model: routingDecision.model,
      modelId: routingDecision.modelId,
      estimatedInputTokens: inputTokensEstimate,
      reason: routingDecision.reason,
    })

    // Utiliser le prompt caching pour économiser sur le system prompt répété
    // Le system prompt est envoyé comme un bloc avec cache_control
    // Avec fallback automatique si le modèle n'est pas disponible
    const fallbacks = getModelFallbacks(routingDecision.model as 'haiku' | 'sonnet')
    const modelsToTry = [routingDecision.modelId, ...fallbacks.filter(f => f !== routingDecision.modelId)]

    // Fonction helper pour créer un stream avec les params
    const createStreamWithModel = (modelId: string) => {
      return anthropic.messages.stream({
        model: modelId,
        max_tokens: 2048,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: claudeMessages,
      })
    }

    let usedModelId = routingDecision.modelId

    // ============================================
    // 7. STREAMING DE LA RÉPONSE (avec fallback transparent)
    // ============================================
    const encoder = new TextEncoder()
    let fullResponse = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        let stream: ReturnType<typeof anthropic.messages.stream> | null = null
        let lastError: Error | null = null

        // Essayer chaque modèle jusqu'à ce qu'un fonctionne
        for (const modelId of modelsToTry) {
          try {
            console.log(`[API] Tentative stream avec modèle: ${modelId}`)
            stream = createStreamWithModel(modelId)
            usedModelId = modelId

            // Essayer de consommer le stream - l'erreur 404 arrive ici
            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const text = event.delta.text
                fullResponse += text
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
              }
            }

            // Si on arrive ici, le stream a réussi - sortir de la boucle
            break
          } catch (error: unknown) {
            lastError = error as Error
            const errorMessage = (error as Error).message || ''
            const status = (error as { status?: number }).status

            // Si c'est une erreur 404 (modèle non trouvé), essayer le suivant
            if (status === 404 || errorMessage.includes('not_found')) {
              console.warn(`[API] Modèle ${modelId} non disponible, essai du suivant...`)
              fullResponse = '' // Reset la réponse pour le prochain essai
              stream = null
              continue
            }

            // Pour les autres erreurs, propager
            throw error
          }
        }

        // Si aucun modèle n'a fonctionné
        if (!stream) {
          throw lastError || new Error('Aucun modèle Claude disponible')
        }

        if (usedModelId !== routingDecision.modelId) {
          console.log(`[API] Fallback utilisé: ${routingDecision.modelId} -> ${usedModelId}`)
        }

        try {
          // Récupérer les stats réelles de tokens depuis la réponse Anthropic
          const finalMessage = await stream.finalMessage()
          const usage = finalMessage.usage

          // Tokens réels depuis l'API
          const inputTokens = usage.input_tokens
          const outputTokens = usage.output_tokens

          // Tokens de cache (si disponibles)
          const cacheCreationTokens = (usage as { cache_creation_input_tokens?: number }).cache_creation_input_tokens || 0
          const cacheReadTokens = (usage as { cache_read_input_tokens?: number }).cache_read_input_tokens || 0

          // Calculer les tokens facturables pour le quota utilisateur
          // Cache read = 10% du coût, donc on compte 10% des tokens cachés
          // Cache creation = 125% mais c'est rare (première fois)
          const billableInputTokens = inputTokens - cacheReadTokens + Math.ceil(cacheReadTokens * 0.1)
          const billableTokens = billableInputTokens + outputTokens

          // Fin du stream - sauvegarder dans le cache et tracker
          const cost = calculateCostWithCache(routingDecision.model, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens)

          // Sauvegarder dans le cache (v2 avec SIREN)
          saveToCache(lastUserMessage, fullResponse, {
            secteur,
            siren,  // SIREN obligatoire pour contenu spécifique
            step: context.evaluationProgress?.step,
            totalSteps: 6,
            lastAssistantMessage,  // Pour différencier les réponses courtes
          }, {
            model: routingDecision.model,
            inputTokens: billableInputTokens,
            outputTokens,
            cost,
          })

          // Sauvegarder dans la session serveur (async)
          if (session) {
            // Ajouter le message utilisateur
            await addConversationEntry(session.id, {
              role: 'user',
              content: lastUserMessage,
            })

            // Ajouter la réponse assistant
            await addConversationEntry(session.id, {
              role: 'assistant',
              content: fullResponse,
              model: routingDecision.model,
              tokens: { input: billableInputTokens, output: outputTokens },
              metadata: {
                step: context.evaluationProgress?.step,
                semantics: {
                  isFinancial: semantics.isFinancialQuestion,
                  complexity: semantics.complexityScore,
                },
                cache: {
                  cacheCreationTokens,
                  cacheReadTokens,
                  savings: cacheReadTokens > 0 ? Math.round((1 - 0.1) * cacheReadTokens) : 0,
                },
              },
            })

            // Mettre à jour l'étape si nécessaire
            const currentStep = context.evaluationProgress?.step || 1
            if (semantics.detectedTopics.length > 0) {
              await updateEvaluationStep(session.id, currentStep, semantics.detectedTopics[0])
            }
          }

          // Détecter si l'IA a donné l'évaluation complète
          if (fullResponse.includes('[EVALUATION_COMPLETE]')) {
            console.log('[API] Évaluation complète détectée - synthèse livrée')
          }

          // Tracker l'utilisation
          trackUsage({
            timestamp: Date.now(),
            model: routingDecision.model,
            modelId: routingDecision.modelId,
            inputTokens: billableInputTokens,
            outputTokens,
            cost,
            duration: Date.now() - startTime,
            cached: false,
            cacheHit: cacheReadTokens > 0,
            taskType: routingContext.messageType,
            siren: context.entreprise?.siren,
            step: context.evaluationProgress?.step,
          })

          // Enregistrer l'usage des tokens pour l'utilisateur (tokens facturables)
          if (userId) {
            await recordTokenUsage(userId, billableTokens)
          }

          console.log('[API] Réponse complète:', {
            model: routingDecision.model,
            inputTokens,
            outputTokens,
            cacheCreationTokens,
            cacheReadTokens,
            billableTokens,
            savings: cacheReadTokens > 0 ? `${Math.round((cacheReadTokens / inputTokens) * 90)}%` : '0%',
            cost: `$${cost.toFixed(6)}`,
            duration: `${Date.now() - startTime}ms`,
          })

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (error) {
          console.error('Erreur streaming:', error)
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Cache': 'MISS',
        'X-Model': routingDecision.model,
      },
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Erreur API Chat:', errorMessage, error instanceof Error ? error.stack : '')

    const status = (error as { status?: number }).status
    if (status === 429) {
      return new Response(
        JSON.stringify({
          error: 'Le service est temporairement surcharge. Reessayez dans quelques secondes.',
          code: 'RATE_LIMIT',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        error: 'Une erreur est survenue. Reessayez ou contactez contact@evalup.fr si le probleme persiste.',
        code: 'INTERNAL_ERROR',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Détecte le secteur à partir du code NAF
 */
function detectSectorFromNaf(codeNaf?: string): string {
  if (!codeNaf) return 'services'

  const code = codeNaf.substring(0, 2)

  const mapping: Record<string, string> = {
    '10': 'industrie', '11': 'industrie', '12': 'industrie',
    '41': 'btp', '42': 'btp', '43': 'btp',
    '45': 'commerce', '46': 'commerce', '47': 'commerce',
    '49': 'transport', '50': 'transport', '51': 'transport', '52': 'transport',
    '55': 'restaurant', '56': 'restaurant',
    '62': 'saas', '63': 'saas',
  }

  return mapping[code] || 'services'
}

/**
 * Calcule le coût d'un appel API avec prompt caching
 * - Cache write (creation): 1.25x le prix input
 * - Cache read: 0.1x le prix input (90% de réduction)
 * - Input normal: 1x le prix input
 * - Output: prix output normal
 */
function calculateCostWithCache(
  model: ModelType,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens: number,
  cacheReadTokens: number
): number {
  const pricing = {
    haiku: { input: 0.25, output: 1.25 },
    sonnet: { input: 3, output: 15 },
  }

  const p = pricing[model]

  // Tokens non-cachés = input total - cache creation - cache read
  const regularInputTokens = inputTokens - cacheCreationTokens - cacheReadTokens

  // Calcul du coût
  const regularInputCost = (regularInputTokens / 1_000_000) * p.input
  const cacheCreationCost = (cacheCreationTokens / 1_000_000) * p.input * 1.25
  const cacheReadCost = (cacheReadTokens / 1_000_000) * p.input * 0.1
  const outputCost = (outputTokens / 1_000_000) * p.output

  return regularInputCost + cacheCreationCost + cacheReadCost + outputCost
}
