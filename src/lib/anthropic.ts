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
