// Fonctions utilitaires prompts — detection secteur + re-exports

import { detecterSecteurEvaluation, SECTEURS } from '../evaluation/secteurs'
import { EVALUATION_FINALE_PROMPT } from './modules/evaluation-finale'

/**
 * Détecte le secteur depuis un code NAF.
 * Délègue à detecterSecteurEvaluation (15 secteurs) et retourne le code string.
 */
export function detecterSecteur(codeNaf: string | undefined): string {
  if (!codeNaf) return 'default'
  return detecterSecteurEvaluation(codeNaf).code
}

/**
 * Retourne le nom lisible d'un secteur à partir de son code.
 */
export function getNomSecteur(secteurCode: string): string {
  if (!secteurCode || secteurCode === 'default') return 'Activité générale'
  const config = SECTEURS.find(s => s.code === secteurCode)
  return config?.nom || 'Activité générale'
}

export { EVALUATION_FINALE_PROMPT }
