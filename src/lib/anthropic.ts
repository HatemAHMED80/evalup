// Client Anthropic pour l'agent IA d'évaluation
import Anthropic from '@anthropic-ai/sdk'

// Client Anthropic (côté serveur uniquement)
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Types pour les messages
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  documents?: UploadedDocument[]
}

export interface UploadedDocument {
  id: string
  name: string
  type: string
  size: number
  extractedText?: string
  analysis?: DocumentAnalysis
}

export interface DocumentAnalysis {
  typeDocument?: string
  annee?: number
  chiffresExtraits?: Record<string, number>
  pointsCles?: string[]
  anomalies?: Anomalie[]
  questionsASuggerer?: string[]
  error?: string
  raw?: string
  parseError?: boolean
}

export interface Anomalie {
  type: 'alerte' | 'question' | 'info'
  categorie: string
  message: string
  severity: 'high' | 'medium' | 'low'
  valeurs?: Record<string, number | string>
}

// Type de parcours utilisateur
export type UserParcours = 'dirigeant' | 'cedant' | 'repreneur' | 'conseil'

// Contexte de conversation
export interface ConversationContext {
  entreprise: {
    siren: string
    nom: string
    secteur: string
    codeNaf: string
    dateCreation: string
    effectif: string
    adresse: string
    ville: string
  }
  financials: {
    bilans: BilanAnnuel[]
    ratios: RatiosFinanciers
    anomaliesDetectees: Anomalie[]
  }
  documents: UploadedDocument[]
  responses: Record<string, string>
  evaluationProgress: {
    step: number
    completedTopics: string[]
    pendingTopics: string[]
  }
  parcours?: UserParcours
  pedagogyLevel?: 'fort' | 'moyen' | 'expert'
  objectif?: 'vente' | 'achat' | 'associe' | 'divorce' | 'transmission' | 'conflit' | 'financement' | 'pilotage'
  objet?: 'titres_100' | 'titres_partiel' | 'fonds_commerce'
  pourcentageParts?: number
  // Évaluation complète (après paiement)
  evaluationType?: 'flash' | 'complete'
  isPaid?: boolean
  // Nouveau flow : archétype détecté par le diagnostic
  archetype?: string // ID de l'archétype (ex: 'saas_hyper', 'ecommerce', etc.)
  diagnosticData?: {
    revenue: number
    ebitda: number
    growth: number
    recurring: number
    masseSalariale: number
    effectif: string
  }
  // Données extraites des documents comptables (post-upload, validées par l'utilisateur)
  extractedDocData?: {
    exercices: ExtractedExercice[]
    metadata: {
      completeness_score: number
      missing_critical: string[]
      source_documents: string[]
    }
  }
}

export interface ExtractedExercice {
  annee: number
  ca: number | null
  resultat_exploitation: number | null
  resultat_net: number | null
  ebitda: number | null
  dotations_amortissements: number | null
  dotations_provisions: number | null
  charges_personnel: number | null
  effectif_moyen: number | null
  remuneration_dirigeant: number | null
  loyers: number | null
  credit_bail: number | null
  capitaux_propres: number | null
  dettes_financieres: number | null
  tresorerie: number | null
  total_actif: number | null
  actif_immobilise: number | null
  stocks: number | null
  creances_clients: number | null
  dettes_fournisseurs: number | null
}

export interface BilanAnnuel {
  annee: number
  chiffre_affaires: number
  resultat_net: number
  resultat_exploitation: number
  dotations_amortissements: number
  stocks: number
  creances_clients: number
  tresorerie: number
  capitaux_propres: number
  dettes_financieres: number
  dettes_fournisseurs: number
  provisions: number
  immobilisations_corporelles?: number
}

export interface RatiosFinanciers {
  margeNette: number
  margeEbitda: number
  ebitda: number
  dso: number
  ratioEndettement: number
}

// Fonction utilitaire pour vérifier la config
export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

/**
 * Crée un message avec fallback automatique si le modèle n'est pas disponible
 * Essaie les modèles dans l'ordre jusqu'à ce qu'un fonctionne
 */
export async function createMessageWithFallback(
  params: Anthropic.MessageCreateParamsNonStreaming,
  fallbacks: string[]
): Promise<Anthropic.Message> {
  const modelsToTry = [params.model, ...fallbacks.filter(f => f !== params.model)]
  let lastError: Error | null = null

  for (const modelId of modelsToTry) {
    try {
      console.log(`[Anthropic] Essai avec modèle: ${modelId}`)
      const response = await anthropic.messages.create({
        ...params,
        model: modelId,
      })
      return response
    } catch (error: unknown) {
      lastError = error as Error
      const status = (error as { status?: number }).status

      // Si c'est une erreur 404 (modèle non trouvé), essayer le suivant
      if (status === 404) {
        console.warn(`[Anthropic] Modèle ${modelId} non disponible, essai du suivant...`)
        continue
      }

      // Pour les autres erreurs (rate limit, auth, etc.), ne pas réessayer
      throw error
    }
  }

  // Si tous les modèles ont échoué
  throw lastError || new Error('Tous les modèles ont échoué')
}

/**
 * Crée un stream avec fallback automatique si le modèle n'est pas disponible
 */
export async function createStreamWithFallback(
  params: Anthropic.MessageCreateParamsStreaming,
  fallbacks: string[]
): Promise<AsyncIterable<Anthropic.MessageStreamEvent>> {
  const modelsToTry = [params.model, ...fallbacks.filter(f => f !== params.model)]
  let lastError: Error | null = null

  for (const modelId of modelsToTry) {
    try {
      console.log(`[Anthropic] Stream avec modèle: ${modelId}`)
      const stream = await anthropic.messages.create({
        ...params,
        model: modelId,
        stream: true,
      })
      return stream
    } catch (error: unknown) {
      lastError = error as Error
      const status = (error as { status?: number }).status

      // Si c'est une erreur 404 (modèle non trouvé), essayer le suivant
      if (status === 404) {
        console.warn(`[Anthropic] Modèle ${modelId} non disponible, essai du suivant...`)
        continue
      }

      // Pour les autres erreurs, ne pas réessayer
      throw error
    }
  }

  throw lastError || new Error('Tous les modèles ont échoué')
}
