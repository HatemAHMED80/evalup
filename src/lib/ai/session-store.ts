// Stockage de session persistant avec Upstash Redis
// Fonctionne sur Vercel serverless - sessions partagées entre toutes les instances
// Fallback vers mémoire locale si Redis non configuré (dev local)

import { Redis } from '@upstash/redis'
import { invalidateOnDocumentUpload } from './cache'

// ============================================
// CONFIGURATION REDIS
// ============================================

// Créer le client Redis si les variables d'env sont configurées
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  if (url && token) {
    redis = new Redis({ url, token })
    console.log('[Session] Redis connecté')
  }

  return redis
}

// Fallback en mémoire pour dev local
const memoryFallback = new Map<string, SessionData>()
const sirenIndex = new Map<string, string>() // siren -> sessionId

// ============================================
// TYPES
// ============================================

export interface DocumentAnalysisResult {
  documentType: 'bilan' | 'compte_resultat' | 'liasse_fiscale' | 'autre'
  confidence: number
  extractedData: Record<string, unknown>
  warnings?: string[]
}

export interface DocumentReference {
  id: string
  name: string
  uploadedAt: number
  size: number
  mimeType: string
  financialYear?: number
  analysisResult?: DocumentAnalysisResult
  status: 'pending' | 'analyzing' | 'analyzed' | 'error'
  errorMessage?: string
}

export interface ConversationEntry {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  model?: string
  tokens?: { input: number; output: number }
  metadata?: {
    step?: number
    topic?: string
    semantics?: { isFinancial: boolean; complexity: number }
  }
}

export interface FinancialContext {
  chiffreAffaires?: number
  ebitda?: number
  resultatNet?: number
  capitauxPropres?: number
  dettesFinancieres?: number
  tresorerie?: number
  annees: number[]
  anneePrincipale?: number
  ratios?: {
    margeEbitda?: number
    detteEbitda?: number
    rentabiliteCapitaux?: number
    liquiditeGenerale?: number
  }
  source: 'api' | 'document' | 'user' | 'mixed'
  lastUpdated: number
}

export interface EvaluationState {
  currentStep: number
  totalSteps: number
  completedTopics: string[]
  pendingQuestions: string[]
  valorisationRange?: {
    min: number
    max: number
    central: number
    methodologie: string
  }
}

export interface SessionData {
  id: string
  siren: string
  entrepriseNom: string
  secteur: string
  createdAt: number
  lastActivity: number
  expiresAt: number
  documents: DocumentReference[]
  conversationHistory: ConversationEntry[]
  financialContext: FinancialContext
  evaluationState: EvaluationState
}

// ============================================
// CONFIGURATION
// ============================================

const SESSION_CONFIG = {
  ttlSeconds: 60 * 60, // 1 heure
  maxHistoryLength: 100,
  keyPrefix: 'evalup:session:',
  sirenIndexPrefix: 'evalup:siren:',
}

// ============================================
// HELPERS
// ============================================

function generateSessionId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `sess_${timestamp}_${randomPart}`
}

function sessionKey(id: string): string {
  return `${SESSION_CONFIG.keyPrefix}${id}`
}

function sirenKey(siren: string): string {
  return `${SESSION_CONFIG.sirenIndexPrefix}${siren}`
}

// ============================================
// FONCTIONS PRINCIPALES (ASYNC)
// ============================================

/**
 * Crée une nouvelle session
 */
export async function createSession(params: {
  siren: string
  entrepriseNom: string
  secteur: string
  initialFinancialData?: Partial<FinancialContext>
}): Promise<SessionData> {
  const now = Date.now()
  const sessionId = generateSessionId()

  const session: SessionData = {
    id: sessionId,
    siren: params.siren,
    entrepriseNom: params.entrepriseNom,
    secteur: params.secteur,
    createdAt: now,
    lastActivity: now,
    expiresAt: now + SESSION_CONFIG.ttlSeconds * 1000,
    documents: [],
    conversationHistory: [],
    financialContext: {
      annees: [],
      source: 'api',
      lastUpdated: now,
      ...params.initialFinancialData,
    },
    evaluationState: {
      currentStep: 1,
      totalSteps: 6,
      completedTopics: [],
      pendingQuestions: [],
    },
  }

  const client = getRedis()

  if (client) {
    // Sauvegarder dans Redis avec TTL
    await client.setex(
      sessionKey(sessionId),
      SESSION_CONFIG.ttlSeconds,
      JSON.stringify(session)
    )
    // Index par SIREN
    await client.setex(
      sirenKey(params.siren),
      SESSION_CONFIG.ttlSeconds,
      sessionId
    )
  } else {
    // Fallback mémoire
    memoryFallback.set(sessionId, session)
    sirenIndex.set(params.siren, sessionId)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Session] Created:', {
      id: sessionId.substring(0, 12),
      siren: params.siren,
      storage: client ? 'redis' : 'memory',
    })
  }

  return session
}

/**
 * Récupère une session par ID
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const client = getRedis()

  if (client) {
    const data = await client.get<string>(sessionKey(sessionId))
    if (!data) return null

    const session: SessionData = typeof data === 'string' ? JSON.parse(data) : data

    // Prolonger le TTL à chaque accès
    session.lastActivity = Date.now()
    session.expiresAt = Date.now() + SESSION_CONFIG.ttlSeconds * 1000

    await client.setex(
      sessionKey(sessionId),
      SESSION_CONFIG.ttlSeconds,
      JSON.stringify(session)
    )

    return session
  } else {
    // Fallback mémoire
    const session = memoryFallback.get(sessionId)
    if (!session) return null

    if (Date.now() > session.expiresAt) {
      memoryFallback.delete(sessionId)
      return null
    }

    session.lastActivity = Date.now()
    session.expiresAt = Date.now() + SESSION_CONFIG.ttlSeconds * 1000
    memoryFallback.set(sessionId, session)

    return session
  }
}

/**
 * Trouve une session par SIREN
 */
export async function findSessionBySiren(siren: string): Promise<SessionData | null> {
  const client = getRedis()

  if (client) {
    const sessionId = await client.get<string>(sirenKey(siren))
    if (!sessionId) return null

    return getSession(sessionId)
  } else {
    const sessionId = sirenIndex.get(siren)
    if (!sessionId) return null

    return getSession(sessionId)
  }
}

/**
 * Met à jour une session
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Pick<SessionData, 'financialContext' | 'evaluationState'>>
): Promise<SessionData | null> {
  const session = await getSession(sessionId)
  if (!session) return null

  if (updates.financialContext) {
    session.financialContext = {
      ...session.financialContext,
      ...updates.financialContext,
      lastUpdated: Date.now(),
    }
  }

  if (updates.evaluationState) {
    session.evaluationState = {
      ...session.evaluationState,
      ...updates.evaluationState,
    }
  }

  session.lastActivity = Date.now()

  const client = getRedis()

  if (client) {
    await client.setex(
      sessionKey(sessionId),
      SESSION_CONFIG.ttlSeconds,
      JSON.stringify(session)
    )
  } else {
    memoryFallback.set(sessionId, session)
  }

  return session
}

/**
 * Ajoute un message à l'historique
 */
export async function addConversationEntry(
  sessionId: string,
  entry: Omit<ConversationEntry, 'id' | 'timestamp'>
): Promise<SessionData | null> {
  const session = await getSession(sessionId)
  if (!session) return null

  const conversationEntry: ConversationEntry = {
    ...entry,
    id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
  }

  session.conversationHistory.push(conversationEntry)

  // Limiter la taille
  if (session.conversationHistory.length > SESSION_CONFIG.maxHistoryLength) {
    const keepFirst = 5
    const keepLast = SESSION_CONFIG.maxHistoryLength - keepFirst
    session.conversationHistory = [
      ...session.conversationHistory.slice(0, keepFirst),
      ...session.conversationHistory.slice(-keepLast),
    ]
  }

  session.lastActivity = Date.now()

  const client = getRedis()

  if (client) {
    await client.setex(
      sessionKey(sessionId),
      SESSION_CONFIG.ttlSeconds,
      JSON.stringify(session)
    )
  } else {
    memoryFallback.set(sessionId, session)
  }

  return session
}

/**
 * Ajoute un document à la session
 */
export async function addDocumentToSession(
  sessionId: string,
  document: Omit<DocumentReference, 'uploadedAt' | 'status'>
): Promise<SessionData | null> {
  const session = await getSession(sessionId)
  if (!session) return null

  const docRef: DocumentReference = {
    ...document,
    uploadedAt: Date.now(),
    status: 'pending',
  }

  session.documents.push(docRef)
  session.lastActivity = Date.now()

  const client = getRedis()

  if (client) {
    await client.setex(
      sessionKey(sessionId),
      SESSION_CONFIG.ttlSeconds,
      JSON.stringify(session)
    )
  } else {
    memoryFallback.set(sessionId, session)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Session] Document added:', {
      sessionId: sessionId.substring(0, 12),
      documentId: document.id,
    })
  }

  return session
}

/**
 * Met à jour le statut d'un document après analyse
 */
export async function updateDocumentAnalysis(
  sessionId: string,
  documentId: string,
  result: {
    status: DocumentReference['status']
    analysisResult?: DocumentAnalysisResult
    financialYear?: number
    errorMessage?: string
  }
): Promise<SessionData | null> {
  const session = await getSession(sessionId)
  if (!session) return null

  const doc = session.documents.find(d => d.id === documentId)
  if (!doc) return null

  doc.status = result.status
  doc.analysisResult = result.analysisResult
  doc.financialYear = result.financialYear
  doc.errorMessage = result.errorMessage

  // Invalider le cache si analyse réussie
  if (result.status === 'analyzed') {
    const invalidated = invalidateOnDocumentUpload(session.siren)

    if (process.env.NODE_ENV === 'development') {
      console.log('[Session] Document analyzed, cache invalidated:', {
        sessionId: sessionId.substring(0, 12),
        documentId,
        cacheEntriesInvalidated: invalidated,
      })
    }

    // Mettre à jour le contexte financier
    if (result.analysisResult?.extractedData) {
      const extracted = result.analysisResult.extractedData
      session.financialContext = {
        ...session.financialContext,
        ...extracted,
        source: session.financialContext.source === 'api' ? 'mixed' : session.financialContext.source,
        lastUpdated: Date.now(),
      }

      if (result.financialYear && !session.financialContext.annees.includes(result.financialYear)) {
        session.financialContext.annees.push(result.financialYear)
        session.financialContext.annees.sort((a, b) => b - a)
        session.financialContext.anneePrincipale = session.financialContext.annees[0]
      }
    }
  }

  session.lastActivity = Date.now()

  const client = getRedis()

  if (client) {
    await client.setex(
      sessionKey(sessionId),
      SESSION_CONFIG.ttlSeconds,
      JSON.stringify(session)
    )
  } else {
    memoryFallback.set(sessionId, session)
  }

  return session
}

/**
 * Met à jour l'étape d'évaluation
 */
export async function updateEvaluationStep(
  sessionId: string,
  step: number,
  completedTopic?: string
): Promise<SessionData | null> {
  const session = await getSession(sessionId)
  if (!session) return null

  // Ne jamais régresser l'étape
  if (step > session.evaluationState.currentStep) {
    session.evaluationState.currentStep = step
  }

  if (completedTopic && !session.evaluationState.completedTopics.includes(completedTopic)) {
    session.evaluationState.completedTopics.push(completedTopic)
  }

  session.lastActivity = Date.now()

  const client = getRedis()

  if (client) {
    await client.setex(
      sessionKey(sessionId),
      SESSION_CONFIG.ttlSeconds,
      JSON.stringify(session)
    )
  } else {
    memoryFallback.set(sessionId, session)
  }

  return session
}

/**
 * Récupère le contexte pour l'API
 */
export async function getConversationContext(
  sessionId: string,
  maxMessages: number = 10
): Promise<{
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  financialContext: FinancialContext
  evaluationState: EvaluationState
  documents: Array<{ name: string; year?: number; type?: string }>
} | null> {
  const session = await getSession(sessionId)
  if (!session) return null

  const recentMessages = session.conversationHistory
    .filter(m => m.role !== 'system')
    .slice(-maxMessages)
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  const documentsSummary = session.documents
    .filter(d => d.status === 'analyzed')
    .map(d => ({
      name: d.name,
      year: d.financialYear,
      type: d.analysisResult?.documentType,
    }))

  return {
    history: recentMessages,
    financialContext: session.financialContext,
    evaluationState: session.evaluationState,
    documents: documentsSummary,
  }
}

/**
 * Supprime une session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const client = getRedis()

  if (client) {
    // Récupérer la session pour avoir le SIREN
    const session = await getSession(sessionId)
    if (session) {
      await client.del(sirenKey(session.siren))
    }
    await client.del(sessionKey(sessionId))
    return true
  } else {
    const session = memoryFallback.get(sessionId)
    if (session) {
      sirenIndex.delete(session.siren)
    }
    return memoryFallback.delete(sessionId)
  }
}

/**
 * Nettoie les sessions expirées (utile pour la mémoire locale)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  // Redis gère automatiquement l'expiration avec TTL
  // Cette fonction est surtout pour le fallback mémoire
  const now = Date.now()
  let removed = 0

  for (const [id, session] of memoryFallback.entries()) {
    if (now > session.expiresAt) {
      sirenIndex.delete(session.siren)
      memoryFallback.delete(id)
      removed++
    }
  }

  return removed
}

/**
 * Récupère les statistiques
 */
export async function getSessionStats(): Promise<{
  activeSessions: number
  storageType: 'redis' | 'memory'
  totalDocuments: number
  totalMessages: number
}> {
  const client = getRedis()

  if (client) {
    // Avec Redis, on ne peut pas facilement compter toutes les sessions
    // On retourne une estimation
    return {
      activeSessions: -1, // Indéfini avec Redis sans scan
      storageType: 'redis',
      totalDocuments: -1,
      totalMessages: -1,
    }
  } else {
    let totalDocuments = 0
    let totalMessages = 0

    for (const session of memoryFallback.values()) {
      totalDocuments += session.documents.length
      totalMessages += session.conversationHistory.length
    }

    return {
      activeSessions: memoryFallback.size,
      storageType: 'memory',
      totalDocuments,
      totalMessages,
    }
  }
}

/**
 * Liste les sessions actives (dev only)
 */
export async function listActiveSessions(): Promise<Array<{
  id: string
  siren: string
  entreprise: string
  messagesCount: number
  documentsCount: number
  currentStep: number
  ageMinutes: number
}>> {
  if (process.env.NODE_ENV !== 'development') {
    return []
  }

  const now = Date.now()
  const sessions: Array<{
    id: string
    siren: string
    entreprise: string
    messagesCount: number
    documentsCount: number
    currentStep: number
    ageMinutes: number
  }> = []

  // Seulement pour le fallback mémoire
  for (const session of memoryFallback.values()) {
    if (now <= session.expiresAt) {
      sessions.push({
        id: session.id.substring(0, 12),
        siren: session.siren,
        entreprise: session.entrepriseNom,
        messagesCount: session.conversationHistory.length,
        documentsCount: session.documents.length,
        currentStep: session.evaluationState.currentStep,
        ageMinutes: Math.round((now - session.createdAt) / 60000),
      })
    }
  }

  return sessions
}
