// Gestion des évaluations en localStorage

export interface SavedEvaluation {
  id: string
  siren: string
  nom: string
  secteur: string
  dateCreation: string
  lastAccess: string
  currentStep: number
}

const STORAGE_KEY = 'evalup_evaluations'

export function getEvaluations(): SavedEvaluation[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function saveEvaluation(evaluation: Omit<SavedEvaluation, 'id' | 'lastAccess'>): SavedEvaluation {
  const evaluations = getEvaluations()

  // Vérifier si l'évaluation existe déjà
  const existingIndex = evaluations.findIndex(e => e.siren === evaluation.siren)

  const now = new Date().toISOString()

  if (existingIndex !== -1) {
    // Mettre à jour l'évaluation existante
    evaluations[existingIndex] = {
      ...evaluations[existingIndex],
      ...evaluation,
      lastAccess: now,
    }
    // Déplacer en haut de la liste
    const updated = evaluations.splice(existingIndex, 1)[0]
    evaluations.unshift(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations))
    return updated
  }

  // Créer une nouvelle évaluation
  const newEvaluation: SavedEvaluation = {
    id: crypto.randomUUID(),
    ...evaluation,
    lastAccess: now,
  }

  // Ajouter au début et limiter à 20 évaluations
  evaluations.unshift(newEvaluation)
  if (evaluations.length > 20) {
    evaluations.pop()
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations))
  return newEvaluation
}

export function updateEvaluationStep(siren: string, step: number): void {
  const evaluations = getEvaluations()
  const index = evaluations.findIndex(e => e.siren === siren)

  if (index !== -1) {
    evaluations[index].currentStep = step
    evaluations[index].lastAccess = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations))
  }
}

export function deleteEvaluation(siren: string): void {
  const evaluations = getEvaluations()
  const filtered = evaluations.filter(e => e.siren !== siren)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
