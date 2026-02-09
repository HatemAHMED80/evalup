/**
 * Rate limiting avec Upstash Redis
 */

import { Redis } from '@upstash/redis'

// Configuration des limites
export const RATE_LIMITS = {
  // Upload de documents: 10 par minute
  documentUpload: { requests: 10, window: 60 },
  // Analyse entreprise: 30 par minute
  entrepriseApi: { requests: 30, window: 60 },
  // Chat API: 20 par minute
  chatApi: { requests: 20, window: 60 },
  // Scraping BODACC (admin): 5 par heure
  scrapeBodacc: { requests: 5, window: 3600 },
  // Generic fallback
  default: { requests: 100, window: 60 },
}

type RateLimitKey = keyof typeof RATE_LIMITS

// Rate-limiter en mémoire (fallback quand Redis n'est pas disponible)
const inMemoryStore = new Map<string, number[]>()

function checkInMemoryRateLimit(
  identifier: string,
  action: string,
  config: { requests: number; window: number }
): RateLimitResult {
  const key = `${action}:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.window

  // Récupérer et filtrer les timestamps dans la fenêtre
  const timestamps = (inMemoryStore.get(key) || []).filter(t => t > windowStart)

  if (timestamps.length >= config.requests) {
    inMemoryStore.set(key, timestamps)
    return {
      success: false,
      remaining: 0,
      reset: now + config.window,
      limit: config.requests,
    }
  }

  timestamps.push(now)
  inMemoryStore.set(key, timestamps)

  // Nettoyage périodique (éviter fuite mémoire) : supprimer les clés anciennes toutes les 1000 entrées
  if (inMemoryStore.size > 10000) {
    for (const [k, v] of inMemoryStore.entries()) {
      const filtered = v.filter(t => t > now - 3600)
      if (filtered.length === 0) inMemoryStore.delete(k)
      else inMemoryStore.set(k, filtered)
    }
  }

  return {
    success: true,
    remaining: Math.max(0, config.requests - timestamps.length),
    reset: now + config.window,
    limit: config.requests,
  }
}

// Client Redis (lazy init)
let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (!url || !token) {
    console.warn('[RateLimit] Redis non configuré - fallback mémoire activé')
    return null
  }

  _redis = new Redis({ url, token })
  return _redis
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number // timestamp en secondes
  limit: number
}

/**
 * Vérifie et incrémente le rate limit pour un identifiant
 * @param identifier - IP ou user ID
 * @param action - Type d'action (clé dans RATE_LIMITS)
 */
export async function checkRateLimit(
  identifier: string,
  action: RateLimitKey = 'default'
): Promise<RateLimitResult> {
  const redis = getRedis()
  const config = RATE_LIMITS[action]

  // Si Redis n'est pas configuré, utiliser un rate-limiter en mémoire (fail-closed)
  if (!redis) {
    return checkInMemoryRateLimit(identifier, action, config)
  }

  const key = `ratelimit:${action}:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.window

  try {
    // Utiliser un sorted set pour le sliding window
    const pipeline = redis.pipeline()

    // Supprimer les anciennes entrées
    pipeline.zremrangebyscore(key, 0, windowStart)

    // Compter les requêtes dans la fenêtre
    pipeline.zcard(key)

    // Ajouter la requête actuelle
    pipeline.zadd(key, { score: now, member: `${now}:${Math.random()}` })

    // Définir l'expiration
    pipeline.expire(key, config.window)

    const results = await pipeline.exec()

    // Le count est le résultat de zcard (index 1)
    const count = (results[1] as number) || 0

    if (count >= config.requests) {
      // Limite atteinte - ne pas compter cette requête
      await redis.zrem(key, `${now}:${Math.random()}`)

      return {
        success: false,
        remaining: 0,
        reset: now + config.window,
        limit: config.requests,
      }
    }

    return {
      success: true,
      remaining: Math.max(0, config.requests - count - 1),
      reset: now + config.window,
      limit: config.requests,
    }
  } catch (error) {
    console.error('[RateLimit] Erreur Redis, fallback mémoire:', error)
    // En cas d'erreur Redis, utiliser le rate-limiter mémoire (fail-closed)
    return checkInMemoryRateLimit(identifier, action, config)
  }
}

/**
 * Extrait l'IP d'une requête Next.js
 */
export function getClientIp(request: Request): string {
  // Headers de proxy (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback
  return 'unknown'
}

/**
 * Headers de rate limit pour la réponse
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}
