// Système de cache pour les réponses AI
// Évite les appels API redondants et réduit les coûts

export interface CacheEntry {
  key: string
  response: string
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  createdAt: number
  expiresAt: number
  hitCount: number
  tags: string[]
}

export interface CacheConfig {
  // Durées de cache par type (en secondes)
  ttl: {
    sectorInfo: number // Infos sectorielles (24h)
    benchmarks: number // Benchmarks (24h)
    calculations: number // Calculs (1h)
    userResponses: number // Réponses utilisateur (5min)
    synthesis: number // Synthèses (10min)
  }
  maxEntries: number
  maxMemoryMB: number
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: {
    sectorInfo: 86400, // 24h
    benchmarks: 86400, // 24h
    calculations: 3600, // 1h
    userResponses: 300, // 5min
    synthesis: 600, // 10min
  },
  maxEntries: 1000,
  maxMemoryMB: 50,
}

// Cache en mémoire (pour le serveur Next.js)
const memoryCache = new Map<string, CacheEntry>()

/**
 * Génère une clé de cache unique basée sur le contenu
 * Utilise un hash simple compatible avec tous les environnements
 */
export function generateCacheKey(
  prompt: string,
  context: {
    secteur?: string
    siren?: string
    step?: number
  }
): string {
  const content = JSON.stringify({
    prompt: prompt.substring(0, 500), // Limiter la taille
    secteur: context.secteur,
    step: context.step,
  })

  // Hash simple compatible Vercel (pas besoin de crypto)
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).padStart(16, '0').substring(0, 16)
}

/**
 * Détermine le type de cache et son TTL
 */
export function getCacheType(
  prompt: string,
  step: number,
  totalSteps: number
): { type: keyof CacheConfig['ttl']; ttl: number } {
  const promptLower = prompt.toLowerCase()

  // Synthèse finale
  if (step === totalSteps) {
    return { type: 'synthesis', ttl: DEFAULT_CONFIG.ttl.synthesis }
  }

  // Benchmarks et ratios sectoriels
  if (
    promptLower.includes('benchmark') ||
    promptLower.includes('ratio') ||
    promptLower.includes('moyenne sectorielle')
  ) {
    return { type: 'benchmarks', ttl: DEFAULT_CONFIG.ttl.benchmarks }
  }

  // Informations sectorielles générales
  if (
    promptLower.includes('secteur') ||
    promptLower.includes('méthode') ||
    promptLower.includes('multiple')
  ) {
    return { type: 'sectorInfo', ttl: DEFAULT_CONFIG.ttl.sectorInfo }
  }

  // Calculs et analyses
  if (
    promptLower.includes('calcul') ||
    promptLower.includes('valorisation')
  ) {
    return { type: 'calculations', ttl: DEFAULT_CONFIG.ttl.calculations }
  }

  // Par défaut: réponses utilisateur (courte durée)
  return { type: 'userResponses', ttl: DEFAULT_CONFIG.ttl.userResponses }
}

/**
 * Récupère une entrée du cache
 */
export function getFromCache(key: string): CacheEntry | null {
  const entry = memoryCache.get(key)

  if (!entry) {
    return null
  }

  // Vérifier l'expiration
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key)
    return null
  }

  // Incrémenter le compteur de hits
  entry.hitCount++
  memoryCache.set(key, entry)

  logCacheHit(key, entry)
  return entry
}

/**
 * Ajoute une entrée au cache
 */
export function addToCache(
  key: string,
  response: string,
  metadata: {
    model: string
    inputTokens: number
    outputTokens: number
    cost: number
    tags?: string[]
    ttl?: number
  }
): CacheEntry {
  // Nettoyer le cache si nécessaire
  cleanupCache()

  const now = Date.now()
  const ttl = metadata.ttl || DEFAULT_CONFIG.ttl.userResponses

  const entry: CacheEntry = {
    key,
    response,
    model: metadata.model,
    inputTokens: metadata.inputTokens,
    outputTokens: metadata.outputTokens,
    cost: metadata.cost,
    createdAt: now,
    expiresAt: now + ttl * 1000,
    hitCount: 0,
    tags: metadata.tags || [],
  }

  memoryCache.set(key, entry)
  logCacheAdd(key, entry)

  return entry
}

/**
 * Invalide les entrées du cache par tag
 */
export function invalidateByTag(tag: string): number {
  let count = 0

  for (const [key, entry] of memoryCache.entries()) {
    if (entry.tags.includes(tag)) {
      memoryCache.delete(key)
      count++
    }
  }

  if (count > 0) {
    console.log(`[Cache] Invalidé ${count} entrées avec tag "${tag}"`)
  }

  return count
}

/**
 * Invalide toutes les entrées pour un SIREN
 */
export function invalidateBySiren(siren: string): number {
  return invalidateByTag(`siren:${siren}`)
}

/**
 * Nettoie les entrées expirées du cache
 */
export function cleanupCache(): void {
  const now = Date.now()
  let removed = 0

  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.expiresAt) {
      memoryCache.delete(key)
      removed++
    }
  }

  // Si toujours trop d'entrées, supprimer les plus anciennes
  if (memoryCache.size > DEFAULT_CONFIG.maxEntries) {
    const entries = Array.from(memoryCache.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt)

    const toRemove = entries.slice(0, memoryCache.size - DEFAULT_CONFIG.maxEntries)
    for (const [key] of toRemove) {
      memoryCache.delete(key)
      removed++
    }
  }

  if (removed > 0) {
    console.log(`[Cache] Nettoyé ${removed} entrées`)
  }
}

/**
 * Récupère les statistiques du cache
 */
export function getCacheStats(): {
  entries: number
  totalHits: number
  totalCostSaved: number
  memoryUsageKB: number
} {
  let totalHits = 0
  let totalCostSaved = 0
  let memoryUsage = 0

  for (const entry of memoryCache.values()) {
    totalHits += entry.hitCount
    totalCostSaved += entry.cost * entry.hitCount
    memoryUsage += entry.response.length * 2 // Approximation UTF-16
  }

  return {
    entries: memoryCache.size,
    totalHits,
    totalCostSaved,
    memoryUsageKB: Math.round(memoryUsage / 1024),
  }
}

/**
 * Vide complètement le cache
 */
export function clearCache(): void {
  const size = memoryCache.size
  memoryCache.clear()
  console.log(`[Cache] Vidé ${size} entrées`)
}

/**
 * Log un cache hit (pour debug)
 */
function logCacheHit(key: string, entry: CacheEntry): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Cache] HIT:', {
      key: key.substring(0, 8),
      model: entry.model,
      hitCount: entry.hitCount,
      costSaved: `$${entry.cost.toFixed(6)}`,
    })
  }
}

/**
 * Log un cache add (pour debug)
 */
function logCacheAdd(key: string, entry: CacheEntry): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Cache] ADD:', {
      key: key.substring(0, 8),
      model: entry.model,
      ttl: `${Math.round((entry.expiresAt - entry.createdAt) / 1000)}s`,
      cost: `$${entry.cost.toFixed(6)}`,
    })
  }
}

/**
 * Middleware pour vérifier le cache avant un appel API
 * Retourne la réponse cachée ou null
 */
export function checkCache(
  prompt: string,
  context: {
    secteur?: string
    siren?: string
    step?: number
    totalSteps?: number
  }
): { cached: true; response: string; entry: CacheEntry } | { cached: false } {
  const key = generateCacheKey(prompt, context)
  const entry = getFromCache(key)

  if (entry) {
    return { cached: true, response: entry.response, entry }
  }

  return { cached: false }
}

/**
 * Sauvegarde une réponse dans le cache après un appel API
 */
export function saveToCache(
  prompt: string,
  response: string,
  context: {
    secteur?: string
    siren?: string
    step?: number
    totalSteps?: number
  },
  metadata: {
    model: string
    inputTokens: number
    outputTokens: number
    cost: number
  }
): CacheEntry {
  const key = generateCacheKey(prompt, context)
  const { ttl } = getCacheType(prompt, context.step || 1, context.totalSteps || 10)

  const tags: string[] = []
  if (context.siren) tags.push(`siren:${context.siren}`)
  if (context.secteur) tags.push(`secteur:${context.secteur}`)

  return addToCache(key, response, {
    ...metadata,
    ttl,
    tags,
  })
}
