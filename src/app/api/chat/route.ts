// API Route pour le chat avec Claude (streaming + optimisation des coûts)
// Version 2.0: Avec analyse sémantique et sessions serveur
import { NextRequest } from 'next/server'
import { anthropic, isAnthropicConfigured } from '@/lib/anthropic'
import type { ConversationContext, Message } from '@/lib/anthropic'
import { getSystemPrompt } from '@/lib/prompts'
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
  getCacheType,

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

    const body = await request.json()
    const {
      messages,
      context,
      options = {},
    }: {
      messages: Message[]
      context: ConversationContext
      options?: {
        forceModel?: ModelType
        skipCache?: boolean
        includeLocalAnalysis?: boolean
      }
    } = body

    // Extraire les données financières du contexte
    const lastBilan = context.financials?.bilans?.[0] // Le bilan le plus récent
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

    // Analyser la sémantique du message pour le routage et le logging
    const semantics = analyzePromptSemantics(lastUserMessage)

    const routingContext = createRoutingContext({
      step: context.evaluationProgress?.step || 1,
      totalSteps: 6,
      isUserMessage: messages[messages.length - 1]?.role === 'user',
      financialData,
      secteur,
      conversationLength: messages.length,
      forceModel: options.forceModel,
    })

    // IMPORTANT: Passer le prompt à routeToModel pour l'analyse sémantique
    const routingDecision = routeToModel(routingContext, lastUserMessage)
    logRoutingDecision(routingContext, routingDecision, semantics)

    // ============================================
    // 4. VÉRIFICATION DU CACHE (v2 avec SIREN obligatoire)
    // ============================================
    if (!options.skipCache) {
      const cacheResult = checkCache(lastUserMessage, {
        secteur,
        siren,  // SIREN maintenant inclus dans la clé de cache
        step: context.evaluationProgress?.step,
        totalSteps: 6,
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
    let systemPrompt = getSystemPrompt(context.entreprise?.codeNaf, context)

    // Ajouter l'analyse locale au prompt si disponible
    if (localAnalysis) {
      systemPrompt += `\n\n## Analyse préliminaire (calculée automatiquement)\n${localAnalysis}`
    }

    let claudeMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content + (m.documents?.length
        ? `\n\n[Documents joints: ${m.documents.map(d => d.name).join(', ')}]`
        : ''),
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

    const stream = await anthropic.messages.stream({
      model: routingDecision.modelId,
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages,
    })

    // ============================================
    // 7. STREAMING DE LA RÉPONSE
    // ============================================
    const encoder = new TextEncoder()
    let fullResponse = ''
    let outputTokens = 0

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const text = event.delta.text
              fullResponse += text
              outputTokens += estimerTokens(text)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }

          // Fin du stream - sauvegarder dans le cache et tracker
          const { ttl } = getCacheType(lastUserMessage, context.evaluationProgress?.step || 1, 6)
          const cost = calculateCost(routingDecision.model, inputTokensEstimate, outputTokens)

          // Sauvegarder dans le cache (v2 avec SIREN)
          saveToCache(lastUserMessage, fullResponse, {
            secteur,
            siren,  // SIREN obligatoire pour contenu spécifique
            step: context.evaluationProgress?.step,
            totalSteps: 6,
          }, {
            model: routingDecision.model,
            inputTokens: inputTokensEstimate,
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
              tokens: { input: inputTokensEstimate, output: outputTokens },
              metadata: {
                step: context.evaluationProgress?.step,
                semantics: {
                  isFinancial: semantics.isFinancialQuestion,
                  complexity: semantics.complexityScore,
                },
              },
            })

            // Mettre à jour l'étape si nécessaire
            const currentStep = context.evaluationProgress?.step || 1
            if (semantics.detectedTopics.length > 0) {
              await updateEvaluationStep(session.id, currentStep, semantics.detectedTopics[0])
            }
          }

          // Tracker l'utilisation
          trackUsage({
            timestamp: Date.now(),
            model: routingDecision.model,
            modelId: routingDecision.modelId,
            inputTokens: inputTokensEstimate,
            outputTokens,
            cost,
            duration: Date.now() - startTime,
            cached: false,
            cacheHit: false,
            taskType: routingContext.messageType,
            siren: context.entreprise?.siren,
            step: context.evaluationProgress?.step,
          })

          console.log('[API] Réponse complète:', {
            model: routingDecision.model,
            inputTokens: inputTokensEstimate,
            outputTokens,
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
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Erreur API Chat:', errorMessage, errorStack)
    return new Response(
      JSON.stringify({
        error: `Erreur API: ${errorMessage}`,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
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
 * Calcule le coût d'un appel API
 */
function calculateCost(model: ModelType, inputTokens: number, outputTokens: number): number {
  const pricing = {
    haiku: { input: 0.25, output: 1.25 },
    sonnet: { input: 3, output: 15 },
  }

  const p = pricing[model]
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output
}
