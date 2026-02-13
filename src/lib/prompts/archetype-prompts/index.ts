// Index des prompts archétype
// Chaque archétype a son prompt spécifique (200-300 lignes)

import { SAAS_HYPER_PROMPT } from './saas-hyper'
import { SAAS_MATURE_PROMPT } from './saas-mature'
import { SAAS_DECLINE_PROMPT } from './saas-decline'
import { MARKETPLACE_PROMPT } from './marketplace'
import { ECOMMERCE_PROMPT } from './ecommerce'
import { CONSEIL_PROMPT } from './conseil'
import { SERVICES_RECURRENTS_PROMPT } from './services-recurrents'
import { COMMERCE_RETAIL_PROMPT } from './commerce-retail'
import { INDUSTRIE_PROMPT } from './industrie'
import { PATRIMOINE_PROMPT } from './patrimoine'
import { PATRIMOINE_DOMINANT_PROMPT } from './patrimoine-dominant'
import { DEFICIT_STRUCTUREL_PROMPT } from './deficit-structurel'
import { MASSE_SALARIALE_PROMPT } from './masse-salariale'
import { MICRO_SOLO_PROMPT } from './micro-solo'
import { PRE_REVENUE_PROMPT } from './pre-revenue'

/**
 * Map archetype ID → prompt spécifique
 */
const ARCHETYPE_PROMPTS: Record<string, string> = {
  saas_hyper: SAAS_HYPER_PROMPT,
  saas_mature: SAAS_MATURE_PROMPT,
  saas_decline: SAAS_DECLINE_PROMPT,
  marketplace: MARKETPLACE_PROMPT,
  ecommerce: ECOMMERCE_PROMPT,
  conseil: CONSEIL_PROMPT,
  services_recurrents: SERVICES_RECURRENTS_PROMPT,
  commerce_retail: COMMERCE_RETAIL_PROMPT,
  industrie: INDUSTRIE_PROMPT,
  patrimoine: PATRIMOINE_PROMPT,
  patrimoine_dominant: PATRIMOINE_DOMINANT_PROMPT,
  deficit_structurel: DEFICIT_STRUCTUREL_PROMPT,
  masse_salariale_lourde: MASSE_SALARIALE_PROMPT,
  micro_solo: MICRO_SOLO_PROMPT,
  pre_revenue: PRE_REVENUE_PROMPT,
}

export interface ArchetypePromptContext {
  archetypeId: string
  entrepriseNom?: string
  siren?: string
  codeNaf?: string
  ca?: number
  ebitda?: number
  croissance?: number
  recurrence?: number
  masseSalariale?: number
}

/**
 * Retourne le prompt spécifique pour un archétype donné.
 * Retourne une string vide si l'archétype n'a pas encore de prompt dédié.
 */
export function getPromptForArchetype(
  id: string,
  _context?: ArchetypePromptContext
): string {
  return ARCHETYPE_PROMPTS[id] || ''
}

export { ARCHETYPE_PROMPTS }
