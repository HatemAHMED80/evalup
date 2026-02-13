// Exports du module PDF EvalUp

// Générateur PDF professionnel (25-40 pages)
export { generateProfessionalPDF, generateProfessionalPDFBuffer, ProfessionalReport } from './professional-report-final'
export type { ProfessionalReportData } from './professional-report'

// Utilitaires
export { formatCurrency, formatPercent, formatNumber, cleanText, formatVariation, calculateVariation } from './utils'

// Styles et couleurs
export { COLORS, FONTS, SPACING, BORDERS, getStatusColor, getValueColor } from './styles'

// Benchmarks sectoriels
export { BENCHMARKS, compareWithBenchmark, getSectorFromNaf, getBenchmarkForNaf } from './sector-benchmarks'
export type { SectorBenchmarks } from './sector-benchmarks'
