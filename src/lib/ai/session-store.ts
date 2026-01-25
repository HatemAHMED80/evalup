// Stockage de session côté serveur
// Maintient le contexte de conversation et les documents analysés
// Permet la persistance même si le client rafraîchit la page

import { invalidateOnDocumentUpload } from './cache'

/**
 * Types pour les documents analysés
 */
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
  financialYear?: number  // Année fiscale extraite de l'analyse
  analysisResult?: DocumentAnalysisResult
  status: 'pending' | 'analyzing' | 'analyzed' | 'error'
  errorMessage?: string
}

/**
 * Types pour l'historique de conversation
 */
export interface ConversationEntry {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  model?: string  // Modèle utilisé pour la réponse
  tokens?: {
    input: number
    output: number
  }
  metadata?: {
    step?: number
    topic?: string
    semantics?: {
      isFinancial: boolean
      complexity: number
    }
  }
}

/**
 * Contexte financier extrait des documents et réponses
 */
export interface FinancialContext {
  // Données de base
  chiffreAffaires?: number
  ebitda?: number
  resultatNet?: number
  capitauxPropres?: number
  dettesFinancieres?: number
  tresorerie?: number

  // Années disponibles
  annees: number[]
  anneePrincipale?: number

  // Ratios calculés
  ratios?: {
    margeEbitda?: number
    detteEbitda?: number
    rentabiliteCapitaux?: number
    liquiditeGenerale?: number
  }

  // Source des données
  source: 'api' | 'document' | 'user' | 'mixed'
  lastUpdated: number
}

/**
 * État de l'évaluation
 */
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

/**
 * Session complète
 */
export interface SessionData {
  id: string
  siren: string
  entrepriseNom: string
  secteur: string
  createdAt: number
  lastActivity: number
  expiresAt: number

  // Documents uploadés
  documents: DocumentReference[]

  // Historique de conversation
  conversationHistory: ConversationEntry[]

  // Contexte financier consolidé
  financialContext: FinancialContext

  // État de l'évaluation
  evaluationState: EvaluationState
}

// Configuration
const SESSION_CONFIG = {
  ttlMs: 60 * 60 * 1000,  // 1 heure
  maxHistoryLength: 100,  // Max messages dans l'historique
  cleanupIntervalMs: 5 * 60 * 1000,  // Nettoyage toutes les 5 minutes
}

// Store en mémoire (pour le serveur Next.js)
const sessionStore = new Map<string, SessionData>()

// Timer de nettoyage
let cleanupTimer: ReturnType<typeof setInterval> | null = null

/**
 * Démarre le timer de nettoyage automatique
 */
function startCleanupTimer(): void {
  if (cleanupTimer) return

  cleanupTimer = setInterval(() => {
    cleanupExpiredSessions()
  }, SESSION_CONFIG.cleanupIntervalMs)
}

/**
 * Génère un ID de session unique
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `sess_${timestamp}_${randomPart}`
}

/**
 * Crée une nouvelle session
 */
export function createSession(params: {
  siren: string
  entrepriseNom: string
  secteur: string
  initialFinancialData?: Partial<FinancialContext>
}): SessionData {
  startCleanupTimer()

  const now = Date.now()
  const sessionId = generateSessionId()

  const session: SessionData = {
    id: sessionId,
    siren: params.siren,
    entrepriseNom: params.entrepriseNom,
    secteur: params.secteur,
    createdAt: now,
    lastActivity: now,
    expiresAt: now + SESSION_CONFIG.ttlMs,

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

  sessionStore.set(sessionId, session)

  if (process.env.NODE_ENV === 'development') {
    console.log('[Session] Created:', {
      id: sessionId.substring(0, 12),
      siren: params.siren,
      entreprise: params.entrepriseNom,
    })
  }

  return session
}

/**
 * Récupère une session existante
 * Retourne null si expirée ou non trouvée
 */
export function getSession(sessionId: string): SessionData | null {
  const session = sessionStore.get(sessionId)

  if (!session) {
    return null
  }

  // Vérifier l'expiration
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(sessionId)
    return null
  }

  // Mettre à jour lastActivity et prolonger l'expiration
  session.lastActivity = Date.now()
  session.expiresAt = Date.now() + SESSION_CONFIG.ttlMs
  sessionStore.set(sessionId, session)

  return session
}

/**
 * Trouve une session par SIREN
 * Utile quand le client n'a pas l'ID de session mais a le SIREN
 */
export function findSessionBySiren(siren: string): SessionData | null {
  for (const session of sessionStore.values()) {
    if (session.siren === siren && Date.now() <= session.expiresAt) {
      // Mettre à jour l'activité
      session.lastActivity = Date.now()
      session.expiresAt = Date.now() + SESSION_CONFIG.ttlMs
      return session
    }
  }
  return null
}

/**
 * Met à jour une session
 */
export function updateSession(
  sessionId: string,
  updates: Partial<Pick<SessionData, 'financialContext' | 'evaluationState'>>
): SessionData | null {
  const session = getSession(sessionId)

  if (!session) {
    return null
  }

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
  sessionStore.set(sessionId, session)

  return session
}

/**
 * Ajoute un message à l'historique de conversation
 */
export function addConversationEntry(
  sessionId: string,
  entry: Omit<ConversationEntry, 'id' | 'timestamp'>
): SessionData | null {
  const session = getSession(sessionId)

  if (!session) {
    return null
  }

  const conversationEntry: ConversationEntry = {
    ...entry,
    id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
  }

  session.conversationHistory.push(conversationEntry)

  // Limiter la taille de l'historique
  if (session.conversationHistory.length > SESSION_CONFIG.maxHistoryLength) {
    // Garder les premiers messages (contexte initial) et les derniers
    const keepFirst = 5
    const keepLast = SESSION_CONFIG.maxHistoryLength - keepFirst
    session.conversationHistory = [
      ...session.conversationHistory.slice(0, keepFirst),
      ...session.conversationHistory.slice(-keepLast),
    ]
  }

  session.lastActivity = Date.now()
  sessionStore.set(sessionId, session)

  return session
}

/**
 * Ajoute un document à la session
 */
export function addDocumentToSession(
  sessionId: string,
  document: Omit<DocumentReference, 'uploadedAt' | 'status'>
): SessionData | null {
  const session = getSession(sessionId)

  if (!session) {
    return null
  }

  const docRef: DocumentReference = {
    ...document,
    uploadedAt: Date.now(),
    status: 'pending',
  }

  session.documents.push(docRef)
  session.lastActivity = Date.now()
  sessionStore.set(sessionId, session)

  if (process.env.NODE_ENV === 'development') {
    console.log('[Session] Document added:', {
      sessionId: sessionId.substring(0, 12),
      documentId: document.id,
      name: document.name,
    })
  }

  return session
}

/**
 * Met à jour le statut d'un document après analyse
 * Invalide automatiquement le cache si l'analyse réussit
 */
export function updateDocumentAnalysis(
  sessionId: string,
  documentId: string,
  result: {
    status: DocumentReference['status']
    analysisResult?: DocumentAnalysisResult
    financialYear?: number
    errorMessage?: string
  }
): SessionData | null {
  const session = getSession(sessionId)

  if (!session) {
    return null
  }

  const doc = session.documents.find(d => d.id === documentId)
  if (!doc) {
    return null
  }

  doc.status = result.status
  doc.analysisResult = result.analysisResult
  doc.financialYear = result.financialYear
  doc.errorMessage = result.errorMessage

  // Si l'analyse a réussi, invalider le cache pour cette entreprise
  if (result.status === 'analyzed') {
    const invalidated = invalidateOnDocumentUpload(session.siren)

    if (process.env.NODE_ENV === 'development') {
      console.log('[Session] Document analyzed, cache invalidated:', {
        sessionId: sessionId.substring(0, 12),
        documentId,
        cacheEntriesInvalidated: invalidated,
      })
    }

    // Mettre à jour le contexte financier si des données ont été extraites
    if (result.analysisResult?.extractedData) {
      const extracted = result.analysisResult.extractedData
      session.financialContext = {
        ...session.financialContext,
        ...extracted,
        source: session.financialContext.source === 'api' ? 'mixed' : session.financialContext.source,
        lastUpdated: Date.now(),
      }

      // Ajouter l'année fiscale si disponible
      if (result.financialYear && !session.financialContext.annees.includes(result.financialYear)) {
        session.financialContext.annees.push(result.financialYear)
        session.financialContext.annees.sort((a, b) => b - a)  // Plus récente d'abord
        session.financialContext.anneePrincipale = session.financialContext.annees[0]
      }
    }
  }

  session.lastActivity = Date.now()
  sessionStore.set(sessionId, session)

  return session
}

/**
 * Met à jour l'étape d'évaluation
 */
export function updateEvaluationStep(
  sessionId: string,
  step: number,
  completedTopic?: string
): SessionData | null {
  const session = getSession(sessionId)

  if (!session) {
    return null
  }

  session.evaluationState.currentStep = step

  if (completedTopic && !session.evaluationState.completedTopics.includes(completedTopic)) {
    session.evaluationState.completedTopics.push(completedTopic)
  }

  session.lastActivity = Date.now()
  sessionStore.set(sessionId, session)

  return session
}

/**
 * Récupère le contexte de conversation pour l'API
 * Retourne un résumé optimisé pour l'envoi à l'IA
 */
export function getConversationContext(
  sessionId: string,
  maxMessages: number = 10
): {
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  financialContext: FinancialContext
  evaluationState: EvaluationState
  documents: Array<{ name: string; year?: number; type?: string }>
} | null {
  const session = getSession(sessionId)

  if (!session) {
    return null
  }

  // Récupérer les derniers messages (sans les messages system)
  const recentMessages = session.conversationHistory
    .filter(m => m.role !== 'system')
    .slice(-maxMessages)
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  // Résumé des documents
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
 * Nettoie les sessions expirées
 */
export function cleanupExpiredSessions(): number {
  const now = Date.now()
  let removed = 0

  for (const [id, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(id)
      removed++
    }
  }

  if (removed > 0 && process.env.NODE_ENV === 'development') {
    console.log(`[Session] Cleaned up ${removed} expired sessions`)
  }

  return removed
}

/**
 * Supprime une session
 */
export function deleteSession(sessionId: string): boolean {
  return sessionStore.delete(sessionId)
}

/**
 * Récupère les statistiques des sessions
 */
export function getSessionStats(): {
  activeSessions: number
  totalDocuments: number
  totalMessages: number
  averageSessionAge: number
} {
  const now = Date.now()
  let totalDocuments = 0
  let totalMessages = 0
  let totalAge = 0

  for (const session of sessionStore.values()) {
    if (now <= session.expiresAt) {
      totalDocuments += session.documents.length
      totalMessages += session.conversationHistory.length
      totalAge += now - session.createdAt
    }
  }

  const activeSessions = sessionStore.size

  return {
    activeSessions,
    totalDocuments,
    totalMessages,
    averageSessionAge: activeSessions > 0 ? Math.round(totalAge / activeSessions / 1000) : 0,  // en secondes
  }
}

/**
 * Debug: liste toutes les sessions actives (dev only)
 */
export function listActiveSessions(): Array<{
  id: string
  siren: string
  entreprise: string
  messagesCount: number
  documentsCount: number
  currentStep: number
  ageMinutes: number
}> {
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

  for (const session of sessionStore.values()) {
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
