// Tests unitaires pour le routing automatique vers les archétypes
// Source des cas de test : /docs/ARCHETYPES.xlsx (onglet "Cas de test")
// Usage : npx tsx tests/unit/routing.test.ts

import { detectArchetype } from '../../src/lib/valuation/archetypes'
import type { DiagnosticInput } from '../../src/lib/valuation/archetypes'

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

function assertEqual(actual: string, expected: string, context: string) {
  if (actual !== expected) {
    throw new Error(`${context} — attendu "${expected}", obtenu "${actual}"`)
  }
}

// -----------------------------------------------------------------------------
// 14 cas de test du spreadsheet
// -----------------------------------------------------------------------------

interface TestCase {
  id: number
  name: string
  input: DiagnosticInput
  expected: string
}

const TEST_CASES: TestCase[] = [
  {
    id: 1,
    name: 'SaaS B2B rapide → saas_hyper',
    input: {
      sector: 'saas',
      revenue: 2_400_000,
      ebitda: -200_000,
      growth: 65,
      recurring: 92,
      masseSalariale: 35,
      hasMRR: true,
    },
    expected: 'saas_hyper',
  },
  {
    id: 2,
    name: 'SaaS B2B mature → saas_mature',
    input: {
      sector: 'saas',
      revenue: 5_000_000,
      ebitda: 1_200_000,
      growth: 18,
      recurring: 88,
      masseSalariale: 40,
      hasMRR: true,
    },
    expected: 'saas_mature',
  },
  {
    id: 3,
    name: 'SaaS en déclin → saas_decline',
    input: {
      sector: 'saas',
      revenue: 3_000_000,
      ebitda: 600_000,
      growth: -5,
      recurring: 75,
      masseSalariale: 45,
      hasMRR: true,
    },
    expected: 'saas_decline',
  },
  {
    id: 4,
    name: 'Marketplace mode → marketplace',
    input: {
      sector: 'marketplace',
      revenue: 20_000_000,
      ebitda: -100_000,
      growth: 45,
      recurring: 20,
      masseSalariale: 30,
      hasMRR: false,
    },
    expected: 'marketplace',
  },
  {
    id: 5,
    name: 'E-commerce cosmétique → ecommerce',
    input: {
      sector: 'ecommerce',
      revenue: 4_000_000,
      ebitda: 400_000,
      growth: 25,
      recurring: 15,
      masseSalariale: 20,
    },
    expected: 'ecommerce',
  },
  {
    id: 6,
    name: 'Cabinet conseil IT → conseil',
    input: {
      sector: 'conseil',
      revenue: 2_000_000,
      ebitda: 300_000,
      growth: 10,
      recurring: 30,
      masseSalariale: 55,
    },
    expected: 'conseil',
  },
  {
    id: 7,
    name: 'Société nettoyage → masse_salariale_lourde',
    input: {
      sector: 'services',
      revenue: 3_000_000,
      ebitda: 350_000,
      growth: 8,
      recurring: 70,
      masseSalariale: 65,
    },
    expected: 'masse_salariale_lourde',
  },
  {
    id: 8,
    name: 'Boulangerie premium → commerce_retail',
    input: {
      sector: 'commerce',
      revenue: 800_000,
      ebitda: 120_000,
      growth: 5,
      recurring: 0,
      masseSalariale: 30,
      hasPhysicalStore: true,
    },
    expected: 'commerce_retail',
  },
  {
    id: 9,
    name: 'PME industrielle → industrie',
    input: {
      sector: 'industrie',
      revenue: 8_000_000,
      ebitda: 900_000,
      growth: 3,
      recurring: 10,
      masseSalariale: 40,
    },
    expected: 'industrie',
  },
  {
    id: 10,
    name: 'SCI 5 appartements → patrimoine',
    input: {
      sector: 'patrimoine',
      revenue: 200_000,
      ebitda: 80_000,
      growth: 2,
      recurring: 95,
      masseSalariale: 5,
    },
    expected: 'patrimoine',
  },
  {
    id: 11,
    name: 'Domaine viticole → patrimoine_dominant',
    input: {
      sector: 'patrimoine',
      revenue: 500_000,
      ebitda: 30_000,
      growth: 0,
      recurring: 10,
      masseSalariale: 25,
    },
    expected: 'patrimoine_dominant',
  },
  {
    id: 12,
    name: 'Startup food delivery → deficit_structurel',
    input: {
      sector: 'tech',
      revenue: 6_000_000,
      ebitda: -1_500_000,
      growth: 12,
      recurring: 0,
      masseSalariale: 55,
    },
    expected: 'deficit_structurel',
  },
  {
    id: 13,
    name: 'Freelance dev senior → micro_solo',
    input: {
      sector: 'services',
      revenue: 180_000,
      ebitda: 120_000,
      growth: 5,
      recurring: 40,
      masseSalariale: 0,
    },
    expected: 'micro_solo',
  },
  {
    id: 14,
    name: 'Biotech pré-clinique → pre_revenue',
    input: {
      sector: 'biotech',
      revenue: 50_000,
      ebitda: -800_000,
      growth: 0,
      recurring: 0,
      masseSalariale: 70,
    },
    expected: 'pre_revenue',
  },
]

// -----------------------------------------------------------------------------
// Exécution des 14 cas du spreadsheet
// -----------------------------------------------------------------------------

console.log('\n🔀 Tests routing automatique (14 cas du spreadsheet)\n')

console.log('📋 Cas de test')

for (const tc of TEST_CASES) {
  test(`#${tc.id} ${tc.name}`, () => {
    const result = detectArchetype(tc.input)
    assertEqual(result, tc.expected, tc.name)
  })
}

// -----------------------------------------------------------------------------
// Tests de priorité P1 → P6
// -----------------------------------------------------------------------------

console.log('\n⚡ Priorités P1 → P6')

test('P1 > P3 : pre_revenue même si masse salariale > 60%', () => {
  const result = detectArchetype({
    sector: 'biotech',
    revenue: 0,
    ebitda: -500_000,
    growth: 0,
    recurring: 0,
    masseSalariale: 80,
  })
  assertEqual(result, 'pre_revenue', 'P1 devrait primer sur P3')
})

test('P1 > P2 : SaaS hyper prime sur micro (CA < 300K)', () => {
  const result = detectArchetype({
    sector: 'saas',
    revenue: 200_000,
    ebitda: -50_000,
    growth: 60,
    recurring: 90,
    masseSalariale: 20,
    hasMRR: true,
  })
  assertEqual(result, 'saas_hyper', 'P1 devrait primer sur P2 micro')
})

test('P2 > P3 : patrimoine prime sur masse salariale', () => {
  const result = detectArchetype({
    sector: 'patrimoine',
    revenue: 500_000,
    ebitda: 50_000,
    growth: 1,
    recurring: 80,
    masseSalariale: 65,
  })
  assertEqual(result, 'patrimoine', 'P2 patrimoine devrait primer sur P3 masse')
})

test('P2 > P4 : micro prime sur SaaS mature', () => {
  const result = detectArchetype({
    sector: 'saas',
    revenue: 100_000,
    ebitda: 30_000,
    growth: 15,
    recurring: 85,
    masseSalariale: 10,
    hasMRR: true,
  })
  assertEqual(result, 'micro_solo', 'P2 micro devrait primer sur P4 saas_mature')
})

test('P3 > P4 : déficit prime sur SaaS', () => {
  const result = detectArchetype({
    sector: 'saas',
    revenue: 2_000_000,
    ebitda: -300_000,
    growth: 10,
    recurring: 85,
    masseSalariale: 40,
    hasMRR: true,
  })
  assertEqual(result, 'deficit_structurel', 'P3 déficit devrait primer sur P4 SaaS')
})

test('P3 : commerce avec masse > 60% reste commerce_retail (pas masse_salariale)', () => {
  // Un commerce (restaurant, boulangerie…) avec une masse salariale élevée
  // reste un commerce — la masse élevée est structurelle pour ce secteur
  const result = detectArchetype({
    sector: 'commerce',
    revenue: 1_500_000,
    ebitda: 100_000,
    growth: 3,
    recurring: 10,
    masseSalariale: 70,
    hasPhysicalStore: true,
  })
  assertEqual(result, 'commerce_retail', 'Commerce avec masse élevée → commerce_retail')
})

test('P4 > P5 : SaaS déclin prime sur services récurrents', () => {
  const result = detectArchetype({
    sector: 'services',
    revenue: 2_000_000,
    ebitda: 400_000,
    growth: 2,
    recurring: 70,
    masseSalariale: 30,
    hasMRR: true,
  })
  assertEqual(result, 'saas_decline', 'P4 SaaS déclin devrait primer sur P5 services')
})

// -----------------------------------------------------------------------------
// Tests edge cases
// -----------------------------------------------------------------------------

console.log('\n🔬 Edge cases')

test('Revenue = 0 → pre_revenue (quel que soit le secteur)', () => {
  const result = detectArchetype({
    sector: 'industrie',
    revenue: 0,
    ebitda: -100_000,
    growth: 0,
    recurring: 0,
    masseSalariale: 0,
  })
  assertEqual(result, 'pre_revenue', 'Revenue 0 devrait toujours → pre_revenue')
})

test('Revenue négatif → pre_revenue', () => {
  const result = detectArchetype({
    sector: 'commerce',
    revenue: -50_000,
    ebitda: -200_000,
    growth: 0,
    recurring: 0,
    masseSalariale: 0,
  })
  assertEqual(result, 'pre_revenue', 'Revenue négatif → pre_revenue')
})

test('Secteur "deeptech" → pre_revenue même avec du CA', () => {
  const result = detectArchetype({
    sector: 'deeptech',
    revenue: 80_000,
    ebitda: -400_000,
    growth: 200,
    recurring: 0,
    masseSalariale: 50,
  })
  assertEqual(result, 'pre_revenue', 'Secteur deeptech → pre_revenue')
})

test('SaaS hyper à P1 : ebitda < 0 + growth > 40 + MRR', () => {
  const result = detectArchetype({
    sector: 'tech',
    revenue: 5_000_000,
    ebitda: -1_000_000,
    growth: 80,
    recurring: 95,
    masseSalariale: 50,
    hasMRR: true,
  })
  assertEqual(result, 'saas_hyper', 'Devrait match P1 saas_hyper')
})

// ── Tests Rule 10b : SaaS déclaré avec faible récurrence ──

test('SaaS sector + hasMRR + recurring faible (20%) + growth 50% → saas_hyper (Rule 10b)', () => {
  // Cas réel : app de rencontre SaaS, slider récurrence par défaut à 20%
  const result = detectArchetype({
    sector: 'saas',
    revenue: 2_000_000,
    ebitda: 60_000,
    growth: 50,
    recurring: 20,
    masseSalariale: 35,
    hasMRR: true,
  })
  assertEqual(result, 'saas_hyper', 'SaaS avec récurrence faible mais forte croissance')
})

test('SaaS sector + hasMRR + recurring faible (20%) + growth 15% → saas_mature (Rule 10b)', () => {
  const result = detectArchetype({
    sector: 'saas',
    revenue: 3_000_000,
    ebitda: 500_000,
    growth: 15,
    recurring: 20,
    masseSalariale: 30,
    hasMRR: true,
  })
  assertEqual(result, 'saas_mature', 'SaaS avec récurrence faible et croissance modérée')
})

test('SaaS sector + hasMRR + recurring faible (20%) + growth 2% → saas_decline (Rule 10b)', () => {
  const result = detectArchetype({
    sector: 'saas',
    revenue: 2_000_000,
    ebitda: 300_000,
    growth: 2,
    recurring: 20,
    masseSalariale: 40,
    hasMRR: true,
  })
  assertEqual(result, 'saas_decline', 'SaaS avec récurrence faible et faible croissance')
})

test('SaaS sector + recurring faible SANS hasMRR → NE match PAS Rule 10b (fallback)', () => {
  // Sans hasMRR, même avec sector=saas, Rule 10b ne s'applique pas
  const result = detectArchetype({
    sector: 'saas',
    revenue: 2_000_000,
    ebitda: 200_000,
    growth: 50,
    recurring: 20,
    masseSalariale: 35,
  })
  // Sans hasMRR → pas de match SaaS, tombe en fallback conseil
  assertEqual(result, 'conseil', 'SaaS sans hasMRR ne devrait pas matcher Rule 10b')
})

test('SaaS sans MRR explicite ne match pas SaaS (recurring > 60 → services_recurrents)', () => {
  const result = detectArchetype({
    sector: 'tech',
    revenue: 3_000_000,
    ebitda: 500_000,
    growth: 20,
    recurring: 85,
    masseSalariale: 30,
    // hasMRR omis → false : pas de match SaaS en P4
    // recurring > 60 → tombe en P5 services_recurrents
  })
  assertEqual(result, 'services_recurrents', 'Sans hasMRR, récurrence > 60 → services_recurrents')
})

test('SaaS growth = 5 exactement → saas_mature (pas decline)', () => {
  const result = detectArchetype({
    sector: 'saas',
    revenue: 4_000_000,
    ebitda: 800_000,
    growth: 5,
    recurring: 85,
    masseSalariale: 30,
    hasMRR: true,
  })
  assertEqual(result, 'saas_mature', 'growth=5 devrait être saas_mature')
})

test('SaaS growth = 4.9 → saas_decline', () => {
  const result = detectArchetype({
    sector: 'saas',
    revenue: 4_000_000,
    ebitda: 800_000,
    growth: 4.9,
    recurring: 85,
    masseSalariale: 30,
    hasMRR: true,
  })
  assertEqual(result, 'saas_decline', 'growth=4.9 devrait être saas_decline')
})

test('SaaS growth = 40 exactement → saas_mature (pas hyper)', () => {
  const result = detectArchetype({
    sector: 'saas',
    revenue: 5_000_000,
    ebitda: 500_000,
    growth: 40,
    recurring: 90,
    masseSalariale: 25,
    hasMRR: true,
  })
  assertEqual(result, 'saas_mature', 'growth=40 devrait être saas_mature (P4 rule 9)')
})

test('Patrimoine avec recurring 50 exactement → patrimoine_dominant', () => {
  const result = detectArchetype({
    sector: 'patrimoine',
    revenue: 400_000,
    ebitda: 50_000,
    growth: 1,
    recurring: 50,
    masseSalariale: 10,
  })
  assertEqual(result, 'patrimoine_dominant', 'recurring=50 devrait être patrimoine_dominant (>50 requis)')
})

test('Patrimoine avec recurring 51 → patrimoine', () => {
  const result = detectArchetype({
    sector: 'patrimoine',
    revenue: 400_000,
    ebitda: 50_000,
    growth: 1,
    recurring: 51,
    masseSalariale: 10,
  })
  assertEqual(result, 'patrimoine', 'recurring=51 devrait être patrimoine')
})

test('Masse salariale 60 exactement ne déclenche pas P3', () => {
  const result = detectArchetype({
    sector: 'services',
    revenue: 2_000_000,
    ebitda: 200_000,
    growth: 5,
    recurring: 30,
    masseSalariale: 60,
  })
  // 60 n'est pas > 60, donc pas masse_salariale_lourde
  // Sector 'services' → services_recurrents
  assertEqual(result, 'services_recurrents', 'masse=60 ne devrait pas matcher (>60 requis)')
})

test('Masse salariale 61 déclenche P3', () => {
  const result = detectArchetype({
    sector: 'services',
    revenue: 2_000_000,
    ebitda: 200_000,
    growth: 5,
    recurring: 30,
    masseSalariale: 61,
  })
  assertEqual(result, 'masse_salariale_lourde', 'masse=61 devrait matcher')
})

test('CA = 299999 → micro_solo', () => {
  const result = detectArchetype({
    sector: 'services',
    revenue: 299_999,
    ebitda: 50_000,
    growth: 10,
    recurring: 20,
    masseSalariale: 10,
  })
  assertEqual(result, 'micro_solo', 'CA juste sous 300K → micro')
})

test('CA = 300000 ne déclenche pas micro', () => {
  const result = detectArchetype({
    sector: 'services',
    revenue: 300_000,
    ebitda: 50_000,
    growth: 10,
    recurring: 20,
    masseSalariale: 10,
  })
  // 300K n'est pas < 300K, sector 'services' → services_recurrents
  assertEqual(result, 'services_recurrents', 'CA=300K ne devrait pas être micro (< 300K requis)')
})

test('Secteur "e-commerce" (avec tiret) → ecommerce', () => {
  const result = detectArchetype({
    sector: 'e-commerce',
    revenue: 2_000_000,
    ebitda: 200_000,
    growth: 15,
    recurring: 10,
    masseSalariale: 20,
  })
  assertEqual(result, 'ecommerce', 'e-commerce avec tiret devrait matcher')
})

test('Secteur "ESN" → conseil', () => {
  const result = detectArchetype({
    sector: 'esn',
    revenue: 3_000_000,
    ebitda: 400_000,
    growth: 8,
    recurring: 25,
    masseSalariale: 50,
  })
  assertEqual(result, 'conseil', 'ESN devrait router vers conseil')
})

test('Secteur "restaurant" → commerce_retail', () => {
  const result = detectArchetype({
    sector: 'restaurant',
    revenue: 600_000,
    ebitda: 80_000,
    growth: 3,
    recurring: 5,
    masseSalariale: 35,
  })
  assertEqual(result, 'commerce_retail', 'Restaurant devrait router vers commerce_retail')
})

test('Secteur "btp" → industrie', () => {
  const result = detectArchetype({
    sector: 'btp',
    revenue: 5_000_000,
    ebitda: 500_000,
    growth: 4,
    recurring: 15,
    masseSalariale: 45,
  })
  assertEqual(result, 'industrie', 'BTP devrait router vers industrie')
})

test('Secteur "SCI" → patrimoine (case-insensitive)', () => {
  const result = detectArchetype({
    sector: 'SCI',
    revenue: 150_000,
    ebitda: 60_000,
    growth: 1,
    recurring: 90,
    masseSalariale: 5,
  })
  assertEqual(result, 'patrimoine', 'SCI devrait router vers patrimoine')
})

test('Fallback : secteur inconnu sans métriques distinctives → conseil', () => {
  const result = detectArchetype({
    sector: 'autre',
    revenue: 1_000_000,
    ebitda: 100_000,
    growth: 5,
    recurring: 20,
    masseSalariale: 40,
  })
  assertEqual(result, 'conseil', 'Secteur inconnu devrait tomber en fallback conseil')
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
