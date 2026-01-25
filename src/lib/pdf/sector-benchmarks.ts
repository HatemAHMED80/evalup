// Données de comparaison secteur pour les rapports PDF

export interface SectorBenchmarks {
  nom: string
  margeNette: { min: number; median: number; max: number }
  margeEbitda: { min: number; median: number; max: number }
  croissanceCA: { min: number; median: number; max: number }
  dso: { min: number; median: number; max: number }
  multipleCA: { min: number; max: number }
  multipleEbitda: { min: number; max: number }
}

export const BENCHMARKS: Record<string, SectorBenchmarks> = {
  transport: {
    nom: 'Transport Routier',
    margeNette: { min: 0.01, median: 0.03, max: 0.06 },
    margeEbitda: { min: 0.04, median: 0.07, max: 0.12 },
    croissanceCA: { min: -0.05, median: 0.03, max: 0.10 },
    dso: { min: 30, median: 50, max: 75 },
    multipleCA: { min: 0.3, max: 0.6 },
    multipleEbitda: { min: 3, max: 5 },
  },
  saas: {
    nom: 'SaaS / Tech',
    margeNette: { min: -0.20, median: 0.05, max: 0.25 },
    margeEbitda: { min: -0.10, median: 0.15, max: 0.35 },
    croissanceCA: { min: 0.10, median: 0.30, max: 0.80 },
    dso: { min: 15, median: 30, max: 50 },
    multipleCA: { min: 2, max: 15 },
    multipleEbitda: { min: 8, max: 15 },
  },
  restaurant: {
    nom: 'Restauration',
    margeNette: { min: 0.01, median: 0.04, max: 0.08 },
    margeEbitda: { min: 0.05, median: 0.10, max: 0.18 },
    croissanceCA: { min: -0.05, median: 0.02, max: 0.08 },
    dso: { min: 0, median: 5, max: 15 },
    multipleCA: { min: 0.3, max: 0.8 },
    multipleEbitda: { min: 2, max: 4 },
  },
  commerce: {
    nom: 'Commerce / Retail',
    margeNette: { min: 0.01, median: 0.03, max: 0.05 },
    margeEbitda: { min: 0.03, median: 0.07, max: 0.10 },
    croissanceCA: { min: -0.03, median: 0.02, max: 0.08 },
    dso: { min: 0, median: 15, max: 30 },
    multipleCA: { min: 0.3, max: 0.7 },
    multipleEbitda: { min: 3, max: 5 },
  },
  services: {
    nom: 'Services / Conseil',
    margeNette: { min: 0.05, median: 0.10, max: 0.15 },
    margeEbitda: { min: 0.10, median: 0.18, max: 0.25 },
    croissanceCA: { min: 0.00, median: 0.05, max: 0.15 },
    dso: { min: 30, median: 45, max: 60 },
    multipleCA: { min: 0.5, max: 1.2 },
    multipleEbitda: { min: 4, max: 7 },
  },
  industrie: {
    nom: 'Industrie / Production',
    margeNette: { min: 0.02, median: 0.05, max: 0.08 },
    margeEbitda: { min: 0.06, median: 0.10, max: 0.15 },
    croissanceCA: { min: -0.03, median: 0.03, max: 0.10 },
    dso: { min: 40, median: 55, max: 75 },
    multipleCA: { min: 0.4, max: 0.8 },
    multipleEbitda: { min: 4, max: 6 },
  },
  btp: {
    nom: 'BTP / Construction',
    margeNette: { min: 0.01, median: 0.03, max: 0.05 },
    margeEbitda: { min: 0.04, median: 0.08, max: 0.12 },
    croissanceCA: { min: -0.05, median: 0.03, max: 0.12 },
    dso: { min: 45, median: 60, max: 90 },
    multipleCA: { min: 0.2, max: 0.5 },
    multipleEbitda: { min: 3, max: 5 },
  },
  immobilier: {
    nom: 'Immobilier',
    margeNette: { min: 0.05, median: 0.12, max: 0.20 },
    margeEbitda: { min: 0.15, median: 0.25, max: 0.40 },
    croissanceCA: { min: -0.05, median: 0.05, max: 0.15 },
    dso: { min: 15, median: 30, max: 45 },
    multipleCA: { min: 0.8, max: 1.5 },
    multipleEbitda: { min: 6, max: 10 },
  },
  default: {
    nom: 'Tous secteurs',
    margeNette: { min: 0.02, median: 0.05, max: 0.10 },
    margeEbitda: { min: 0.05, median: 0.10, max: 0.18 },
    croissanceCA: { min: -0.03, median: 0.03, max: 0.10 },
    dso: { min: 20, median: 45, max: 70 },
    multipleCA: { min: 0.4, max: 1.0 },
    multipleEbitda: { min: 4, max: 7 },
  },
}

/**
 * Compare une valeur avec le benchmark du secteur
 * Retourne 'good', 'average', 'bad'
 */
export function compareWithBenchmark(
  value: number,
  benchmark: { min: number; median: number; max: number },
  higherIsBetter: boolean = true
): 'good' | 'average' | 'bad' {
  if (higherIsBetter) {
    if (value >= benchmark.max * 0.8) return 'good'
    if (value >= benchmark.median) return 'average'
    return 'bad'
  } else {
    if (value <= benchmark.min * 1.2) return 'good'
    if (value <= benchmark.median) return 'average'
    return 'bad'
  }
}

/**
 * Détermine le secteur à partir du code NAF
 */
export function getSectorFromNaf(codeNaf: string): string {
  if (!codeNaf) return 'default'

  const code = codeNaf.substring(0, 2)

  const mapping: Record<string, string> = {
    '10': 'industrie', '11': 'industrie', '12': 'industrie',
    '13': 'industrie', '14': 'industrie', '15': 'industrie',
    '16': 'industrie', '17': 'industrie', '18': 'industrie',
    '19': 'industrie', '20': 'industrie', '21': 'industrie',
    '22': 'industrie', '23': 'industrie', '24': 'industrie',
    '25': 'industrie', '26': 'industrie', '27': 'industrie',
    '28': 'industrie', '29': 'industrie', '30': 'industrie',
    '31': 'industrie', '32': 'industrie', '33': 'industrie',
    '41': 'btp', '42': 'btp', '43': 'btp',
    '45': 'commerce', '46': 'commerce', '47': 'commerce',
    '49': 'transport', '50': 'transport', '51': 'transport', '52': 'transport', '53': 'transport',
    '55': 'restaurant', '56': 'restaurant',
    '62': 'saas', '63': 'saas',
    '68': 'immobilier',
    '69': 'services', '70': 'services', '71': 'services',
    '72': 'services', '73': 'services', '74': 'services',
    '77': 'services', '78': 'services', '79': 'services',
    '80': 'services', '81': 'services', '82': 'services',
  }

  return mapping[code] || 'default'
}

/**
 * Obtient le benchmark pour un code NAF
 */
export function getBenchmarkForNaf(codeNaf: string): SectorBenchmarks {
  const sector = getSectorFromNaf(codeNaf)
  return BENCHMARKS[sector] || BENCHMARKS.default
}
