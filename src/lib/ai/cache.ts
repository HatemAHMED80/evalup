// Système de cache pour les réponses AI
// Évite les appels API redondants et réduit les coûts
// Version 2.0: Avec SIREN dans la clé, types de contenu, et invalidation

/**
 * Types de contenu pour le cache - détermine le TTL et si le SIREN est requis
 */
export type CacheContentType =
  | 'sector_general'      // Benchmarks sectoriels génériques (partageable entre entreprises)
  | 'company_specific'    // Données spécifiques à l'entreprise (SIREN requis)
  | 'ratio_analysis'      // Interprétation de ratios (dépend du contexte entreprise)
  | 'user_clarification'  // Réponses aux questions de clarification
  | 'synthesis'           // Synthèse finale de valorisation

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
  // Nouveaux champs v2
  siren?: string
  contentType: CacheContentType
}

export interface CacheConfig {
  ttl: Record<CacheContentType, number>
  maxEntries: number
  maxMemoryMB: number
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: {
    sector_general: 86400,      // 24h - benchmarks sectoriels génériques
    company_specific: 3600,     // 1h - données spécifiques entreprise
    ratio_analysis: 1800,       // 30min - interprétation contextuelle
    user_clarification: 300,    // 5min - réponses conversationnelles
    synthesis: 600,             // 10min - synthèse finale
  },
  maxEntries: 1000,
  maxMemoryMB: 50,
}

// Cache en mémoire (pour le serveur Next.js)
const memoryCache = new Map<string, CacheEntry>()

/**
 * Patterns pour détecter le type de contenu
 */
const CONTENT_TYPE_PATTERNS = {
  // Patterns spécifiques à l'entreprise (nécessitent SIREN dans la clé)
  companySpecific: [
    /ratio.*(entreprise|société|cette|notre|votre)/i,
    /valorisation/i,
    /ebitda/i,
    /chiffre d'affaires/i,
    /résultat/i,
    /bilan/i,
    /trésorerie/i,
    /dette.*entreprise/i,
    /multiple.*ebitda/i,
    /combien.*vaut/i,
    /valeur.*entreprise/i,
  ],

  // Patterns sectoriels généraux (peuvent être partagés)
  sectorGeneral: [
    /benchmark.*secteur/i,
    /moyenne.*sectorielle/i,
    /multiple.*typique/i,
    /méthode.*valorisation.*général/i,
    /pratique.*marché/i,
    /tendance.*secteur/i,
    /norme.*industrie/i,
  ],

  // Patterns d'analyse de ratios
  ratioAnalysis: [
    /ratio/i,
    /marge/i,
    /taux/i,
    /rentabilité/i,
  ],
}

/**
 * Détermine le type de contenu basé sur l'analyse du prompt
 */
export function determineContentType(
  prompt: string,
  context?: { siren?: string; step?: number; totalSteps?: number }
): CacheContentType {
  const promptLower = prompt.toLowerCase()

  // Synthèse finale (dernière étape)
  if (context?.step && context?.totalSteps && context.step === context.totalSteps) {
    return 'synthesis'
  }

  // Vérifier d'abord si c'est spécifique à l'entreprise
  const isCompanySpecific = CONTENT_TYPE_PATTERNS.companySpecific.some(p => p.test(prompt))
  if (isCompanySpecific) {
    return 'company_specific'
  }

  // Vérifier si c'est un benchmark/info sectorielle générale
  const isSectorGeneral = CONTENT_TYPE_PATTERNS.sectorGeneral.some(p => p.test(prompt))
  if (isSectorGeneral) {
    return 'sector_general'
  }

  // Vérifier si c'est une analyse de ratios
  const isRatioAnalysis = CONTENT_TYPE_PATTERNS.ratioAnalysis.some(p => p.test(prompt))
  if (isRatioAnalysis) {
    // Les ratios sont spécifiques à l'entreprise sauf si explicitement sectoriels
    return 'ratio_analysis'
  }

  // Par défaut: clarification utilisateur
  return 'user_clarification'
}

/**
 * Génère un hash cryptographique SHA-256 (compatible Node.js runtime)
 */
function generateStrongHash(content: string): string {
  const { createHash } = require('crypto') as typeof import('crypto')
  return createHash('sha256').update(content).digest('hex').substring(0, 32)
}

/**
 * Génère une clé de cache unique basée sur le contenu
 * IMPORTANT: Inclut le SIREN pour les contenus spécifiques à l'entreprise
 * IMPORTANT: Inclut la dernière question (assistant) pour différencier les réponses courtes
 */
export function generateCacheKey(
  prompt: string,
  context: {
    secteur?: string
    siren?: string
    step?: number
    totalSteps?: number
    lastAssistantMessage?: string  // La question à laquelle l'utilisateur répond
  }
): string {
  const contentType = determineContentType(prompt, context)

  // Pour le contenu sectoriel général, ne pas inclure le SIREN (partageable)
  const isSectorGeneral = contentType === 'sector_general'

  // Pour les réponses courtes (< 50 caractères), inclure le contexte de la question
  // Cela évite que "20" pour "% de parts" soit confondu avec "20" pour "places assises"
  const isShortResponse = prompt.length < 50
  const questionContext = isShortResponse && context.lastAssistantMessage
    ? generateStrongHash(context.lastAssistantMessage.slice(-200)) // Hash des 200 derniers caractères de la question
    : 'no_context'

  const keyComponents = {
    // SIREN: 'GLOBAL' pour contenu partageable, sinon le SIREN réel
    siren: isSectorGeneral ? 'GLOBAL' : (context.siren || 'UNKNOWN'),
    // Hash du prompt COMPLET (pas tronqué!)
    promptHash: generateStrongHash(prompt),
    // Secteur pour affiner le cache sectoriel
    secteur: context.secteur || 'default',
    // Step pour contexte de conversation
    step: context.step || 0,
    // Type de contenu
    contentType,
    // Contexte de la question pour les réponses courtes
    questionContext,
  }

  // Générer la clé finale
  return generateStrongHash(JSON.stringify(keyComponents))
}

/**
 * Détermine le type de cache et son TTL
 */
export function getCacheType(
  prompt: string,
  step: number,
  totalSteps: number
): { type: CacheContentType; ttl: number } {
  const contentType = determineContentType(prompt, { step, totalSteps })
  return {
    type: contentType,
    ttl: DEFAULT_CONFIG.ttl[contentType],
  }
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
    siren?: string
    contentType?: CacheContentType
  }
): CacheEntry {
  // Nettoyer le cache si nécessaire
  cleanupCache()

  const now = Date.now()
  const contentType = metadata.contentType || 'user_clarification'
  const ttl = metadata.ttl || DEFAULT_CONFIG.ttl[contentType]

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
    siren: metadata.siren,
    contentType,
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
 * Invalide le cache quand un document est uploadé
 * Supprime toutes les entrées spécifiques à l'entreprise pour ce SIREN
 */
export function invalidateOnDocumentUpload(siren: string): number {
  let invalidated = 0

  for (const [key, entry] of memoryCache.entries()) {
    // Invalider seulement le contenu spécifique à l'entreprise
    // Garder le contenu sectoriel général (sector_general)
    if (
      entry.siren === siren &&
      entry.contentType !== 'sector_general'
    ) {
      memoryCache.delete(key)
      invalidated++
    }
  }

  if (invalidated > 0) {
    console.log(`[Cache] Invalidé ${invalidated} entrées pour SIREN ${siren} après upload document`)
  }

  return invalidated
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
  byContentType: Record<CacheContentType, number>
} {
  let totalHits = 0
  let totalCostSaved = 0
  let memoryUsage = 0
  const byContentType: Record<CacheContentType, number> = {
    sector_general: 0,
    company_specific: 0,
    ratio_analysis: 0,
    user_clarification: 0,
    synthesis: 0,
  }

  for (const entry of memoryCache.values()) {
    totalHits += entry.hitCount
    totalCostSaved += entry.cost * entry.hitCount
    memoryUsage += entry.response.length * 2 // Approximation UTF-16
    byContentType[entry.contentType]++
  }

  return {
    entries: memoryCache.size,
    totalHits,
    totalCostSaved,
    memoryUsageKB: Math.round(memoryUsage / 1024),
    byContentType,
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
      contentType: entry.contentType,
      siren: entry.siren?.substring(0, 4) || 'GLOBAL',
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
      contentType: entry.contentType,
      siren: entry.siren?.substring(0, 4) || 'GLOBAL',
      ttl: `${Math.round((entry.expiresAt - entry.createdAt) / 1000)}s`,
      cost: `$${entry.cost.toFixed(6)}`,
    })
  }
}

/**
 * Options pour le check cache
 */
export interface CacheCheckOptions {
  skipCache?: boolean
  forceRefresh?: boolean
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
    lastAssistantMessage?: string
  },
  options?: CacheCheckOptions
): { cached: true; response: string; entry: CacheEntry } | { cached: false } {
  // Permettre de forcer le bypass du cache
  if (options?.skipCache || options?.forceRefresh) {
    return { cached: false }
  }

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
    lastAssistantMessage?: string
  },
  metadata: {
    model: string
    inputTokens: number
    outputTokens: number
    cost: number
  }
): CacheEntry {
  const key = generateCacheKey(prompt, context)
  const contentType = determineContentType(prompt, context)
  const { ttl } = getCacheType(prompt, context.step || 1, context.totalSteps || 6)

  const tags: string[] = []
  if (context.siren) tags.push(`siren:${context.siren}`)
  if (context.secteur) tags.push(`secteur:${context.secteur}`)
  tags.push(`type:${contentType}`)

  return addToCache(key, response, {
    ...metadata,
    ttl,
    tags,
    siren: context.siren,
    contentType,
  })
}
