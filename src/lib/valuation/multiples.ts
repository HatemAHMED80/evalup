// Chargement et application des multiples de valorisation par archétype
// Source : /data/multiples.json (Damodaran NYU Stern, janvier 2026)

import { readFileSync } from 'fs'
import { join } from 'path'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface MultipleRange {
  metric: string
  low: number
  median: number
  high: number
}

export interface ArchetypeMultiples {
  primaryMultiple: MultipleRange
  secondaryMultiple: MultipleRange
  damodaranSector: string
  source: string
}

export interface MultiplesData {
  source: string
  sourceUrl: string
  lastUpdated: string
  note: string
  archetypes: Record<string, ArchetypeMultiples>
}

// -----------------------------------------------------------------------------
// Loader
// -----------------------------------------------------------------------------

let _cache: MultiplesData | null = null

/**
 * Charge les multiples depuis /data/multiples.json.
 * Le résultat est mis en cache en mémoire après le premier appel.
 */
export function loadMultiples(): MultiplesData {
  if (_cache) return _cache

  const filePath = join(process.cwd(), 'data', 'multiples.json')
  try {
    const raw = readFileSync(filePath, 'utf-8')
    _cache = JSON.parse(raw) as MultiplesData
  } catch (error) {
    throw new Error(
      `Impossible de charger ${filePath}. Verifiez que data/multiples.json existe. ` +
      (error instanceof Error ? error.message : String(error))
    )
  }
  return _cache
}

/**
 * Retourne les multiples pour un archétype donné.
 * Retourne undefined si l'archétype n'existe pas dans le fichier.
 */
export function getMultiplesForArchetype(archetypeId: string): ArchetypeMultiples | undefined {
  const data = loadMultiples()
  return data.archetypes[archetypeId]
}

// -----------------------------------------------------------------------------
// Décote France
// -----------------------------------------------------------------------------

/**
 * Applique la décote France aux multiples US Damodaran.
 * Par défaut -25% (fourchette recommandée : -20% à -30%).
 *
 * @param multiple — Le multiple US brut
 * @param discount — La décote à appliquer (0.25 = -25%)
 * @returns Le multiple ajusté pour le marché français
 */
export function applyFranceDiscount(multiple: number, discount: number = 0.25): number {
  return multiple * (1 - discount)
}
