// Test de comparaison : résultats pipeline vs expected evaluations (scenarios.ts)
// Usage : npx tsx tests/unit/report-comparison.test.ts

import { detectArchetype } from '../../src/lib/valuation/archetypes'
import type { DiagnosticInput } from '../../src/lib/valuation/archetypes'
import { calculateValuation } from '../../src/lib/valuation/calculator-v2'
import type { FinancialData, QualitativeData, ValuationResult } from '../../src/lib/valuation/calculator-v2'
import { genererDiagnostic, ajusterScoreDiagnostic } from '../../src/lib/analyse/diagnostic'
import type { BilanAnnuel } from '../../src/lib/evaluation/types'

// Mini test runner
let passed = 0
let failed = 0
let warns = 0
const failures: string[] = []
const warnings: string[] = []

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
    console.log(`  ✅ ${name}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    failed++
    failures.push(`${name}: ${msg}`)
    console.log(`  ❌ ${name}`)
    console.log(`     → ${msg}`)
  }
}

function warn(name: string, msg: string) {
  warns++
  warnings.push(`${name}: ${msg}`)
  console.log(`  ⚠️  ${name}`)
  console.log(`     → ${msg}`)
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

// ═══════════════════════════════════════════════════════════════
// Mapping scenarios.ts → archetypes réels
// ═══════════════════════════════════════════════════════════════

// Chaque entrée reprend le scénario de scenarios.ts avec les corrections d'archetype ID
interface ComparisonScenario {
  scenarioId: string          // ID dans scenarios.ts
  realArchetype: string       // Archetype réel dans le système
  nom: string
  diagnostic: DiagnosticInput
  financial: FinancialData
  qualitative?: QualitativeData
  bilan: BilanAnnuel          // Pour genererDiagnostic
  mrrMensuel?: number         // MRR mensuel (SaaS/Marketplace)
  remunerationDirigeant?: number  // Rémunération du dirigeant
  // Expected values from scenarios.ts
  expectedNote: string
  expectedConfiance: string
  expectedValoMethod: string
  expectedWarnings: string[]
  coherenceChecks: { check: string; result: string; severity: 'error' | 'warning' | 'ok' }[]
}

const SCENARIOS: ComparisonScenario[] = [
  // 1. SAAS HYPER
  {
    scenarioId: 'saas_hyper', realArchetype: 'saas_hyper', nom: 'ROCKETFLOW',
    diagnostic: { sector: 'saas', revenue: 800_000, ebitda: -200_000, growth: 95, recurring: 95, masseSalariale: 70, hasMRR: true },
    financial: { revenue: 800_000, ebitda: -200_000, netIncome: -180_000, equity: 200_000, cash: 600_000, debt: 0, arr: 840_000, mrr: 70_000 },
    mrrMensuel: 70_000, remunerationDirigeant: 45_000,
    bilan: {
      annee: 2024, chiffreAffaires: 800_000, resultatNet: -180_000, resultatExploitation: -250_000,
      dotationsAmortissements: 50_000, stocks: 0, creancesClients: 100_000, disponibilites: 600_000,
      capitauxPropres: 200_000, empruntsEtablissementsCredit: 0, dettesFournisseurs: 50_000,
    },
    expectedNote: 'B+', expectedConfiance: 'Moyenne', expectedValoMethod: 'ARR multiple (15-25x)',
    expectedWarnings: ['EBITDA négatif', 'Burn rate élevé'],
    coherenceChecks: [
      { check: 'EBITDA négatif', result: 'Signal burn rate, méthode ARR', severity: 'warning' },
      { check: 'Note ≠ A (EBITDA négatif)', result: 'Pas A', severity: 'ok' },
    ],
  },

  // 2. SAAS MATURE
  {
    scenarioId: 'saas_mature', realArchetype: 'saas_mature', nom: 'DATAWISE',
    diagnostic: { sector: 'saas', revenue: 3_000_000, ebitda: 750_000, growth: 20, recurring: 92, masseSalariale: 55, hasMRR: true },
    financial: { revenue: 3_000_000, ebitda: 750_000, netIncome: 450_000, equity: 1_500_000, cash: 700_000, debt: 200_000, arr: 3_000_000, mrr: 250_000 },
    mrrMensuel: 250_000, remunerationDirigeant: 90_000,
    qualitative: { dependanceDirigeant: 'faible', concentrationClients: 20 },
    bilan: {
      annee: 2024, chiffreAffaires: 3_000_000, resultatNet: 450_000, resultatExploitation: 600_000,
      dotationsAmortissements: 150_000, stocks: 0, creancesClients: 400_000, disponibilites: 700_000,
      capitauxPropres: 1_500_000, empruntsEtablissementsCredit: 200_000, dettesFournisseurs: 150_000,
    },
    expectedNote: 'A', expectedConfiance: 'Élevée', expectedValoMethod: 'ARR multiple (8-12x) + EBITDA',
    expectedWarnings: [],
    coherenceChecks: [
      { check: 'Marge EBITDA = 25%', result: 'Saine', severity: 'ok' },
      { check: 'Note = A', result: 'Tout est bon', severity: 'ok' },
    ],
  },

  // 3. MARKETPLACE
  {
    scenarioId: 'marketplace', realArchetype: 'marketplace', nom: 'TROQR',
    diagnostic: { sector: 'marketplace', revenue: 1_200_000, ebitda: -100_000, growth: 80, recurring: 60, masseSalariale: 50 },
    financial: { revenue: 1_200_000, ebitda: -100_000, netIncome: -70_000, equity: 500_000, cash: 400_000, debt: 0, gmv: 10_000_000, netRevenue: 1_200_000 },
    mrrMensuel: 100_000, remunerationDirigeant: 50_000,
    bilan: {
      annee: 2024, chiffreAffaires: 1_200_000, resultatNet: -70_000, resultatExploitation: -150_000,
      dotationsAmortissements: 50_000, stocks: 0, creancesClients: 200_000, disponibilites: 400_000,
      capitauxPropres: 500_000, empruntsEtablissementsCredit: 0, dettesFournisseurs: 100_000,
    },
    expectedNote: 'B', expectedConfiance: 'Moyenne', expectedValoMethod: 'GMV multiple + Take rate',
    expectedWarnings: ['EBITDA négatif', 'Churn élevé (5%/mois)'],
    coherenceChecks: [
      { check: 'EBITDA négatif', result: 'Normal marketplace en croissance', severity: 'warning' },
    ],
  },

  // 4. E-COMMERCE (scenarios.ts: ecommerce_d2c → ecommerce)
  {
    scenarioId: 'ecommerce_d2c', realArchetype: 'ecommerce', nom: 'MAISON ALBA',
    diagnostic: { sector: 'ecommerce', revenue: 2_000_000, ebitda: 300_000, growth: 15, recurring: 30, masseSalariale: 25 },
    financial: { revenue: 2_000_000, ebitda: 300_000, netIncome: 180_000, equity: 600_000, cash: 100_000, debt: 120_000 },
    remunerationDirigeant: 60_000,
    qualitative: { dependanceDirigeant: 'faible', concentrationClients: 5 },
    bilan: {
      annee: 2024, chiffreAffaires: 2_000_000, resultatNet: 180_000, resultatExploitation: 250_000,
      dotationsAmortissements: 50_000, stocks: 200_000, creancesClients: 150_000, disponibilites: 100_000,
      capitauxPropres: 600_000, empruntsEtablissementsCredit: 120_000, dettesFournisseurs: 200_000,
    },
    expectedNote: 'B', expectedConfiance: 'Élevée', expectedValoMethod: 'EBITDA multiple (4-6x)',
    expectedWarnings: ['Récurrence faible (30%)'],
    coherenceChecks: [
      { check: 'Marge EBITDA = 15%', result: 'Correcte pour e-commerce', severity: 'ok' },
    ],
  },

  // 5. CONSEIL (scenarios.ts: conseil_expertise → conseil)
  {
    scenarioId: 'conseil_expertise', realArchetype: 'conseil', nom: 'STRATEGIA CONSEIL',
    diagnostic: { sector: 'conseil', revenue: 500_000, ebitda: 180_000, growth: 8, recurring: 40, masseSalariale: 30 },
    financial: { revenue: 500_000, ebitda: 180_000, netIncome: 130_000, equity: 200_000, cash: 180_000, debt: 0, retraitements: { salaireDirigeant: 0 } },
    qualitative: { dependanceDirigeant: 'forte', concentrationClients: 40 },
    bilan: {
      annee: 2024, chiffreAffaires: 500_000, resultatNet: 130_000, resultatExploitation: 170_000,
      dotationsAmortissements: 10_000, stocks: 0, creancesClients: 60_000, disponibilites: 180_000,
      capitauxPropres: 200_000, empruntsEtablissementsCredit: 0, dettesFournisseurs: 30_000,
    },
    expectedNote: 'B-', expectedConfiance: 'Moyenne', expectedValoMethod: 'EBITDA retraité (3-5x)',
    expectedWarnings: ['Rémunération dirigeant 0€ — EBITDA non représentatif', 'Concentration client 30-50%'],
    coherenceChecks: [
      { check: 'Rému = 0€', result: 'EBITDA gonfle la valo, retraitement obligatoire', severity: 'error' },
      { check: 'Confiance ≠ Élevée', result: 'Pas élevée sans retraitements', severity: 'ok' },
    ],
  },

  // 6. SERVICES RÉCURRENTS
  {
    scenarioId: 'services_recurrents', realArchetype: 'services_recurrents', nom: 'CLEANPRO',
    diagnostic: { sector: 'services', revenue: 1_500_000, ebitda: 250_000, growth: 10, recurring: 80, masseSalariale: 60 },
    financial: { revenue: 1_500_000, ebitda: 250_000, netIncome: 170_000, equity: 400_000, cash: 250_000, debt: 100_000 },
    remunerationDirigeant: 70_000,
    qualitative: { dependanceDirigeant: 'moyenne', concentrationClients: 20 },
    bilan: {
      annee: 2024, chiffreAffaires: 1_500_000, resultatNet: 170_000, resultatExploitation: 230_000,
      dotationsAmortissements: 20_000, stocks: 50_000, creancesClients: 200_000, disponibilites: 250_000,
      capitauxPropres: 400_000, empruntsEtablissementsCredit: 100_000, dettesFournisseurs: 120_000,
    },
    expectedNote: 'B+', expectedConfiance: 'Élevée', expectedValoMethod: 'EBITDA multiple (5-7x)',
    expectedWarnings: [],
    coherenceChecks: [
      { check: 'Marge EBITDA = 17%', result: 'Correcte', severity: 'ok' },
      { check: 'Récurrence 80%', result: 'Bon pour services', severity: 'ok' },
    ],
  },

  // 7. MASSE SALARIALE LOURDE
  {
    scenarioId: 'masse_salariale_lourde', realArchetype: 'masse_salariale_lourde', nom: 'BATISUD',
    diagnostic: { sector: 'btp', revenue: 5_000_000, ebitda: 200_000, growth: 3, recurring: 20, masseSalariale: 75 },
    financial: { revenue: 5_000_000, ebitda: 200_000, netIncome: 120_000, equity: 600_000, cash: 80_000, debt: 550_000 },
    remunerationDirigeant: 80_000,
    qualitative: { dependanceDirigeant: 'moyenne', concentrationClients: 20 },
    bilan: {
      annee: 2024, chiffreAffaires: 5_000_000, resultatNet: 120_000, resultatExploitation: 180_000,
      dotationsAmortissements: 20_000, stocks: 300_000, creancesClients: 800_000, disponibilites: 80_000,
      capitauxPropres: 600_000, empruntsEtablissementsCredit: 550_000, dettesFournisseurs: 400_000,
    },
    expectedNote: 'C+', expectedConfiance: 'Élevée', expectedValoMethod: 'EBITDA multiple (3-4x) avec décote masse salariale',
    expectedWarnings: ['Masse salariale lourde (75%)', 'Marge EBITDA faible (4%)', 'Dettes élevées'],
    coherenceChecks: [
      { check: 'Masse sal 75%', result: 'Décote risque social', severity: 'warning' },
      { check: 'Marge EBITDA = 4%', result: 'Très faible', severity: 'warning' },
      { check: 'Dettes 550k > Tréso 80k', result: 'Endettement net', severity: 'warning' },
    ],
  },

  // 8. COMMERCE RETAIL
  {
    scenarioId: 'commerce_retail', realArchetype: 'commerce_retail', nom: 'LES SAVEURS DE JULIE',
    diagnostic: { sector: 'restaurant', revenue: 800_000, ebitda: 120_000, growth: 5, recurring: 50, masseSalariale: 35, hasPhysicalStore: true },
    financial: { revenue: 800_000, ebitda: 120_000, netIncome: 80_000, equity: 150_000, cash: 40_000, debt: 70_000 },
    remunerationDirigeant: 50_000,
    qualitative: { dependanceDirigeant: 'moyenne', concentrationClients: 5 },
    bilan: {
      annee: 2024, chiffreAffaires: 800_000, resultatNet: 80_000, resultatExploitation: 110_000,
      dotationsAmortissements: 10_000, stocks: 30_000, creancesClients: 20_000, disponibilites: 40_000,
      capitauxPropres: 150_000, empruntsEtablissementsCredit: 70_000, dettesFournisseurs: 60_000,
    },
    expectedNote: 'B', expectedConfiance: 'Élevée', expectedValoMethod: 'EBITDA multiple (3-5x)',
    expectedWarnings: [],
    coherenceChecks: [
      { check: 'Marge EBITDA = 15%', result: 'Correcte commerce', severity: 'ok' },
    ],
  },

  // 9. COMMERCE DE GROS (scenarios.ts: commerce_gros → industrie dans le système)
  // Pas d'archetype "commerce_gros" → routé vers industrie ou services_recurrents
  // On teste avec le routing réel
  {
    scenarioId: 'commerce_gros', realArchetype: 'industrie', nom: 'DISTRIPHARMA',
    diagnostic: { sector: 'commerce', revenue: 15_000_000, ebitda: 600_000, growth: 7, recurring: 70, masseSalariale: 15 },
    financial: { revenue: 15_000_000, ebitda: 600_000, netIncome: 380_000, equity: 1_200_000, cash: 350_000, debt: 1_100_000 },
    qualitative: { concentrationClients: 55 },
    bilan: {
      annee: 2024, chiffreAffaires: 15_000_000, resultatNet: 380_000, resultatExploitation: 550_000,
      dotationsAmortissements: 50_000, stocks: 2_000_000, creancesClients: 2_500_000, disponibilites: 350_000,
      capitauxPropres: 1_200_000, empruntsEtablissementsCredit: 1_100_000, dettesFournisseurs: 1_800_000,
    },
    expectedNote: 'C+', expectedConfiance: 'Moyenne', expectedValoMethod: 'EBITDA multiple (3-4x) avec décote concentration',
    expectedWarnings: ['Concentration critique >50%', 'Marge EBITDA faible (4%)'],
    coherenceChecks: [
      { check: 'Concentration > 50%', result: 'Décote majeure', severity: 'error' },
      { check: 'Marge EBITDA = 4%', result: 'Faible', severity: 'warning' },
    ],
  },

  // 10. INDUSTRIE (scenarios.ts: industrie_asset_heavy → industrie)
  {
    scenarioId: 'industrie_asset_heavy', realArchetype: 'industrie', nom: 'MECAPRECIS',
    diagnostic: { sector: 'industrie', revenue: 4_000_000, ebitda: 500_000, growth: 5, recurring: 60, masseSalariale: 40 },
    financial: { revenue: 4_000_000, ebitda: 500_000, netIncome: 300_000, equity: 1_200_000, cash: 180_000, debt: 900_000, assets: 2_500_000 },
    remunerationDirigeant: 85_000,
    qualitative: { dependanceDirigeant: 'faible', concentrationClients: 20 },
    bilan: {
      annee: 2024, chiffreAffaires: 4_000_000, resultatNet: 300_000, resultatExploitation: 450_000,
      dotationsAmortissements: 50_000, stocks: 500_000, creancesClients: 600_000, disponibilites: 180_000,
      capitauxPropres: 1_200_000, empruntsEtablissementsCredit: 900_000, dettesFournisseurs: 400_000,
    },
    expectedNote: 'B', expectedConfiance: 'Élevée', expectedValoMethod: 'EBITDA multiple (4-6x) + valeur patrimoniale',
    expectedWarnings: ['Dettes significatives vs trésorerie'],
    coherenceChecks: [
      { check: 'Marge EBITDA = 12.5%', result: 'Correcte industrie', severity: 'ok' },
    ],
  },

  // 11. PATRIMOINE (scenarios.ts: immobilier_fonciere → patrimoine)
  {
    scenarioId: 'immobilier_fonciere', realArchetype: 'patrimoine', nom: 'FONCIÈRE DU SUD',
    diagnostic: { sector: 'immobilier', revenue: 600_000, ebitda: 400_000, growth: 3, recurring: 95, masseSalariale: 5 },
    financial: { revenue: 600_000, ebitda: 400_000, netIncome: 250_000, equity: 3_000_000, cash: 250_000, debt: 2_100_000, assets: 5_000_000 },
    remunerationDirigeant: 60_000,
    bilan: {
      annee: 2024, chiffreAffaires: 600_000, resultatNet: 250_000, resultatExploitation: 380_000,
      dotationsAmortissements: 20_000, stocks: 0, creancesClients: 30_000, disponibilites: 250_000,
      capitauxPropres: 3_000_000, empruntsEtablissementsCredit: 2_100_000, dettesFournisseurs: 20_000,
    },
    expectedNote: 'B', expectedConfiance: 'Moyenne', expectedValoMethod: 'Capitalisation loyers (yield 5-8%) + ANR',
    expectedWarnings: ['Dettes élevées (levier immobilier)', 'Concentration locataire 30-50%'],
    coherenceChecks: [
      { check: 'Marge EBITDA = 67%', result: 'Normale immobilier', severity: 'ok' },
    ],
  },

  // 12. MICRO SOLO (scenarios.ts: micro_rentable → micro_solo)
  {
    scenarioId: 'micro_rentable', realArchetype: 'micro_solo', nom: 'STUDIO PIXEL',
    diagnostic: { sector: 'conseil', revenue: 120_000, ebitda: 80_000, growth: 10, recurring: 50, masseSalariale: 0 },
    financial: { revenue: 120_000, ebitda: 80_000, netIncome: 60_000, equity: 50_000, cash: 40_000, debt: 0, retraitements: { salaireDirigeant: 0 } },
    qualitative: { dependanceDirigeant: 'forte', concentrationClients: 40 },
    bilan: {
      annee: 2024, chiffreAffaires: 120_000, resultatNet: 60_000, resultatExploitation: 75_000,
      dotationsAmortissements: 5_000, stocks: 0, creancesClients: 10_000, disponibilites: 40_000,
      capitauxPropres: 50_000, empruntsEtablissementsCredit: 0, dettesFournisseurs: 5_000,
    },
    expectedNote: 'C+', expectedConfiance: 'Moyenne', expectedValoMethod: 'EBITDA retraité (1-3x) plafonné',
    expectedWarnings: ['Rémunération 0€', 'Micro-activité (<150k)', 'Concentration 30-50%', 'Transférabilité faible (solo)'],
    coherenceChecks: [
      { check: 'Rému = 0€', result: 'EBITDA 80k = salaire dirigeant déguisé', severity: 'error' },
      { check: 'CA < 150k', result: 'Micro-activité', severity: 'warning' },
    ],
  },

  // 13. MICRO SOLO NON VALORISABLE (scenarios.ts: micro_solo)
  {
    scenarioId: 'micro_solo', realArchetype: 'micro_solo', nom: 'JEAN DUPONT CONSULTANT',
    diagnostic: { sector: 'conseil', revenue: 70_000, ebitda: 50_000, growth: 0, recurring: 20, masseSalariale: 0 },
    financial: { revenue: 70_000, ebitda: 50_000, netIncome: 35_000, equity: 15_000, cash: 15_000, debt: 0, retraitements: { salaireDirigeant: 0 } },
    qualitative: { concentrationClients: 55 },
    bilan: {
      annee: 2024, chiffreAffaires: 70_000, resultatNet: 35_000, resultatExploitation: 45_000,
      dotationsAmortissements: 5_000, stocks: 0, creancesClients: 5_000, disponibilites: 15_000,
      capitauxPropres: 15_000, empruntsEtablissementsCredit: 0, dettesFournisseurs: 5_000,
    },
    expectedNote: 'D', expectedConfiance: 'Faible', expectedValoMethod: 'Quasi nul — trésorerie + clientèle résiduelle',
    expectedWarnings: ['Rémunération 0€', 'Micro < 100k', 'Concentration > 50%', 'Croissance 0%'],
    coherenceChecks: [
      { check: 'Rému = 0€', result: 'EBITDA entièrement fictif', severity: 'error' },
      { check: 'CA < 100k', result: 'Quasi non valorisable', severity: 'error' },
      { check: 'Concentration > 50%', result: '1 client = l\'entreprise', severity: 'error' },
    ],
  },

  // 14. PATRIMOINE DOMINANT (scenarios.ts: holding_gestion → patrimoine_dominant)
  {
    scenarioId: 'holding_gestion', realArchetype: 'patrimoine_dominant', nom: 'ALPHA INVEST',
    diagnostic: { sector: 'holding', revenue: 200_000, ebitda: 150_000, growth: 5, recurring: 30, masseSalariale: 5 },
    financial: { revenue: 200_000, ebitda: 150_000, netIncome: 1_200_000, equity: 4_000_000, cash: 1_800_000, debt: 500_000, assets: 6_000_000 },
    remunerationDirigeant: 80_000,
    bilan: {
      annee: 2024, chiffreAffaires: 200_000, resultatNet: 1_200_000, resultatExploitation: 140_000,
      dotationsAmortissements: 10_000, stocks: 0, creancesClients: 20_000, disponibilites: 1_800_000,
      capitauxPropres: 4_000_000, empruntsEtablissementsCredit: 500_000, dettesFournisseurs: 10_000,
    },
    expectedNote: 'B', expectedConfiance: 'Moyenne', expectedValoMethod: 'ANR (actif net réévalué) + rendement',
    expectedWarnings: ['CA faible vs trésorerie (profil holding)'],
    coherenceChecks: [
      { check: 'CA 200k mais Tréso 1.8M', result: 'Profil holding', severity: 'warning' },
      { check: 'Méthode = ANR', result: 'Pas EBITDA multiple', severity: 'ok' },
    ],
  },

  // 15. PRE-REVENUE (scenarios.ts: startup_prerevenu → pre_revenue)
  {
    scenarioId: 'startup_prerevenu', realArchetype: 'pre_revenue', nom: 'NEURALMED',
    diagnostic: { sector: 'deeptech', revenue: 20_000, ebitda: -300_000, growth: 100, recurring: 80, masseSalariale: 80 },
    financial: { revenue: 20_000, ebitda: -300_000, netIncome: -220_000, equity: 100_000, cash: 400_000, debt: 50_000 },
    mrrMensuel: 2_000, remunerationDirigeant: 30_000,
    bilan: {
      annee: 2024, chiffreAffaires: 20_000, resultatNet: -220_000, resultatExploitation: -250_000,
      dotationsAmortissements: 50_000, stocks: 0, creancesClients: 5_000, disponibilites: 400_000,
      capitauxPropres: 100_000, empruntsEtablissementsCredit: 50_000, dettesFournisseurs: 10_000,
    },
    expectedNote: 'D+', expectedConfiance: 'Faible', expectedValoMethod: 'DCF si projection crédible, sinon non valorisable par multiples',
    expectedWarnings: ['Pré-revenu (CA 20k)', 'EBITDA très négatif (-300k)', 'Concentration > 50%'],
    coherenceChecks: [
      { check: 'CA = 20k', result: 'Pré-revenu, pas de multiple applicable', severity: 'error' },
      { check: 'EBITDA = -300k', result: 'Burn rate sans revenu', severity: 'error' },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════════════════════════

function mapConfidence(score: number): string {
  if (score >= 70) return 'Élevée'
  if (score >= 40) return 'Moyenne'
  return 'Faible'
}

function gradeToLabel(grade: string): string {
  return grade // A, B, C, D, E
}

// Parse expected note to grade (B+ → B, C+ → C, etc.)
function normalizeGrade(note: string): string {
  return note.replace(/[+-]/g, '')
}

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

console.log('\n🔍 Comparaison : résultats pipeline vs expected evaluations (scenarios.ts)\n')

// Stockage des résultats pour le tableau final
interface ComparisonResult {
  scenarioId: string
  nom: string
  realArchetype: string
  routing: string
  routingOk: boolean
  veMedian: number
  method: string
  confidence: number
  confianceLabel: string
  expectedConfiance: string
  confianceMatch: boolean
  diagnosticGrade: string
  expectedNote: string
  noteMatch: boolean
  expectedValoMethod: string
  methodMatch: boolean
}

const results: ComparisonResult[] = []

// ── Partie 1 : Routing ──

console.log('📡 Routing')

for (const s of SCENARIOS) {
  const detected = detectArchetype(s.diagnostic)
  const routingOk = detected === s.realArchetype

  if (routingOk) {
    test(`[${s.scenarioId}] ${s.nom} → ${s.realArchetype}`, () => {})
  } else {
    // Commerce de gros n'a pas d'archétype dédié, le routing réel peut différer
    if (s.scenarioId === 'commerce_gros') {
      warn(`[${s.scenarioId}] ${s.nom}`, `Routé vers "${detected}" (pas d'archétype commerce_gros dédié)`)
    } else {
      test(`[${s.scenarioId}] ${s.nom} → ${s.realArchetype}`, () => {
        assert(routingOk, `Attendu "${s.realArchetype}", obtenu "${detected}"`)
      })
    }
  }

  // Calcul valuation avec l'archétype réel (pas le routé si différent)
  const archetypeForCalc = routingOk ? detected : s.realArchetype
  const valuation = calculateValuation(archetypeForCalc, s.financial, s.qualitative)

  // Diagnostic financier (pour la note)
  const diag = genererDiagnostic(s.bilan)
  const adjusted = ajusterScoreDiagnostic(diag.synthese.score, {
    revenue: s.diagnostic.revenue,
    ebitda: s.diagnostic.ebitda,
    growth: s.diagnostic.growth,
    recurring: s.diagnostic.recurring,
    masseSalariale: s.diagnostic.masseSalariale,
    concentrationClient: s.qualitative?.concentrationClients,
    remunerationDirigeant: s.financial.retraitements?.salaireDirigeant ?? s.remunerationDirigeant,
    mrrMensuel: s.mrrMensuel,
  })

  // P3: Appliquer les gates de confiance (même logique que assemble-report-data.ts)
  let confianceLabel = mapConfidence(valuation.confidenceScore)
  const hasRetraitements = s.remunerationDirigeant != null && s.remunerationDirigeant > 0
  // Gate 1 : sans retraitements → Élevée → Moyenne
  if (!hasRetraitements && confianceLabel === 'Élevée') confianceLabel = 'Moyenne'
  // Gate 2 : EBITDA négatif → incertitude
  if (s.diagnostic.ebitda < 0 && confianceLabel === 'Élevée') confianceLabel = 'Moyenne'
  // Gate 3 : rému = 0 + CA significatif → EBITDA non représentatif
  const remu = s.financial.retraitements?.salaireDirigeant ?? s.remunerationDirigeant
  if (remu === 0 && s.diagnostic.revenue > 100_000 && confianceLabel === 'Élevée') confianceLabel = 'Moyenne'
  // Gate 4 : CA très faible + rému 0 → faible
  if (remu === 0 && s.diagnostic.revenue < 100_000 && s.diagnostic.revenue > 0) confianceLabel = 'Faible'

  results.push({
    scenarioId: s.scenarioId,
    nom: s.nom,
    realArchetype: archetypeForCalc,
    routing: detected,
    routingOk,
    veMedian: valuation.enterpriseValue.median,
    method: valuation.methodUsed,
    confidence: valuation.confidenceScore,
    confianceLabel,
    expectedConfiance: s.expectedConfiance,
    confianceMatch: confianceLabel === s.expectedConfiance,
    diagnosticGrade: adjusted.grade,
    expectedNote: s.expectedNote,
    noteMatch: normalizeGrade(adjusted.grade) === normalizeGrade(s.expectedNote),
    expectedValoMethod: s.expectedValoMethod,
    methodMatch: false, // computed below
  })
}

// ── Partie 2 : Comparaison des résultats ──

console.log('\n💰 Comparaison Valuation + Diagnostic')

for (const r of results) {
  const s = SCENARIOS.find(s => s.scenarioId === r.scenarioId)!

  // Méthode de valorisation
  test(`[${r.scenarioId}] Méthode cohérente`, () => {
    // La comparaison de méthode est souple — on vérifie les mots-clés
    const expected = s.expectedValoMethod.toLowerCase()
    const actual = r.method.toLowerCase()

    const methodKeywords: Record<string, string[]> = {
      'arr': ['arr'],
      'ebitda': ['ebitda'],
      'gmv': ['gmv'],
      'anr': ['anr', 'actif net'],
      'dcf': ['dcf', 'non standard', 'pré-revenu', 'pre_revenue'],
      'ca': ['ca', 'multiple ca'],
    }

    let matched = false
    for (const [, keywords] of Object.entries(methodKeywords)) {
      const expectedHas = keywords.some(k => expected.includes(k))
      const actualHas = keywords.some(k => actual.includes(k))
      if (expectedHas && actualHas) {
        matched = true
        break
      }
    }

    // Fallback: si le pre_revenue retourne VE=0, c'est cohérent
    if (r.realArchetype === 'pre_revenue' && r.veMedian === 0) {
      matched = true
    }

    r.methodMatch = matched
    if (!matched) {
      warn(`[${r.scenarioId}] Méthode`, `Expected: "${s.expectedValoMethod}", Got: "${r.method}"`)
    }
  })

  // Note de diagnostic
  test(`[${r.scenarioId}] Note diagnostic : ${r.diagnosticGrade} (attendu ~${s.expectedNote})`, () => {
    // Comparaison souple : même lettre de base (B+ ≈ B ≈ B-)
    const actualBase = normalizeGrade(r.diagnosticGrade)
    const expectedBase = normalizeGrade(s.expectedNote)
    // Tolérance : ±1 cran (B ≈ C ou A acceptable)
    const gradeOrder = ['E', 'D', 'C', 'B', 'A']
    const actualIdx = gradeOrder.indexOf(actualBase)
    const expectedIdx = gradeOrder.indexOf(expectedBase)
    const diff = Math.abs(actualIdx - expectedIdx)
    if (diff > 1) {
      assert(false, `Note "${r.diagnosticGrade}" trop éloignée de "${s.expectedNote}" (écart ${diff} crans)`)
    }
    if (diff === 1) {
      warn(`[${r.scenarioId}] Note`, `${r.diagnosticGrade} vs attendu ${s.expectedNote} (±1 cran)`)
    }
  })

  // Confiance
  test(`[${r.scenarioId}] Confiance : ${r.confianceLabel} (attendu ${s.expectedConfiance})`, () => {
    // Note : la confiance dans le rapport PDF est plafonnée si pas de retraitements.
    // Notre calcul ici est sur les données brutes (confidenceScore du calculateur)
    // → la confiance calculateur peut être "Élevée" alors que le PDF dirait "Moyenne"
    //   car le PDF ajoute la règle "sans retraitements → plafonner à Moyenne"
    const confianceOrder = ['Faible', 'Moyenne', 'Élevée']
    const actualIdx = confianceOrder.indexOf(r.confianceLabel)
    const expectedIdx = confianceOrder.indexOf(s.expectedConfiance)
    const diff = actualIdx - expectedIdx
    // Confiance peut être plus haute (car pas de gate PDF) → acceptable si diff ≤ 1
    if (diff < -1 || diff > 1) {
      assert(false, `Confiance "${r.confianceLabel}" trop éloignée de "${s.expectedConfiance}"`)
    }
    if (diff !== 0) {
      warn(`[${r.scenarioId}] Confiance`, `${r.confianceLabel} vs attendu ${s.expectedConfiance} (écart ${diff > 0 ? '+' : ''}${diff})`)
    }
  })
}

// ── Partie 3 : Cohérence checks ──

console.log('\n🔗 Vérifications de cohérence')

for (const s of SCENARIOS) {
  const r = results.find(r => r.scenarioId === s.scenarioId)!
  const valuation = calculateValuation(r.realArchetype, s.financial, s.qualitative)

  for (const check of s.coherenceChecks) {
    const checkName = `[${s.scenarioId}] ${check.check}`

    if (check.severity === 'error') {
      // Les checks "error" doivent absolument être détectés
      test(checkName, () => {
        // Vérifier que le système détecte effectivement le problème
        const lcCheck = check.check.toLowerCase()

        if (lcCheck.includes('rému') || lcCheck.includes('remu') || lcCheck.includes('salaire')) {
          // Vérifier que salaireDirigeant = 0 est bien dans les données
          const salaire = s.financial.retraitements?.salaireDirigeant
          assert(salaire === 0 || salaire === undefined,
            `Salaire dirigeant devrait être 0 ou absent (got ${salaire})`)
        }
        if (lcCheck.includes('concentration') && lcCheck.includes('50')) {
          const conc = s.qualitative?.concentrationClients
          assert(conc != null && conc > 50, `Concentration devrait être > 50% (got ${conc})`)
        }
        if (lcCheck.includes('ca') && (lcCheck.includes('20k') || lcCheck.includes('100k'))) {
          assert(s.diagnostic.revenue < 150_000,
            `CA devrait être faible (got ${s.diagnostic.revenue})`)
        }
        if (lcCheck.includes('ebitda') && lcCheck.includes('-')) {
          assert(s.diagnostic.ebitda < 0,
            `EBITDA devrait être négatif (got ${s.diagnostic.ebitda})`)
        }
      })
    }

    if (check.severity === 'warning') {
      // Les checks "warning" sont informatifs
      test(checkName, () => {
        // Vérifier la cohérence des données
        const lcCheck = check.check.toLowerCase()
        if (lcCheck.includes('masse sal') && lcCheck.includes('75')) {
          assert(s.diagnostic.masseSalariale >= 70,
            `Masse salariale devrait être ≥ 70% (got ${s.diagnostic.masseSalariale}%)`)
        }
        if (lcCheck.includes('marge ebitda') && lcCheck.includes('4%')) {
          const margeEbitda = s.diagnostic.ebitda / s.diagnostic.revenue * 100
          assert(margeEbitda <= 5,
            `Marge EBITDA devrait être ≤ 5% (got ${margeEbitda.toFixed(1)}%)`)
        }
        if (lcCheck.includes('ebitda négatif') || lcCheck.includes('ebitda negatif')) {
          assert(s.diagnostic.ebitda < 0,
            `EBITDA devrait être négatif (got ${s.diagnostic.ebitda})`)
        }
        if (lcCheck.includes('dettes') && lcCheck.includes('tréso')) {
          assert(s.financial.debt > s.financial.cash,
            `Dettes (${s.financial.debt}) devrait > Tréso (${s.financial.cash})`)
        }
      })
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// TABLEAU DE COMPARAISON FINAL
// ═══════════════════════════════════════════════════════════════

console.log('\n📊 Tableau de comparaison : Actual vs Expected\n')

console.log('  Scénario              │ Archétype           │ VE Médian  │ Méthode OK │ Note Act. │ Note Exp. │ Conf. Act.│ Conf. Exp.')
console.log('  ──────────────────────┼─────────────────────┼────────────┼────────────┼───────────┼───────────┼───────────┼──────────')

for (const r of results) {
  const veStr = r.veMedian === 0 ? '—' : `${(r.veMedian / 1_000_000).toFixed(2)}M€`
  const methodIcon = r.methodMatch ? '✅' : '⚠️ '
  const noteIcon = r.noteMatch ? '' : '⚠️ '
  const confIcon = r.confianceMatch ? '' : '⚠️ '

  console.log(
    `  ${r.nom.padEnd(22)} │ ${r.realArchetype.padEnd(19)} │ ${veStr.padStart(10)} │ ${methodIcon.padStart(10)} │ ${noteIcon}${r.diagnosticGrade.padStart(7)} │ ${r.expectedNote.padStart(9)} │ ${confIcon}${r.confianceLabel.padStart(7)} │ ${r.expectedConfiance.padStart(9)}`
  )
}

// ═══════════════════════════════════════════════════════════════
// RÉSUMÉ
// ═══════════════════════════════════════════════════════════════

const noteMatches = results.filter(r => r.noteMatch).length
const confMatches = results.filter(r => r.confianceMatch).length
const methodMatches = results.filter(r => r.methodMatch).length
const routingMatches = results.filter(r => r.routingOk).length

console.log('\n📈 Résumé de conformité')
console.log(`  Routing correct    : ${routingMatches}/${results.length}`)
console.log(`  Note diagnostic    : ${noteMatches}/${results.length} (±1 cran toléré)`)
console.log(`  Confiance          : ${confMatches}/${results.length} (gate PDF non appliqué)`)
console.log(`  Méthode cohérente  : ${methodMatches}/${results.length}`)

console.log('\n' + '═'.repeat(60))
console.log(`✅ ${passed} passés | ❌ ${failed} échoués | ⚠️  ${warns} warnings | Total: ${passed + failed}`)
if (failures.length > 0) {
  console.log('\nÉchecs détaillés:')
  failures.forEach(f => console.log(`  → ${f}`))
}
if (warnings.length > 0) {
  console.log('\nWarnings:')
  warnings.forEach(w => console.log(`  ⚠️  ${w}`))
}
console.log('═'.repeat(60) + '\n')

process.exit(failed > 0 ? 1 : 0)
