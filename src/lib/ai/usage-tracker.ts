// Suivi de l'utilisation et des coûts API
// Permet d'analyser et d'optimiser les dépenses

import { estimerCout, type ModelType } from './models'

export interface UsageRecord {
  id: string
  timestamp: number
  model: ModelType
  modelId: string
  inputTokens: number
  outputTokens: number
  cost: number
  duration: number // ms
  cached: boolean
  cacheHit: boolean
  taskType: string
  evaluationId?: string
  siren?: string
  step?: number
}

export interface UsageStats {
  totalCalls: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  totalSaved: number // Économies via cache
  avgCostPerEvaluation: number
  modelBreakdown: {
    haiku: { calls: number; cost: number; tokens: number }
    sonnet: { calls: number; cost: number; tokens: number }
  }
  cacheStats: {
    hits: number
    misses: number
    hitRate: number
    costSaved: number
  }
  dailyStats: Array<{
    date: string
    calls: number
    cost: number
  }>
}

// Stockage en mémoire (pour démo, remplacer par DB en prod)
const usageRecords: UsageRecord[] = []
const MAX_RECORDS = 10000

/**
 * Enregistre un appel API
 */
export function trackUsage(record: Omit<UsageRecord, 'id'>): UsageRecord {
  const fullRecord: UsageRecord = {
    ...record,
    id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  }

  usageRecords.push(fullRecord)

  // Nettoyer les anciens enregistrements
  if (usageRecords.length > MAX_RECORDS) {
    usageRecords.splice(0, usageRecords.length - MAX_RECORDS)
  }

  // Log en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('[Usage] Enregistré:', {
      model: record.model,
      tokens: `${record.inputTokens}/${record.outputTokens}`,
      cost: `$${record.cost.toFixed(6)}`,
      cached: record.cached ? 'oui' : 'non',
      duration: `${record.duration}ms`,
    })
  }

  return fullRecord
}

/**
 * Calcule les statistiques d'utilisation
 */
export function getUsageStats(
  options: {
    startDate?: Date
    endDate?: Date
    siren?: string
    evaluationId?: string
  } = {}
): UsageStats {
  let records = usageRecords

  // Filtrer par date
  if (options.startDate) {
    records = records.filter(r => r.timestamp >= options.startDate!.getTime())
  }
  if (options.endDate) {
    records = records.filter(r => r.timestamp <= options.endDate!.getTime())
  }

  // Filtrer par SIREN
  if (options.siren) {
    records = records.filter(r => r.siren === options.siren)
  }

  // Filtrer par évaluation
  if (options.evaluationId) {
    records = records.filter(r => r.evaluationId === options.evaluationId)
  }

  // Calculer les stats
  const stats: UsageStats = {
    totalCalls: records.length,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    totalSaved: 0,
    avgCostPerEvaluation: 0,
    modelBreakdown: {
      haiku: { calls: 0, cost: 0, tokens: 0 },
      sonnet: { calls: 0, cost: 0, tokens: 0 },
    },
    cacheStats: {
      hits: 0,
      misses: 0,
      hitRate: 0,
      costSaved: 0,
    },
    dailyStats: [],
  }

  const evaluationCosts: Record<string, number> = {}
  const dailyCosts: Record<string, { calls: number; cost: number }> = {}

  for (const record of records) {
    stats.totalInputTokens += record.inputTokens
    stats.totalOutputTokens += record.outputTokens
    stats.totalCost += record.cost

    // Stats par modèle
    if (record.model === 'haiku') {
      stats.modelBreakdown.haiku.calls++
      stats.modelBreakdown.haiku.cost += record.cost
      stats.modelBreakdown.haiku.tokens += record.inputTokens + record.outputTokens
    } else {
      stats.modelBreakdown.sonnet.calls++
      stats.modelBreakdown.sonnet.cost += record.cost
      stats.modelBreakdown.sonnet.tokens += record.inputTokens + record.outputTokens
    }

    // Stats cache
    if (record.cacheHit) {
      stats.cacheStats.hits++
      // Calculer ce qu'on aurait payé sans cache
      const wouldHavePaid = estimerCout(record.model, record.inputTokens, record.outputTokens)
      stats.cacheStats.costSaved += wouldHavePaid
      stats.totalSaved += wouldHavePaid
    } else {
      stats.cacheStats.misses++
    }

    // Stats par évaluation
    if (record.evaluationId) {
      evaluationCosts[record.evaluationId] = (evaluationCosts[record.evaluationId] || 0) + record.cost
    }

    // Stats quotidiennes
    const date = new Date(record.timestamp).toISOString().split('T')[0]
    if (!dailyCosts[date]) {
      dailyCosts[date] = { calls: 0, cost: 0 }
    }
    dailyCosts[date].calls++
    dailyCosts[date].cost += record.cost
  }

  // Calculer le taux de cache
  const totalCacheChecks = stats.cacheStats.hits + stats.cacheStats.misses
  stats.cacheStats.hitRate = totalCacheChecks > 0
    ? (stats.cacheStats.hits / totalCacheChecks) * 100
    : 0

  // Calculer le coût moyen par évaluation
  const evaluationIds = Object.keys(evaluationCosts)
  stats.avgCostPerEvaluation = evaluationIds.length > 0
    ? Object.values(evaluationCosts).reduce((a, b) => a + b, 0) / evaluationIds.length
    : 0

  // Convertir les stats quotidiennes
  stats.dailyStats = Object.entries(dailyCosts)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return stats
}

/**
 * Récupère le coût d'une évaluation spécifique
 */
export function getEvaluationCost(evaluationId: string): {
  totalCost: number
  calls: number
  breakdown: Array<{ step: number; model: string; cost: number }>
} {
  const records = usageRecords.filter(r => r.evaluationId === evaluationId)

  return {
    totalCost: records.reduce((sum, r) => sum + r.cost, 0),
    calls: records.length,
    breakdown: records.map(r => ({
      step: r.step || 0,
      model: r.model,
      cost: r.cost,
    })),
  }
}

/**
 * Estime le coût d'une évaluation complète
 */
export function estimerCoutEvaluation(
  secteur: string,
  complexite: 'simple' | 'standard' | 'complexe' = 'standard'
): { min: number; max: number; moyen: number } {
  // Basé sur les stats réelles si disponibles
  const stats = getUsageStats()

  if (stats.avgCostPerEvaluation > 0) {
    // Ajuster selon la complexité
    const multiplier = complexite === 'simple' ? 0.7 : complexite === 'complexe' ? 1.3 : 1
    return {
      min: stats.avgCostPerEvaluation * multiplier * 0.8,
      max: stats.avgCostPerEvaluation * multiplier * 1.2,
      moyen: stats.avgCostPerEvaluation * multiplier,
    }
  }

  // Estimations par défaut (basées sur le modèle de pricing)
  const baseCosts = {
    simple: { min: 0.03, max: 0.06, moyen: 0.045 },
    standard: { min: 0.05, max: 0.10, moyen: 0.075 },
    complexe: { min: 0.08, max: 0.15, moyen: 0.11 },
  }

  return baseCosts[complexite]
}

/**
 * Génère un rapport d'utilisation formaté
 */
export function genererRapportUtilisation(
  options: {
    startDate?: Date
    endDate?: Date
  } = {}
): string {
  const stats = getUsageStats(options)

  const lines: string[] = [
    '# Rapport d\'utilisation API',
    '',
    '## Résumé',
    `- **Appels totaux**: ${stats.totalCalls}`,
    `- **Coût total**: $${stats.totalCost.toFixed(4)}`,
    `- **Économies (cache)**: $${stats.totalSaved.toFixed(4)}`,
    `- **Coût moyen/évaluation**: $${stats.avgCostPerEvaluation.toFixed(4)}`,
    '',
    '## Répartition par modèle',
    `### Haiku`,
    `- Appels: ${stats.modelBreakdown.haiku.calls}`,
    `- Coût: $${stats.modelBreakdown.haiku.cost.toFixed(4)}`,
    `- Tokens: ${stats.modelBreakdown.haiku.tokens.toLocaleString()}`,
    '',
    `### Sonnet`,
    `- Appels: ${stats.modelBreakdown.sonnet.calls}`,
    `- Coût: $${stats.modelBreakdown.sonnet.cost.toFixed(4)}`,
    `- Tokens: ${stats.modelBreakdown.sonnet.tokens.toLocaleString()}`,
    '',
    '## Cache',
    `- Taux de hit: ${stats.cacheStats.hitRate.toFixed(1)}%`,
    `- Hits: ${stats.cacheStats.hits}`,
    `- Misses: ${stats.cacheStats.misses}`,
    `- Économies: $${stats.cacheStats.costSaved.toFixed(4)}`,
  ]

  if (stats.dailyStats.length > 0) {
    lines.push('')
    lines.push('## Historique quotidien')
    for (const day of stats.dailyStats.slice(-7)) {
      lines.push(`- ${day.date}: ${day.calls} appels, $${day.cost.toFixed(4)}`)
    }
  }

  return lines.join('\n')
}

/**
 * Réinitialise les statistiques (pour tests)
 */
export function resetUsageStats(): void {
  usageRecords.length = 0
}

/**
 * Exporte les données pour sauvegarde externe
 */
export function exportUsageData(): UsageRecord[] {
  return [...usageRecords]
}

/**
 * Importe des données de sauvegarde
 */
export function importUsageData(records: UsageRecord[]): void {
  usageRecords.push(...records)
  // Trier par timestamp
  usageRecords.sort((a, b) => a.timestamp - b.timestamp)
  // Limiter la taille
  if (usageRecords.length > MAX_RECORDS) {
    usageRecords.splice(0, usageRecords.length - MAX_RECORDS)
  }
}
