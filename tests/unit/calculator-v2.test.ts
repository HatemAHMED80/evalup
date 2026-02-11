// Tests unitaires pour le calculateur V2 par archétype
// Usage : npx tsx tests/unit/calculator-v2.test.ts

import {
  calculateValuation,
  getSalaireNormatif,
  normaliserEbitda,
  calculerDecotes,
  appliquerDecotes,
  WEIGHTS,
} from '../../src/lib/valuation/calculator-v2'
import type {
  FinancialData,
  QualitativeData,
  ValuationResult,
  Range,
} from '../../src/lib/valuation/calculator-v2'
import { ARCHETYPE_IDS } from '../../src/lib/valuation/archetypes'

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

function assertClose(actual: number, expected: number, tolerance: number, label: string) {
  assert(
    Math.abs(actual - expected) < tolerance,
    `${label}: attendu ~${expected}, obtenu ${actual}`,
  )
}

function fmtK(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M€`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K€`
  return `${Math.round(n)}€`
}

// Vérifie qu'un range chevauche un intervalle attendu (avec tolérance)
function assertRangeOverlaps(
  result: Range,
  expectedLow: number,
  expectedHigh: number,
  tolerance: number,
  label: string,
) {
  // Le range du résultat doit chevaucher [expectedLow, expectedHigh] avec tolérance
  const rLow = result.low * (1 - tolerance)
  const rHigh = result.high * (1 + tolerance)
  const overlap = rLow <= expectedHigh && rHigh >= expectedLow
  assert(
    overlap,
    `${label}: résultat [${fmtK(result.low)} - ${fmtK(result.high)}] ne chevauche pas ` +
    `attendu [${fmtK(expectedLow)} - ${fmtK(expectedHigh)}] (tolérance ${(tolerance * 100).toFixed(0)}%)`,
  )
}

// Vérifie que la médiane est dans un intervalle
function assertMedianInRange(
  result: Range,
  expectedLow: number,
  expectedHigh: number,
  tolerance: number,
  label: string,
) {
  const low = expectedLow * (1 - tolerance)
  const high = expectedHigh * (1 + tolerance)
  assert(
    result.median >= low && result.median <= high,
    `${label}: médiane ${fmtK(result.median)} hors intervalle ` +
    `[${fmtK(low)} - ${fmtK(high)}]`,
  )
}

// -----------------------------------------------------------------------------
// Tests : Barème salaire normatif
// -----------------------------------------------------------------------------

console.log('\n💰 Barème salaire normatif\n')

test('CA 300K → salaire 45K', () => {
  assertClose(getSalaireNormatif(300_000), 45_000, 1, 'salaire')
})

test('CA 800K → salaire 60K', () => {
  assertClose(getSalaireNormatif(800_000), 60_000, 1, 'salaire')
})

test('CA 1.5M → salaire 80K', () => {
  assertClose(getSalaireNormatif(1_500_000), 80_000, 1, 'salaire')
})

test('CA 3M → salaire 100K', () => {
  assertClose(getSalaireNormatif(3_000_000), 100_000, 1, 'salaire')
})

test('CA 7M → salaire 130K', () => {
  assertClose(getSalaireNormatif(7_000_000), 130_000, 1, 'salaire')
})

test('CA 15M → salaire 160K', () => {
  assertClose(getSalaireNormatif(15_000_000), 160_000, 1, 'salaire')
})

test('CA 25M → salaire 200K', () => {
  assertClose(getSalaireNormatif(25_000_000), 200_000, 1, 'salaire')
})

// -----------------------------------------------------------------------------
// Tests : Retraitements EBITDA
// -----------------------------------------------------------------------------

console.log('\n🔧 Retraitements EBITDA\n')

test('Sans retraitements → EBITDA inchangé', () => {
  const { ebitdaNormalise, adjustments } = normaliserEbitda(1_000_000, 200_000)
  assertClose(ebitdaNormalise, 200_000, 1, 'EBITDA')
  assert(adjustments.length === 0, 'Pas d\'ajustements attendus')
})

test('Salaire dirigeant excessif → +diff', () => {
  const { ebitdaNormalise } = normaliserEbitda(900_000, 200_000, {
    salaireDirigeant: 120_000, // normatif = 60K pour CA 900K (tranche 500K-1M)
  })
  // diff = 120K - 60K = 60K → EBITDA += 60K
  assertClose(ebitdaNormalise, 260_000, 1, 'EBITDA normalisé')
})

test('Salaire dirigeant insuffisant → -diff', () => {
  const { ebitdaNormalise } = normaliserEbitda(1_500_000, 300_000, {
    salaireDirigeant: 40_000, // normatif = 80K pour CA 1.5M (tranche 1M-2M)
  })
  // diff = 40K - 80K = -40K → EBITDA -= 40K
  assertClose(ebitdaNormalise, 260_000, 1, 'EBITDA normalisé')
})

test('Loyer au-dessus du marché → +diff', () => {
  const { ebitdaNormalise } = normaliserEbitda(1_000_000, 200_000, {
    loyerAppartientDirigeant: true,
    loyerAnnuel: 60_000,
    loyerMarche: 40_000,
  })
  assertClose(ebitdaNormalise, 220_000, 1, 'EBITDA normalisé')
})

test('Crédit-bail réintégré', () => {
  const { ebitdaNormalise } = normaliserEbitda(1_000_000, 200_000, {
    creditBailAnnuel: 30_000,
  })
  assertClose(ebitdaNormalise, 230_000, 1, 'EBITDA normalisé')
})

test('Charges exceptionnelles neutralisées', () => {
  const { ebitdaNormalise } = normaliserEbitda(1_000_000, 200_000, {
    chargesExceptionnelles: 50_000,
  })
  assertClose(ebitdaNormalise, 250_000, 1, 'EBITDA normalisé')
})

test('Produits exceptionnels neutralisés', () => {
  const { ebitdaNormalise } = normaliserEbitda(1_000_000, 300_000, {
    produitsExceptionnels: 100_000,
  })
  assertClose(ebitdaNormalise, 200_000, 1, 'EBITDA normalisé')
})

test('Multiples retraitements combinés', () => {
  const { ebitdaNormalise, adjustments } = normaliserEbitda(1_500_000, 200_000, {
    salaireDirigeant: 130_000, // normatif = 80K → +50K
    creditBailAnnuel: 20_000, // +20K
    chargesExceptionnelles: 30_000, // +30K
  })
  assertClose(ebitdaNormalise, 300_000, 1, 'EBITDA normalisé')
  assert(adjustments.length === 3, `Attendu 3 ajustements, obtenu ${adjustments.length}`)
})

// -----------------------------------------------------------------------------
// Tests : Décotes
// -----------------------------------------------------------------------------

console.log('\n📉 Décotes multiplicatives\n')

test('Sans données qualitatives → pas de décotes', () => {
  const d = calculerDecotes()
  assert(d.length === 0, `Attendu 0, obtenu ${d.length}`)
})

test('Avec données qualitatives → illiquidité toujours appliquée', () => {
  const d = calculerDecotes({})
  assert(d.length === 1, `Attendu 1 (illiquidité), obtenu ${d.length}`)
  assert(d[0].name.includes('illiquidité'), `Nom: ${d[0].name}`)
})

test('Minoritaire + illiquidité + homme-clé fort', () => {
  const d = calculerDecotes({
    participationMinoritaire: true,
    dependanceDirigeant: 'forte',
  })
  assert(d.length === 3, `Attendu 3, obtenu ${d.length}`)
})

test('Application multiplicative avec plafond 45%', () => {
  // Minoritaire 20% + illiquidité 15% + homme-clé 20% + litiges 10%
  // = 0.8 × 0.85 × 0.8 × 0.9 = 0.4896 → décote 51% > 45% → plafond à 55%
  const result = appliquerDecotes(1_000_000, [
    { name: 'A', percentage: 20, reason: '' },
    { name: 'B', percentage: 15, reason: '' },
    { name: 'C', percentage: 20, reason: '' },
    { name: 'D', percentage: 10, reason: '' },
  ])
  assertClose(result, 550_000, 1_000, 'Valeur après décotes plafonnées')
})

test('Décotes sans plafonnement', () => {
  // 15% + 10% = 0.85 × 0.90 = 0.765 → décote 23.5%
  const result = appliquerDecotes(1_000_000, [
    { name: 'A', percentage: 15, reason: '' },
    { name: 'B', percentage: 10, reason: '' },
  ])
  assertClose(result, 765_000, 1_000, 'Valeur après décotes')
})

// -----------------------------------------------------------------------------
// Tests : Pondérations
// -----------------------------------------------------------------------------

console.log('\n⚖️ Pondérations par archétype\n')

test('Tous les archétypes (sauf pre_revenue) ont des poids définis', () => {
  for (const id of ARCHETYPE_IDS) {
    if (id === 'pre_revenue') continue
    assert(id in WEIGHTS, `Poids manquant pour ${id}`)
    const [wp, ws] = WEIGHTS[id]
    assert(wp + ws === 100, `${id}: poids ${wp}+${ws} ≠ 100`)
  }
})

test('Patrimoine = 100% primaire, 0% secondaire', () => {
  const [wp, ws] = WEIGHTS['patrimoine']
  assert(wp === 100 && ws === 0, `patrimoine: ${wp}/${ws}`)
})

test('SaaS hyper = 80% primaire (ARR)', () => {
  const [wp] = WEIGHTS['saas_hyper']
  assert(wp === 80, `saas_hyper: ${wp}`)
})

// -----------------------------------------------------------------------------
// Tests : calculateValuation — cas de base
// -----------------------------------------------------------------------------

console.log('\n🧮 calculateValuation — cas de base\n')

test('Pre-revenue retourne VE = 0 et confidence = 0', () => {
  const r = calculateValuation('pre_revenue', {
    revenue: 50_000, ebitda: -800_000, netIncome: -800_000,
    equity: 200_000, cash: 100_000, debt: 0,
  })
  assert(r.archetype === 'pre_revenue', `archétype: ${r.archetype}`)
  assert(r.enterpriseValue.median === 0, `VE: ${r.enterpriseValue.median}`)
  assert(r.confidenceScore === 0, `confidence: ${r.confidenceScore}`)
  assert(r.methodUsed.includes('non standard'), `méthode: ${r.methodUsed}`)
})

test('Archétype inconnu → throw Error', () => {
  let threw = false
  try {
    calculateValuation('inexistant', {
      revenue: 1_000_000, ebitda: 200_000, netIncome: 100_000,
      equity: 300_000, cash: 50_000, debt: 100_000,
    })
  } catch {
    threw = true
  }
  assert(threw, 'Devrait throw pour archétype inconnu')
})

test('Résultat a la structure attendue', () => {
  const r = calculateValuation('commerce_retail', {
    revenue: 800_000, ebitda: 120_000, netIncome: 60_000,
    equity: 200_000, cash: 50_000, debt: 30_000,
  })
  assert(r.archetype === 'commerce_retail', 'archetype')
  assert(typeof r.methodUsed === 'string' && r.methodUsed.length > 0, 'methodUsed')
  assert(typeof r.valuationRange.low === 'number', 'valuationRange.low')
  assert(typeof r.valuationRange.median === 'number', 'valuationRange.median')
  assert(typeof r.valuationRange.high === 'number', 'valuationRange.high')
  assert(Array.isArray(r.adjustments), 'adjustments')
  assert(Array.isArray(r.decotes), 'decotes')
  assert(typeof r.enterpriseValue.low === 'number', 'enterpriseValue.low')
  assert(typeof r.netDebt === 'number', 'netDebt')
  assert(typeof r.equityValue.low === 'number', 'equityValue.low')
  assert(typeof r.confidenceScore === 'number', 'confidenceScore')
})

test('VE low ≤ median ≤ high', () => {
  const r = calculateValuation('industrie', {
    revenue: 8_000_000, ebitda: 900_000, netIncome: 450_000,
    equity: 2_000_000, cash: 300_000, debt: 500_000,
  })
  assert(r.enterpriseValue.low <= r.enterpriseValue.median, 'low ≤ median')
  assert(r.enterpriseValue.median <= r.enterpriseValue.high, 'median ≤ high')
})

test('Equity = VE - dette nette (sans décotes)', () => {
  const r = calculateValuation('industrie', {
    revenue: 8_000_000, ebitda: 900_000, netIncome: 450_000,
    equity: 2_000_000, cash: 300_000, debt: 500_000,
  })
  // DFN = 500K - 300K = 200K
  assertClose(r.netDebt, 200_000, 1, 'dette nette')
  // Sans qualitativeData → pas de décotes → equity = VE - DFN
  assertClose(r.equityValue.median, r.enterpriseValue.median - 200_000, 1, 'equity median')
})

test('Décotes réduisent l\'equity', () => {
  const base = calculateValuation('conseil', {
    revenue: 2_000_000, ebitda: 300_000, netIncome: 150_000,
    equity: 500_000, cash: 100_000, debt: 50_000,
  })
  const withDecotes = calculateValuation('conseil', {
    revenue: 2_000_000, ebitda: 300_000, netIncome: 150_000,
    equity: 500_000, cash: 100_000, debt: 50_000,
  }, { dependanceDirigeant: 'forte' })

  assert(
    withDecotes.equityValue.median < base.equityValue.median,
    `Avec décotes (${fmtK(withDecotes.equityValue.median)}) devrait < sans décotes (${fmtK(base.equityValue.median)})`,
  )
})

test('Retraitements modifient le résultat', () => {
  const base = calculateValuation('conseil', {
    revenue: 2_000_000, ebitda: 300_000, netIncome: 150_000,
    equity: 500_000, cash: 100_000, debt: 50_000,
  })
  const withRetrait = calculateValuation('conseil', {
    revenue: 2_000_000, ebitda: 300_000, netIncome: 150_000,
    equity: 500_000, cash: 100_000, debt: 50_000,
    retraitements: { salaireDirigeant: 150_000 }, // normatif = 80K → +70K
  })

  assert(
    withRetrait.enterpriseValue.median > base.enterpriseValue.median,
    `Avec retraitements (${fmtK(withRetrait.enterpriseValue.median)}) devrait > sans (${fmtK(base.enterpriseValue.median)})`,
  )
  assert(withRetrait.adjustments.length > 0, 'Devrait avoir des adjustments')
})

// -----------------------------------------------------------------------------
// Tests : 14 cas du spreadsheet (ARCHETYPES.xlsx → "Cas de test")
// -----------------------------------------------------------------------------

console.log('\n📊 14 cas de test du spreadsheet\n')

// Données financières par défaut pour les tests (debt=0, cash=0 → pas de bridge)
function makeFinData(overrides: Partial<FinancialData>): FinancialData {
  return {
    revenue: 0,
    ebitda: 0,
    netIncome: 0,
    equity: 0,
    cash: 0,
    debt: 0,
    ...overrides,
  }
}

// --- Cas 1 : SaaS B2B rapide → #1 saas_hyper ---
test('[Cas 1] SaaS B2B rapide → saas_hyper, VE dans fourchette 15-30M', () => {
  const r = calculateValuation('saas_hyper', makeFinData({
    revenue: 2_400_000,
    ebitda: -200_000,
    netIncome: -300_000,
    mrr: 200_000,     // ARR = 2.4M
    growth: 65,
    recurring: 92,
  }))
  assert(r.archetype === 'saas_hyper', `archétype: ${r.archetype}`)
  assert(r.methodUsed.includes('ARR'), `méthode: ${r.methodUsed}`)
  // VALO ATTENDUE: 15-30M → on accepte que la VE médiane soit dans cette zone (tolérance large)
  assertRangeOverlaps(r.enterpriseValue, 15_000_000, 30_000_000, 0.50, 'VE saas_hyper')
  assert(r.confidenceScore > 0, `confidence > 0`)
})

// --- Cas 2 : SaaS B2B mature → #2 saas_mature ---
test('[Cas 2] SaaS B2B mature → saas_mature, VE dans fourchette 10-20M', () => {
  const r = calculateValuation('saas_mature', makeFinData({
    revenue: 5_000_000,
    ebitda: 1_200_000,
    netIncome: 600_000,
    mrr: 400_000,     // ARR = 4.8M
    growth: 18,
    recurring: 88,
  }))
  assert(r.archetype === 'saas_mature', `archétype: ${r.archetype}`)
  assertRangeOverlaps(r.enterpriseValue, 10_000_000, 20_000_000, 0.50, 'VE saas_mature')
})

// --- Cas 3 : SaaS en déclin → #3 saas_decline ---
test('[Cas 3] SaaS en déclin → saas_decline, VE dans fourchette 2-5M', () => {
  const r = calculateValuation('saas_decline', makeFinData({
    revenue: 3_000_000,
    ebitda: 600_000,
    netIncome: 300_000,
    mrr: 180_000,
    growth: -5,
    recurring: 75,
  }))
  assert(r.archetype === 'saas_decline', `archétype: ${r.archetype}`)
  assertRangeOverlaps(r.enterpriseValue, 2_000_000, 5_000_000, 0.50, 'VE saas_decline')
})

// --- Cas 4 : Marketplace mode → #4 marketplace ---
test('[Cas 4] Marketplace mode → marketplace, VE dans fourchette 15-50M', () => {
  const r = calculateValuation('marketplace', makeFinData({
    revenue: 20_000_000,  // Utilisé comme proxy GMV
    ebitda: -100_000,
    netIncome: -200_000,
    growth: 45,
    recurring: 20,
  }))
  assert(r.archetype === 'marketplace', `archétype: ${r.archetype}`)
  // GMV = 20M. Multiples GMV: 1-4x → VE base 20-80M. Avec blend: 15-50M attendu
  assertRangeOverlaps(r.enterpriseValue, 15_000_000, 50_000_000, 0.50, 'VE marketplace')
})

// --- Cas 5 : E-commerce cosméto → #5 ecommerce ---
test('[Cas 5] E-commerce cosméto → ecommerce, VE dans fourchette 3-8M', () => {
  const r = calculateValuation('ecommerce', makeFinData({
    revenue: 4_000_000,
    ebitda: 400_000,
    netIncome: 200_000,
    growth: 25,
    recurring: 15,
  }))
  assert(r.archetype === 'ecommerce', `archétype: ${r.archetype}`)
  assertRangeOverlaps(r.enterpriseValue, 3_000_000, 8_000_000, 0.50, 'VE ecommerce')
})

// --- Cas 6 : Cabinet conseil IT → #6 conseil ---
test('[Cas 6] Cabinet conseil IT → conseil, VE dans fourchette 1.5-3M', () => {
  const r = calculateValuation('conseil', makeFinData({
    revenue: 2_000_000,
    ebitda: 300_000,
    netIncome: 150_000,
    growth: 10,
    recurring: 30,
  }))
  assert(r.archetype === 'conseil', `archétype: ${r.archetype}`)
  assert(r.methodUsed.includes('retraité'), `méthode: ${r.methodUsed}`)
  assertRangeOverlaps(r.enterpriseValue, 1_500_000, 3_000_000, 0.50, 'VE conseil')
})

// --- Cas 7 : Société nettoyage → #13 masse_salariale_lourde ---
test('[Cas 7] Société nettoyage → masse_salariale_lourde, VE dans fourchette 1-2M', () => {
  const r = calculateValuation('masse_salariale_lourde', makeFinData({
    revenue: 3_000_000,
    ebitda: 350_000,
    netIncome: 150_000,
    growth: 8,
    recurring: 70,
  }))
  assert(r.archetype === 'masse_salariale_lourde', `archétype: ${r.archetype}`)
  assertRangeOverlaps(r.enterpriseValue, 1_000_000, 2_000_000, 0.50, 'VE masse_sal')
})

// --- Cas 8 : Boulangerie premium → #8 commerce_retail ---
test('[Cas 8] Boulangerie premium → commerce_retail, VE dans fourchette 400K-800K', () => {
  const r = calculateValuation('commerce_retail', makeFinData({
    revenue: 800_000,
    ebitda: 120_000,
    netIncome: 60_000,
    growth: 5,
    recurring: 0,
  }))
  assert(r.archetype === 'commerce_retail', `archétype: ${r.archetype}`)
  assertRangeOverlaps(r.enterpriseValue, 400_000, 800_000, 0.50, 'VE commerce_retail')
})

// --- Cas 9 : PME industrielle → #9 industrie ---
test('[Cas 9] PME industrielle → industrie, VE dans fourchette 3-6M', () => {
  const r = calculateValuation('industrie', makeFinData({
    revenue: 8_000_000,
    ebitda: 900_000,
    netIncome: 450_000,
    growth: 3,
    recurring: 10,
    assets: 16_000_000,  // Actifs/CA = 2x
  }))
  assert(r.archetype === 'industrie', `archétype: ${r.archetype}`)
  assertRangeOverlaps(r.enterpriseValue, 3_000_000, 6_000_000, 0.50, 'VE industrie')
})

// --- Cas 10 : SCI 5 apparts → #10 patrimoine ---
test('[Cas 10] SCI 5 apparts → patrimoine, VE dans fourchette 1-1.5M', () => {
  const r = calculateValuation('patrimoine', makeFinData({
    revenue: 200_000,
    ebitda: 80_000,
    netIncome: 60_000,
    assets: 1_600_000,   // Actifs/CA = 8x
    recurring: 95,
  }))
  assert(r.archetype === 'patrimoine', `archétype: ${r.archetype}`)
  assert(r.methodUsed.includes('ANR'), `méthode: ${r.methodUsed}`)
  assertRangeOverlaps(r.enterpriseValue, 1_000_000, 1_500_000, 0.30, 'VE patrimoine')
})

// --- Cas 11 : Domaine viticole → #11 patrimoine_dominant ---
test('[Cas 11] Domaine viticole → patrimoine_dominant, VE dans fourchette 3-6M', () => {
  const r = calculateValuation('patrimoine_dominant', makeFinData({
    revenue: 500_000,
    ebitda: 30_000,
    netIncome: 10_000,
    assets: 6_000_000,   // Actifs/CA = 12x
    recurring: 10,
  }))
  assert(r.archetype === 'patrimoine_dominant', `archétype: ${r.archetype}`)
  assertRangeOverlaps(r.enterpriseValue, 3_000_000, 6_000_000, 0.30, 'VE patrimoine_dom')
})

// --- Cas 12 : Startup food delivery → #12 deficit_structurel ---
test('[Cas 12] Startup food delivery → deficit_structurel, VE dans fourchette 2-5M', () => {
  const r = calculateValuation('deficit_structurel', makeFinData({
    revenue: 6_000_000,
    ebitda: -1_500_000,
    netIncome: -2_000_000,
    equity: 500_000,
    growth: 12,
    recurring: 0,
  }))
  assert(r.archetype === 'deficit_structurel', `archétype: ${r.archetype}`)
  assertRangeOverlaps(r.enterpriseValue, 2_000_000, 5_000_000, 0.50, 'VE deficit')
})

// --- Cas 13 : Freelance dev senior → #14 micro_solo ---
test('[Cas 13] Freelance dev senior → micro_solo, VE dans fourchette 100-250K', () => {
  const r = calculateValuation('micro_solo', makeFinData({
    revenue: 180_000,
    ebitda: 120_000,
    netIncome: 100_000,
    growth: 5,
    recurring: 40,
  }))
  assert(r.archetype === 'micro_solo', `archétype: ${r.archetype}`)
  assertRangeOverlaps(r.enterpriseValue, 100_000, 250_000, 0.50, 'VE micro_solo')
})

// --- Cas 14 : Biotech pré-clinique → #15 pre_revenue ---
test('[Cas 14] Biotech pré-clinique → pre_revenue, VE = 0', () => {
  const r = calculateValuation('pre_revenue', makeFinData({
    revenue: 50_000,
    ebitda: -800_000,
    netIncome: -900_000,
    equity: 2_000_000,
  }))
  assert(r.archetype === 'pre_revenue', `archétype: ${r.archetype}`)
  assert(r.enterpriseValue.median === 0, `VE devrait être 0, obtenu ${r.enterpriseValue.median}`)
  assert(r.confidenceScore === 0, `confidence devrait être 0`)
  assert(r.methodUsed.includes('non standard'), `méthode: ${r.methodUsed}`)
})

// -----------------------------------------------------------------------------
// Tests : Invariants sur tous les archétypes
// -----------------------------------------------------------------------------

console.log('\n🔒 Invariants transversaux\n')

const ARCHETYPE_TEST_DATA: Record<string, FinancialData> = {
  saas_hyper: makeFinData({ revenue: 2_000_000, ebitda: -100_000, netIncome: -200_000, mrr: 150_000 }),
  saas_mature: makeFinData({ revenue: 5_000_000, ebitda: 1_000_000, netIncome: 500_000, mrr: 350_000 }),
  saas_decline: makeFinData({ revenue: 3_000_000, ebitda: 500_000, netIncome: 250_000, mrr: 150_000 }),
  marketplace: makeFinData({ revenue: 10_000_000, ebitda: -50_000, netIncome: -100_000 }),
  ecommerce: makeFinData({ revenue: 3_000_000, ebitda: 300_000, netIncome: 150_000 }),
  conseil: makeFinData({ revenue: 1_500_000, ebitda: 250_000, netIncome: 120_000 }),
  services_recurrents: makeFinData({ revenue: 2_000_000, ebitda: 400_000, netIncome: 200_000, recurring: 70 }),
  commerce_retail: makeFinData({ revenue: 600_000, ebitda: 90_000, netIncome: 45_000 }),
  industrie: makeFinData({ revenue: 6_000_000, ebitda: 700_000, netIncome: 350_000 }),
  patrimoine: makeFinData({ revenue: 150_000, ebitda: 60_000, netIncome: 40_000, assets: 1_200_000 }),
  patrimoine_dominant: makeFinData({ revenue: 400_000, ebitda: 20_000, netIncome: 5_000, assets: 5_000_000 }),
  deficit_structurel: makeFinData({ revenue: 4_000_000, ebitda: -500_000, netIncome: -700_000, equity: 300_000 }),
  masse_salariale_lourde: makeFinData({ revenue: 2_500_000, ebitda: 250_000, netIncome: 100_000 }),
  micro_solo: makeFinData({ revenue: 150_000, ebitda: 80_000, netIncome: 60_000 }),
}

for (const [id, data] of Object.entries(ARCHETYPE_TEST_DATA)) {
  test(`[${id}] VE low ≤ median ≤ high`, () => {
    const r = calculateValuation(id, data)
    assert(r.enterpriseValue.low <= r.enterpriseValue.median, `low (${r.enterpriseValue.low}) > median (${r.enterpriseValue.median})`)
    assert(r.enterpriseValue.median <= r.enterpriseValue.high, `median (${r.enterpriseValue.median}) > high (${r.enterpriseValue.high})`)
  })

  test(`[${id}] VE > 0`, () => {
    const r = calculateValuation(id, data)
    assert(r.enterpriseValue.median > 0, `VE median = ${r.enterpriseValue.median}`)
  })

  test(`[${id}] Equity low ≤ median ≤ high`, () => {
    const r = calculateValuation(id, data)
    assert(r.equityValue.low <= r.equityValue.median, `low > median`)
    assert(r.equityValue.median <= r.equityValue.high, `median > high`)
  })

  test(`[${id}] Confidence 0-100`, () => {
    const r = calculateValuation(id, data)
    assert(r.confidenceScore >= 0 && r.confidenceScore <= 100, `score = ${r.confidenceScore}`)
  })

  test(`[${id}] Pas de NaN/Infinity`, () => {
    const r = calculateValuation(id, data)
    const values = [
      r.enterpriseValue.low, r.enterpriseValue.median, r.enterpriseValue.high,
      r.equityValue.low, r.equityValue.median, r.equityValue.high,
      r.netDebt, r.confidenceScore,
    ]
    for (const v of values) {
      assert(!isNaN(v) && isFinite(v), `NaN ou Infinity détecté: ${v}`)
    }
  })
}

// -----------------------------------------------------------------------------
// Tests : Bridge VE → Prix de cession avec dette
// -----------------------------------------------------------------------------

console.log('\n🌉 Bridge VE → Prix de cession\n')

test('Entreprise endettée : equity < VE', () => {
  const r = calculateValuation('industrie', makeFinData({
    revenue: 5_000_000,
    ebitda: 600_000,
    netIncome: 300_000,
    cash: 100_000,
    debt: 800_000,  // DFN = 700K
  }))
  assertClose(r.netDebt, 700_000, 1, 'DFN')
  assert(r.equityValue.median < r.enterpriseValue.median, 'Equity < VE quand endetté')
})

test('Entreprise cash-rich : equity > VE', () => {
  const r = calculateValuation('conseil', makeFinData({
    revenue: 2_000_000,
    ebitda: 400_000,
    netIncome: 200_000,
    cash: 500_000,
    debt: 50_000,  // DFN = -450K (tréso nette)
  }))
  assertClose(r.netDebt, -450_000, 1, 'DFN')
  assert(r.equityValue.median > r.enterpriseValue.median, 'Equity > VE quand cash-rich')
})

test('Crédit-bail restant ajouté à la dette', () => {
  const r = calculateValuation('industrie', makeFinData({
    revenue: 5_000_000,
    ebitda: 600_000,
    netIncome: 300_000,
    cash: 100_000,
    debt: 200_000,
    retraitements: { creditBailRestant: 150_000 },
  }))
  // DFN = (200K + 150K CB) - 100K = 250K
  assertClose(r.netDebt, 250_000, 1, 'DFN avec crédit-bail')
})

// -----------------------------------------------------------------------------
// Tests : Méthodes spécifiques par archétype
// -----------------------------------------------------------------------------

console.log('\n🏗️ Méthodes spécifiques\n')

test('SaaS hyper utilise ARR (pas EBITDA négatif)', () => {
  const r = calculateValuation('saas_hyper', makeFinData({
    revenue: 3_000_000,
    ebitda: -500_000,
    netIncome: -800_000,
    arr: 3_600_000,
  }))
  // VE doit être basée sur ARR, pas sur EBITDA (qui est négatif)
  // ARR × 8 = 28.8M (low), donc VE >> 0
  assert(r.enterpriseValue.median > 10_000_000, `VE devrait être >> 0, obtenu ${fmtK(r.enterpriseValue.median)}`)
})

test('Patrimoine utilise ANR (pas EBITDA)', () => {
  const r = calculateValuation('patrimoine', makeFinData({
    revenue: 100_000,
    ebitda: 20_000,
    netIncome: 15_000,
    assets: 2_000_000,
  }))
  // VE ~= ANR × 0.7-1.0 = 1.4M-2M, pas EBITDA × multiple
  assert(r.enterpriseValue.median > 1_000_000, `VE basée ANR devrait > 1M, obtenu ${fmtK(r.enterpriseValue.median)}`)
  assert(r.enterpriseValue.median < 3_000_000, `VE ANR devrait < 3M`)
})

test('Deficit structurel utilise CA (pas EBITDA négatif)', () => {
  const r = calculateValuation('deficit_structurel', makeFinData({
    revenue: 5_000_000,
    ebitda: -1_000_000,
    netIncome: -1_500_000,
    equity: 400_000,
  }))
  // CA × 0.3-1.5 = 1.5M-7.5M
  assert(r.enterpriseValue.median > 0, 'VE > 0 malgré EBITDA négatif')
})

test('Micro solo avec bénéfice retraité', () => {
  const r = calculateValuation('micro_solo', makeFinData({
    revenue: 200_000,
    ebitda: 100_000,
    netIncome: 80_000,
  }))
  // Primary = EBITDA (100K) × 1-3 = 100K-300K
  assert(r.enterpriseValue.low > 50_000, `VE low devrait > 50K`)
  assert(r.enterpriseValue.high < 500_000, `VE high devrait < 500K`)
})

test('Ecommerce profitable utilise CA + EBITDA', () => {
  const r = calculateValuation('ecommerce', makeFinData({
    revenue: 2_000_000,
    ebitda: 200_000,
    netIncome: 100_000,
  }))
  // Blend CA et EBITDA
  assert(r.enterpriseValue.median > 0, 'VE > 0')
})

test('Ecommerce non profitable utilise 100% CA', () => {
  const r = calculateValuation('ecommerce', makeFinData({
    revenue: 2_000_000,
    ebitda: -100_000,
    netIncome: -200_000,
  }))
  // EBITDA négatif → secondary = 0 → 100% CA
  // CA × 1-3 = 2M-6M
  assert(r.enterpriseValue.low >= 1_500_000, `VE low basée CA: ${fmtK(r.enterpriseValue.low)}`)
})

// -----------------------------------------------------------------------------
// Tests : Score de confiance
// -----------------------------------------------------------------------------

console.log('\n📊 Score de confiance\n')

test('SaaS hyper sans ARR/MRR → confiance réduite', () => {
  const r = calculateValuation('saas_hyper', makeFinData({
    revenue: 2_000_000,
    ebitda: -100_000,
    netIncome: -200_000,
    // Pas d'ARR ni MRR → utilise CA comme proxy
  }))
  assert(r.confidenceScore < 80, `Score devrait < 80 sans ARR, obtenu ${r.confidenceScore}`)
})

test('EBITDA-based sans retraitements → confiance réduite', () => {
  const r = calculateValuation('industrie', makeFinData({
    revenue: 5_000_000,
    ebitda: 600_000,
    netIncome: 300_000,
  }))
  // Pas de retraitements et pas de qualitativeData → -20
  assert(r.confidenceScore < 90, `Score devrait < 90 sans retraitements, obtenu ${r.confidenceScore}`)
})

test('Données complètes → haute confiance', () => {
  const r = calculateValuation('commerce_retail', makeFinData({
    revenue: 800_000,
    ebitda: 120_000,
    netIncome: 60_000,
    retraitements: { salaireDirigeant: 45_000 },
  }), { dependanceDirigeant: 'faible' })
  assert(r.confidenceScore >= 70, `Score devrait >= 70 avec données complètes, obtenu ${r.confidenceScore}`)
})

// -----------------------------------------------------------------------------
// Résumé
// -----------------------------------------------------------------------------

console.log('\n' + '═'.repeat(50))
console.log(`✅ ${passed} passés | ❌ ${failed} échoués | Total: ${passed + failed}`)
if (failures.length > 0) {
  console.log('\nÉchecs:')
  failures.forEach(f => console.log(`  → ${f}`))
}
console.log('═'.repeat(50) + '\n')

process.exit(failed > 0 ? 1 : 0)
