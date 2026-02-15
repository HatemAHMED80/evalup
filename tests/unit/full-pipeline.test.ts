// Tests pipeline complet : routing → valuation → rapport pour les 15 archétypes
// Usage : npx tsx tests/unit/full-pipeline.test.ts

import { detectArchetype } from '../../src/lib/valuation/archetypes'
import type { DiagnosticInput } from '../../src/lib/valuation/archetypes'
import { calculateValuation } from '../../src/lib/valuation/calculator-v2'
import type { FinancialData, QualitativeData, ValuationResult } from '../../src/lib/valuation/calculator-v2'

// -----------------------------------------------------------------------------
// Mini test runner
// -----------------------------------------------------------------------------

let passed = 0
let failed = 0
const failures: string[] = []

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

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function assertEqual(actual: unknown, expected: unknown, context: string) {
  if (actual !== expected) throw new Error(`${context} — attendu "${expected}", obtenu "${actual}"`)
}

// -----------------------------------------------------------------------------
// Les 15 scénarios — un par archétype réel
// Chaque scénario inclut : diagnostic input, financial data, qualitative data,
// et les assertions attendues.
// -----------------------------------------------------------------------------

interface PipelineScenario {
  id: string
  nom: string
  diagnostic: DiagnosticInput
  financial: FinancialData
  qualitative?: QualitativeData
  expectedArchetype: string
  veMin: number          // Valeur d'entreprise minimum attendue (€)
  veMax: number          // Valeur d'entreprise maximum attendue (€)
  minConfidence: number  // Score de confiance minimum
}

const SCENARIOS: PipelineScenario[] = [
  // ═══════════════════════════════════════════════════════════════
  // 1. SAAS HYPER-CROISSANCE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'saas_hyper',
    nom: 'ROCKETFLOW — SaaS B2B hyper-croissance',
    diagnostic: {
      sector: 'saas', revenue: 800_000, ebitda: -200_000,
      growth: 95, recurring: 95, masseSalariale: 70, hasMRR: true,
    },
    financial: {
      revenue: 800_000, ebitda: -200_000, netIncome: -180_000,
      equity: 200_000, cash: 600_000, debt: 0,
      arr: 840_000, mrr: 70_000,
    },
    expectedArchetype: 'saas_hyper',
    veMin: 5_000_000, veMax: 30_000_000,
    minConfidence: 30,
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. SAAS MATURE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'saas_mature',
    nom: 'DATAWISE — SaaS B2B mature rentable',
    diagnostic: {
      sector: 'saas', revenue: 3_000_000, ebitda: 750_000,
      growth: 20, recurring: 92, masseSalariale: 55, hasMRR: true,
    },
    financial: {
      revenue: 3_000_000, ebitda: 750_000, netIncome: 450_000,
      equity: 1_500_000, cash: 700_000, debt: 200_000,
      arr: 3_000_000, mrr: 250_000,
    },
    qualitative: { dependanceDirigeant: 'faible', concentrationClients: 20 },
    expectedArchetype: 'saas_mature',
    veMin: 8_000_000, veMax: 40_000_000,
    minConfidence: 60,
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. SAAS EN DÉCLIN
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'saas_decline',
    nom: 'LEGACYSOFT — SaaS B2B en perte de vitesse',
    diagnostic: {
      sector: 'saas', revenue: 2_000_000, ebitda: 400_000,
      growth: 2, recurring: 85, masseSalariale: 50, hasMRR: true,
    },
    financial: {
      revenue: 2_000_000, ebitda: 400_000, netIncome: 250_000,
      equity: 1_000_000, cash: 500_000, debt: 300_000,
      arr: 1_700_000, mrr: 142_000,
    },
    qualitative: { dependanceDirigeant: 'moyenne', concentrationClients: 35 },
    expectedArchetype: 'saas_decline',
    veMin: 1_500_000, veMax: 10_000_000,
    minConfidence: 40,
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. MARKETPLACE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'marketplace',
    nom: 'TROQR — Marketplace mode',
    diagnostic: {
      sector: 'marketplace', revenue: 1_200_000, ebitda: -100_000,
      growth: 80, recurring: 60, masseSalariale: 50,
    },
    financial: {
      revenue: 1_200_000, ebitda: -100_000, netIncome: -70_000,
      equity: 500_000, cash: 400_000, debt: 0,
      gmv: 10_000_000, netRevenue: 1_200_000,
    },
    expectedArchetype: 'marketplace',
    veMin: 5_000_000, veMax: 60_000_000,
    minConfidence: 20,
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. E-COMMERCE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ecommerce',
    nom: 'MAISON ALBA — E-commerce cosmétique',
    diagnostic: {
      sector: 'ecommerce', revenue: 2_000_000, ebitda: 300_000,
      growth: 15, recurring: 30, masseSalariale: 25,
    },
    financial: {
      revenue: 2_000_000, ebitda: 300_000, netIncome: 180_000,
      equity: 600_000, cash: 100_000, debt: 120_000,
    },
    qualitative: { dependanceDirigeant: 'faible', concentrationClients: 5 },
    expectedArchetype: 'ecommerce',
    veMin: 1_000_000, veMax: 8_000_000,
    minConfidence: 50,
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. CONSEIL / SERVICES INTELLECTUELS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'conseil',
    nom: 'STRATEGIA CONSEIL — Cabinet conseil IT',
    diagnostic: {
      sector: 'conseil', revenue: 500_000, ebitda: 180_000,
      growth: 8, recurring: 40, masseSalariale: 30,
    },
    financial: {
      revenue: 500_000, ebitda: 180_000, netIncome: 130_000,
      equity: 200_000, cash: 180_000, debt: 0,
      retraitements: { salaireDirigeant: 0 },
    },
    qualitative: { dependanceDirigeant: 'forte', concentrationClients: 40 },
    expectedArchetype: 'conseil',
    veMin: 200_000, veMax: 2_000_000,
    minConfidence: 30,
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. SERVICES RÉCURRENTS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'services_recurrents',
    nom: 'CLEANPRO — Services de nettoyage B2B',
    diagnostic: {
      sector: 'services', revenue: 1_500_000, ebitda: 250_000,
      growth: 10, recurring: 80, masseSalariale: 60,
    },
    financial: {
      revenue: 1_500_000, ebitda: 250_000, netIncome: 170_000,
      equity: 400_000, cash: 250_000, debt: 100_000,
    },
    qualitative: { dependanceDirigeant: 'moyenne', concentrationClients: 20 },
    expectedArchetype: 'services_recurrents',
    veMin: 500_000, veMax: 3_000_000,
    minConfidence: 50,
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. COMMERCE RETAIL
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'commerce_retail',
    nom: 'LES SAVEURS DE JULIE — Boulangerie premium',
    diagnostic: {
      sector: 'restaurant', revenue: 800_000, ebitda: 120_000,
      growth: 5, recurring: 50, masseSalariale: 35, hasPhysicalStore: true,
    },
    financial: {
      revenue: 800_000, ebitda: 120_000, netIncome: 80_000,
      equity: 150_000, cash: 40_000, debt: 70_000,
    },
    qualitative: { dependanceDirigeant: 'moyenne', concentrationClients: 5 },
    expectedArchetype: 'commerce_retail',
    veMin: 200_000, veMax: 1_000_000,
    minConfidence: 50,
  },

  // ═══════════════════════════════════════════════════════════════
  // 9. INDUSTRIE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'industrie',
    nom: 'MECAPRECIS — PME industrielle mécanique',
    diagnostic: {
      sector: 'industrie', revenue: 4_000_000, ebitda: 500_000,
      growth: 5, recurring: 60, masseSalariale: 40,
    },
    financial: {
      revenue: 4_000_000, ebitda: 500_000, netIncome: 300_000,
      equity: 1_200_000, cash: 180_000, debt: 900_000,
      assets: 2_500_000,
    },
    qualitative: { dependanceDirigeant: 'faible', concentrationClients: 20 },
    expectedArchetype: 'industrie',
    veMin: 1_500_000, veMax: 5_000_000,
    minConfidence: 50,
  },

  // ═══════════════════════════════════════════════════════════════
  // 10. PATRIMOINE (récurrence locative)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'patrimoine',
    nom: 'FONCIÈRE DU SUD — SCI 5 appartements',
    diagnostic: {
      sector: 'immobilier', revenue: 600_000, ebitda: 400_000,
      growth: 3, recurring: 95, masseSalariale: 5,
    },
    financial: {
      revenue: 600_000, ebitda: 400_000, netIncome: 250_000,
      equity: 3_000_000, cash: 250_000, debt: 2_100_000,
      assets: 5_000_000,
    },
    expectedArchetype: 'patrimoine',
    veMin: 1_000_000, veMax: 8_000_000,
    minConfidence: 40,
  },

  // ═══════════════════════════════════════════════════════════════
  // 11. PATRIMOINE DOMINANT (peu de revenus)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'patrimoine_dominant',
    nom: 'ALPHA INVEST — Holding familiale',
    diagnostic: {
      sector: 'holding', revenue: 200_000, ebitda: 150_000,
      growth: 5, recurring: 30, masseSalariale: 5,
    },
    financial: {
      revenue: 200_000, ebitda: 150_000, netIncome: 1_200_000,
      equity: 4_000_000, cash: 1_800_000, debt: 500_000,
      assets: 6_000_000,
    },
    expectedArchetype: 'patrimoine_dominant',
    veMin: 1_000_000, veMax: 10_000_000,
    minConfidence: 30,
  },

  // ═══════════════════════════════════════════════════════════════
  // 12. DÉFICIT STRUCTUREL
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'deficit_structurel',
    nom: 'QUICKBITE — Startup food delivery déficitaire',
    diagnostic: {
      sector: 'tech', revenue: 5_000_000, ebitda: -800_000,
      growth: 10, recurring: 30, masseSalariale: 40,
    },
    financial: {
      revenue: 5_000_000, ebitda: -800_000, netIncome: -1_000_000,
      equity: 200_000, cash: 300_000, debt: 500_000,
    },
    expectedArchetype: 'deficit_structurel',
    veMin: 500_000, veMax: 10_000_000,
    minConfidence: 20,
  },

  // ═══════════════════════════════════════════════════════════════
  // 13. MASSE SALARIALE LOURDE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'masse_salariale_lourde',
    nom: 'BATISUD — BTP masse salariale 75%',
    diagnostic: {
      sector: 'btp', revenue: 5_000_000, ebitda: 200_000,
      growth: 3, recurring: 20, masseSalariale: 75,
    },
    financial: {
      revenue: 5_000_000, ebitda: 200_000, netIncome: 120_000,
      equity: 600_000, cash: 80_000, debt: 550_000,
    },
    qualitative: { dependanceDirigeant: 'moyenne', concentrationClients: 20 },
    expectedArchetype: 'masse_salariale_lourde',
    veMin: 300_000, veMax: 2_000_000,
    minConfidence: 40,
  },

  // ═══════════════════════════════════════════════════════════════
  // 14. MICRO-ENTREPRISE / SOLO
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'micro_solo',
    nom: 'JEAN DUPONT — Freelance dev senior',
    diagnostic: {
      sector: 'conseil', revenue: 120_000, ebitda: 80_000,
      growth: 10, recurring: 50, masseSalariale: 0,
    },
    financial: {
      revenue: 120_000, ebitda: 80_000, netIncome: 60_000,
      equity: 50_000, cash: 40_000, debt: 0,
      retraitements: { salaireDirigeant: 0 },
    },
    qualitative: { dependanceDirigeant: 'forte', concentrationClients: 50 },
    expectedArchetype: 'micro_solo',
    veMin: 10_000, veMax: 500_000,
    minConfidence: 20,
  },

  // ═══════════════════════════════════════════════════════════════
  // 15. PRE-REVENUE / DEEP TECH
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'pre_revenue',
    nom: 'NEURALMED — Biotech pré-clinique',
    diagnostic: {
      sector: 'deeptech', revenue: 20_000, ebitda: -300_000,
      growth: 100, recurring: 80, masseSalariale: 80,
    },
    financial: {
      revenue: 20_000, ebitda: -300_000, netIncome: -220_000,
      equity: 100_000, cash: 400_000, debt: 50_000,
    },
    expectedArchetype: 'pre_revenue',
    veMin: 0, veMax: 0, // Pre-revenue = VE 0 par le calculateur
    minConfidence: 0,
  },
]

// =============================================================================
// TESTS
// =============================================================================

console.log('\n🔬 Pipeline complet : 15 archétypes × (routing + valuation)\n')

// ── Étape 1 : Routing ──────────────────────────────────────────────────────────

console.log('📡 Étape 1 : Routing (detectArchetype)')

for (const s of SCENARIOS) {
  test(`[${s.id}] ${s.nom} → ${s.expectedArchetype}`, () => {
    const result = detectArchetype(s.diagnostic)
    assertEqual(result, s.expectedArchetype, s.id)
  })
}

// ── Étape 2 : Valuation ────────────────────────────────────────────────────────

console.log('\n💰 Étape 2 : Valuation (calculateValuation)')

const valuationResults: Record<string, ValuationResult> = {}

for (const s of SCENARIOS) {
  test(`[${s.id}] Valuation produit un résultat valide`, () => {
    const result = calculateValuation(s.expectedArchetype, s.financial, s.qualitative)
    valuationResults[s.id] = result

    // Structure de base
    assert(result.archetype === s.expectedArchetype, `archetype mismatch: ${result.archetype}`)
    assert(typeof result.methodUsed === 'string' && result.methodUsed.length > 0, 'methodUsed vide')
    assert(typeof result.confidenceScore === 'number', 'confidenceScore manquant')
    assert(result.confidenceScore >= 0 && result.confidenceScore <= 100, `confidence hors bornes: ${result.confidenceScore}`)
  })

  test(`[${s.id}] VE dans la fourchette ${(s.veMin/1e6).toFixed(1)}M – ${(s.veMax/1e6).toFixed(1)}M`, () => {
    const result = valuationResults[s.id]
    if (!result) throw new Error('Valuation non calculée')

    const veMedian = result.enterpriseValue.median

    if (s.expectedArchetype === 'pre_revenue') {
      assertEqual(veMedian, 0, 'Pre-revenue devrait avoir VE = 0')
      return
    }

    assert(veMedian >= s.veMin, `VE median (${(veMedian/1e6).toFixed(2)}M) < min attendu (${(s.veMin/1e6).toFixed(1)}M)`)
    assert(veMedian <= s.veMax, `VE median (${(veMedian/1e6).toFixed(2)}M) > max attendu (${(s.veMax/1e6).toFixed(1)}M)`)
  })

  test(`[${s.id}] VE low ≤ median ≤ high`, () => {
    const r = valuationResults[s.id]
    if (!r) throw new Error('Valuation non calculée')
    assert(r.enterpriseValue.low <= r.enterpriseValue.median, `low (${r.enterpriseValue.low}) > median (${r.enterpriseValue.median})`)
    assert(r.enterpriseValue.median <= r.enterpriseValue.high, `median (${r.enterpriseValue.median}) > high (${r.enterpriseValue.high})`)
  })

  test(`[${s.id}] Equity low ≤ median ≤ high`, () => {
    const r = valuationResults[s.id]
    if (!r) throw new Error('Valuation non calculée')
    assert(r.equityValue.low <= r.equityValue.median, `low > median`)
    assert(r.equityValue.median <= r.equityValue.high, `median > high`)
  })

  test(`[${s.id}] Pas de NaN/Infinity`, () => {
    const r = valuationResults[s.id]
    if (!r) throw new Error('Valuation non calculée')
    const vals = [
      r.enterpriseValue.low, r.enterpriseValue.median, r.enterpriseValue.high,
      r.equityValue.low, r.equityValue.median, r.equityValue.high,
      r.netDebt, r.confidenceScore,
    ]
    for (const v of vals) {
      assert(!isNaN(v) && isFinite(v), `Valeur NaN ou Infinity trouvée: ${v}`)
    }
  })

  test(`[${s.id}] Confiance ≥ ${s.minConfidence}`, () => {
    const r = valuationResults[s.id]
    if (!r) throw new Error('Valuation non calculée')
    assert(r.confidenceScore >= s.minConfidence, `confidence (${r.confidenceScore}) < min (${s.minConfidence})`)
  })
}

// ── Étape 3 : Cohérence inter-archétypes ────────────────────────────────────────

console.log('\n🔗 Étape 3 : Cohérence inter-archétypes')

test('SaaS hyper VE > SaaS decline VE', () => {
  const hyper = valuationResults['saas_hyper']
  const decline = valuationResults['saas_decline']
  assert(hyper.enterpriseValue.median > decline.enterpriseValue.median,
    `Hyper (${hyper.enterpriseValue.median}) devrait > Decline (${decline.enterpriseValue.median})`)
})

test('Industrie VE > Commerce retail VE', () => {
  const ind = valuationResults['industrie']
  const com = valuationResults['commerce_retail']
  assert(ind.enterpriseValue.median > com.enterpriseValue.median,
    `Industrie (${ind.enterpriseValue.median}) devrait > Commerce (${com.enterpriseValue.median})`)
})

test('Micro solo VE < Conseil VE', () => {
  const micro = valuationResults['micro_solo']
  const conseil = valuationResults['conseil']
  assert(micro.enterpriseValue.median < conseil.enterpriseValue.median,
    `Micro (${micro.enterpriseValue.median}) devrait < Conseil (${conseil.enterpriseValue.median})`)
})

test('Pre-revenue VE = 0', () => {
  const pre = valuationResults['pre_revenue']
  assertEqual(pre.enterpriseValue.median, 0, 'Pre-revenue VE')
})

test('Deficit structurel confiance ≤ SaaS mature confiance', () => {
  const deficit = valuationResults['deficit_structurel']
  const mature = valuationResults['saas_mature']
  assert(deficit.confidenceScore <= mature.confidenceScore,
    `Deficit (${deficit.confidenceScore}) devrait ≤ Mature (${mature.confidenceScore})`)
})

// ── Étape 4 : Tableau récapitulatif ─────────────────────────────────────────────

console.log('\n📊 Tableau récapitulatif des 15 valorisations\n')

console.log('  Archétype                  │ VE Median        │ Equity Median    │ Méthode                              │ Conf.')
console.log('  ───────────────────────────┼──────────────────┼──────────────────┼──────────────────────────────────────┼──────')

for (const s of SCENARIOS) {
  const r = valuationResults[s.id]
  if (!r) continue

  const ve = r.enterpriseValue.median
  const eq = r.equityValue.median
  const veStr = ve === 0 ? '—' : `${(ve / 1_000_000).toFixed(2)}M€`
  const eqStr = eq === 0 ? '—' : `${(eq / 1_000_000).toFixed(2)}M€`

  console.log(
    `  ${s.id.padEnd(27)} │ ${veStr.padStart(16)} │ ${eqStr.padStart(16)} │ ${r.methodUsed.substring(0, 36).padEnd(36)} │ ${r.confidenceScore.toString().padStart(4)}%`
  )
}

// ── Résumé ──────────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60))
console.log(`✅ ${passed} passés | ❌ ${failed} échoués | Total: ${passed + failed}`)
if (failures.length > 0) {
  console.log('\nÉchecs détaillés:')
  failures.forEach(f => console.log(`  → ${f}`))
}
console.log('═'.repeat(60) + '\n')

process.exit(failed > 0 ? 1 : 0)
