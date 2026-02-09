// API Route pour vérifier l'état des modèles Claude
// Utile pour le monitoring et les alertes

import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { MODELS, getModelFallbacks } from '@/lib/ai/models'

interface ModelStatus {
  id: string
  name: string
  status: 'ok' | 'fallback' | 'error'
  fallbackUsed?: string
  error?: string
  latency?: number
}

export async function GET(request: Request) {
  // Protéger l'endpoint : nécessite un token Bearer si HEALTH_CHECK_TOKEN est configuré
  const expectedToken = process.env.HEALTH_CHECK_TOKEN
  if (expectedToken) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const results: Record<string, ModelStatus> = {}

  for (const [key, config] of Object.entries(MODELS)) {
    const fallbacks = getModelFallbacks(key as 'haiku' | 'sonnet')
    const modelsToTry = [config.id, ...fallbacks.filter(f => f !== config.id)]

    let status: ModelStatus = {
      id: config.id,
      name: config.name,
      status: 'error',
    }

    for (const modelId of modelsToTry) {
      const startTime = Date.now()
      try {
        // Test minimal - juste vérifier que le modèle répond
        await anthropic.messages.create({
          model: modelId,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }],
        })

        const latency = Date.now() - startTime

        if (modelId === config.id) {
          status = {
            id: config.id,
            name: config.name,
            status: 'ok',
            latency,
          }
        } else {
          status = {
            id: config.id,
            name: config.name,
            status: 'fallback',
            fallbackUsed: modelId,
            latency,
          }
          // Log warning pour monitoring
          console.warn(`[ALERT] Modèle ${config.id} indisponible, fallback sur ${modelId}`)
        }
        break
      } catch (error: unknown) {
        const errorStatus = (error as { status?: number }).status
        if (errorStatus === 404) {
          console.warn(`[Health] Modèle ${modelId} non trouvé (404)`)
          continue
        }
        status = {
          id: config.id,
          name: config.name,
          status: 'error',
          error: (error as Error).message,
        }
        break
      }
    }

    results[key] = status
  }

  // Vérifier si des fallbacks sont utilisés
  const hasFallbacks = Object.values(results).some(r => r.status === 'fallback')
  const hasErrors = Object.values(results).some(r => r.status === 'error')

  // Générer un résumé pour les logs/alertes
  if (hasFallbacks || hasErrors) {
    const issues = Object.entries(results)
      .filter(([, r]) => r.status !== 'ok')
      .map(([key, r]) => {
        if (r.status === 'fallback') {
          return `${key}: ${r.id} -> ${r.fallbackUsed}`
        }
        return `${key}: ERROR - ${r.error}`
      })

    console.warn(`[MODELS ALERT] Issues détectées:\n${issues.join('\n')}`)
  }

  return NextResponse.json({
    status: hasErrors ? 'degraded' : hasFallbacks ? 'fallback' : 'healthy',
    timestamp: new Date().toISOString(),
    models: results,
    action: hasFallbacks
      ? 'Mettre à jour les modèles dans .env ou src/lib/ai/models.ts'
      : hasErrors
        ? 'Vérifier la clé API et les modèles'
        : null,
  })
}
