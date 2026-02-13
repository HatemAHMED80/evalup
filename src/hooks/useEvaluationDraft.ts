'use client'

import { useCallback, useRef } from 'react'
import {
  saveDraft,
  getDraftBySiren,
  deleteDraft,
  markDraftCompleted,
  type EvaluationDraft,
} from '@/lib/evaluation-draft'
import type { ConversationContext, Message } from '@/lib/anthropic'

interface UseEvaluationDraftOptions {
  siren: string
  entrepriseNom: string
  autoSaveInterval?: number // en ms, défaut 30 secondes
}

interface UseEvaluationDraftReturn {
  // Sauvegarde manuelle
  save: (context: ConversationContext, messages: Message[], step: number) => void
  // Charger un brouillon existant
  loadDraft: () => EvaluationDraft | null
  // Marquer comme terminé
  complete: () => void
  // Supprimer le brouillon
  remove: () => void
  // Vérifier s'il existe un brouillon
  hasDraft: () => boolean
}

export function useEvaluationDraft({
  siren,
  entrepriseNom,
  autoSaveInterval: _autoSaveInterval = 30000, // 30 secondes par défaut
}: UseEvaluationDraftOptions): UseEvaluationDraftReturn {
  const lastSavedRef = useRef<string>('')

  // Fonction de sauvegarde
  const save = useCallback(
    (context: ConversationContext, messages: Message[], step: number) => {
      // Créer une signature pour détecter les changements
      const signature = JSON.stringify({ context, messages: messages.length, step })

      // Ne pas sauvegarder si rien n'a changé
      if (signature === lastSavedRef.current) return

      saveDraft({
        siren,
        entrepriseNom,
        context,
        messages,
        step,
        isCompleted: false,
      })

      lastSavedRef.current = signature
      console.log(`[EvalUp] Brouillon sauvegardé pour ${entrepriseNom} (étape ${step})`)
    },
    [siren, entrepriseNom]
  )

  // Charger un brouillon existant
  const loadDraft = useCallback(() => {
    return getDraftBySiren(siren)
  }, [siren])

  // Marquer comme terminé
  const complete = useCallback(() => {
    markDraftCompleted(siren)
    console.log(`[EvalUp] Évaluation terminée pour ${entrepriseNom}`)
  }, [siren, entrepriseNom])

  // Supprimer le brouillon
  const remove = useCallback(() => {
    deleteDraft(siren)
    lastSavedRef.current = ''
    console.log(`[EvalUp] Brouillon supprimé pour ${entrepriseNom}`)
  }, [siren, entrepriseNom])

  // Vérifier s'il existe un brouillon
  const hasDraft = useCallback(() => {
    const draft = getDraftBySiren(siren)
    return draft !== null && !draft.isCompleted
  }, [siren])

  // Sauvegarde automatique toutes les X secondes (géré par le composant parent)
  // Ce hook ne fait que fournir les fonctions

  return {
    save,
    loadDraft,
    complete,
    remove,
    hasDraft,
  }
}
