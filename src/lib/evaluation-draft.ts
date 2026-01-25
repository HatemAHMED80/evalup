// Gestion des brouillons d'évaluation (sauvegarde automatique)

import type { ConversationContext, Message } from './anthropic'

export interface EvaluationDraft {
  id: string
  siren: string
  entrepriseNom: string
  context: ConversationContext
  messages: Message[]
  lastUpdated: string
  step: number
  isCompleted: boolean
}

const STORAGE_KEY = 'evalup_drafts'
const MAX_DRAFTS = 10 // Garder max 10 brouillons

/**
 * Récupère tous les brouillons sauvegardés
 */
export function getAllDrafts(): EvaluationDraft[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []

    const drafts = JSON.parse(data) as EvaluationDraft[]
    // Trier par date de modification (plus récent en premier)
    return drafts.sort((a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )
  } catch (error) {
    console.error('Erreur lecture brouillons:', error)
    return []
  }
}

/**
 * Récupère un brouillon par SIREN
 */
export function getDraftBySiren(siren: string): EvaluationDraft | null {
  const drafts = getAllDrafts()
  return drafts.find(d => d.siren === siren) || null
}

/**
 * Récupère un brouillon par ID
 */
export function getDraftById(id: string): EvaluationDraft | null {
  const drafts = getAllDrafts()
  return drafts.find(d => d.id === id) || null
}

/**
 * Sauvegarde ou met à jour un brouillon
 */
export function saveDraft(draft: Omit<EvaluationDraft, 'id' | 'lastUpdated'>): EvaluationDraft {
  if (typeof window === 'undefined') {
    return { ...draft, id: '', lastUpdated: new Date().toISOString() }
  }

  const drafts = getAllDrafts()
  const existingIndex = drafts.findIndex(d => d.siren === draft.siren)

  const now = new Date().toISOString()
  const savedDraft: EvaluationDraft = {
    ...draft,
    id: existingIndex >= 0 ? drafts[existingIndex].id : `draft_${draft.siren}_${Date.now()}`,
    lastUpdated: now,
  }

  if (existingIndex >= 0) {
    // Mettre à jour l'existant
    drafts[existingIndex] = savedDraft
  } else {
    // Ajouter nouveau
    drafts.unshift(savedDraft)

    // Limiter le nombre de brouillons
    if (drafts.length > MAX_DRAFTS) {
      drafts.pop()
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch (error) {
    console.error('Erreur sauvegarde brouillon:', error)
  }

  return savedDraft
}

/**
 * Supprime un brouillon
 */
export function deleteDraft(siren: string): void {
  if (typeof window === 'undefined') return

  const drafts = getAllDrafts()
  const filtered = drafts.filter(d => d.siren !== siren)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Erreur suppression brouillon:', error)
  }
}

/**
 * Marque un brouillon comme terminé
 */
export function markDraftCompleted(siren: string): void {
  if (typeof window === 'undefined') return

  const drafts = getAllDrafts()
  const index = drafts.findIndex(d => d.siren === siren)

  if (index >= 0) {
    drafts[index].isCompleted = true
    drafts[index].lastUpdated = new Date().toISOString()

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
    } catch (error) {
      console.error('Erreur mise à jour brouillon:', error)
    }
  }
}

/**
 * Récupère les brouillons non terminés
 */
export function getPendingDrafts(): EvaluationDraft[] {
  return getAllDrafts().filter(d => !d.isCompleted)
}

/**
 * Formate une date relative (il y a X minutes/heures/jours)
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
