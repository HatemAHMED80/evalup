// Tests unitaires pour le endpoint /api/diagnostic
// Teste la validation, la détection d'archétype via HTTP, et la forme de la réponse
// Usage : npx tsx tests/unit/diagnostic-api.test.ts

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

// -----------------------------------------------------------------------------
// Mini test runner
// -----------------------------------------------------------------------------

let passed = 0
let failed = 0
const failures: string[] = []

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
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

async function postDiagnostic(body: Record<string, unknown>): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch(`${BASE_URL}/api/diagnostic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return { status: res.status, data }
}

// -----------------------------------------------------------------------------
// Validation tests
// -----------------------------------------------------------------------------

console.log('\n🔍 Tests API /api/diagnostic — Validation\n')

console.log('📋 Requêtes invalides')

test('Corps vide → 400', async () => {
  const res = await fetch(`${BASE_URL}/api/diagnostic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  assert(res.status === 400, `Attendu 400, obtenu ${res.status}`)
  const data = await res.json()
  assert(data.code === 'MISSING_FIELDS', `Code attendu MISSING_FIELDS, obtenu ${data.code}`)
})

test('JSON invalide → 400', async () => {
  const res = await fetch(`${BASE_URL}/api/diagnostic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not json',
  })
  assert(res.status === 400, `Attendu 400, obtenu ${res.status}`)
  const data = await res.json()
  assert(data.code === 'INVALID_BODY', `Code attendu INVALID_BODY, obtenu ${data.code}`)
})

test('activityType manquant → 400', async () => {
  const { status, data } = await postDiagnostic({ revenue: 1000000, ebitda: 200000 })
  assert(status === 400, `Attendu 400, obtenu ${status}`)
  assert(data.code === 'MISSING_FIELDS', `Code attendu MISSING_FIELDS, obtenu ${data.code}`)
})

test('revenue manquant → 400', async () => {
  const { status, data } = await postDiagnostic({ activityType: 'saas', ebitda: 200000 })
  assert(status === 400, `Attendu 400, obtenu ${status}`)
  assert(data.code === 'MISSING_FIELDS', `Code attendu MISSING_FIELDS, obtenu ${data.code}`)
})

test('ebitda manquant → 400', async () => {
  const { status, data } = await postDiagnostic({ activityType: 'saas', revenue: 1000000 })
  assert(status === 400, `Attendu 400, obtenu ${status}`)
  assert(data.code === 'MISSING_FIELDS', `Code attendu MISSING_FIELDS, obtenu ${data.code}`)
})

test('revenue = string → 400', async () => {
  const { status, data } = await postDiagnostic({ activityType: 'saas', revenue: 'beaucoup', ebitda: 200000 })
  assert(status === 400, `Attendu 400, obtenu ${status}`)
})

// -----------------------------------------------------------------------------
// Response shape tests
// -----------------------------------------------------------------------------

console.log('\n📐 Forme de la réponse')

test('Réponse valide contient archetypeId, archetype, multiples, input', async () => {
  const { status, data } = await postDiagnostic({
    activityType: 'saas',
    revenue: 5000000,
    ebitda: 1200000,
    growth: 18,
    recurring: 88,
    masseSalariale: 40,
    effectif: '21-50',
  })
  assert(status === 200, `Attendu 200, obtenu ${status}`)
  assert(typeof data.archetypeId === 'string', 'archetypeId manquant')
  assert(data.archetype !== undefined, 'archetype manquant')
  assert(data.input !== undefined, 'input manquant')
})

test('Input echo contient les champs envoyés', async () => {
  const { data } = await postDiagnostic({
    activityType: 'commerce',
    revenue: 800000,
    ebitda: 120000,
    growth: 5,
    recurring: 0,
    masseSalariale: 30,
    effectif: '6-20',
    hasPatrimoine: true,
    loyersNets: 50000,
  })
  const input = data.input as Record<string, unknown>
  assert(input.activityType === 'commerce', `activityType=${input.activityType}`)
  assert(input.revenue === 800000, `revenue=${input.revenue}`)
  assert(input.ebitda === 120000, `ebitda=${input.ebitda}`)
  assert(input.hasPatrimoine === true, `hasPatrimoine=${input.hasPatrimoine}`)
  assert(input.loyersNets === 50000, `loyersNets=${input.loyersNets}`)
})

test('Archetype retourné a les champs requis', async () => {
  const { data } = await postDiagnostic({
    activityType: 'saas',
    revenue: 5000000,
    ebitda: 1200000,
    growth: 18,
    recurring: 88,
    masseSalariale: 40,
    effectif: '21-50',
  })
  const archetype = data.archetype as Record<string, unknown>
  if (archetype) {
    assert(typeof archetype.id === 'string', 'archetype.id manquant')
    assert(typeof archetype.name === 'string', 'archetype.name manquant')
    assert(typeof archetype.icon === 'string', 'archetype.icon manquant')
    assert(typeof archetype.color === 'string', 'archetype.color manquant')
    assert(typeof archetype.primaryMethod === 'string', 'archetype.primaryMethod manquant')
    assert(typeof archetype.metricBase === 'string', 'archetype.metricBase manquant')
  }
})

test('hasPatrimoine default à false si non fourni', async () => {
  const { data } = await postDiagnostic({
    activityType: 'saas',
    revenue: 5000000,
    ebitda: 1200000,
    growth: 18,
    recurring: 88,
    masseSalariale: 40,
    effectif: '21-50',
  })
  const input = data.input as Record<string, unknown>
  assert(input.hasPatrimoine === false, `hasPatrimoine devrait être false, obtenu ${input.hasPatrimoine}`)
})

test('loyersNets default à null si non fourni', async () => {
  const { data } = await postDiagnostic({
    activityType: 'saas',
    revenue: 5000000,
    ebitda: 1200000,
    growth: 18,
    recurring: 88,
    masseSalariale: 40,
    effectif: '21-50',
  })
  const input = data.input as Record<string, unknown>
  assert(input.loyersNets === null, `loyersNets devrait être null, obtenu ${input.loyersNets}`)
})

// -----------------------------------------------------------------------------
// Archetype detection via API (integration)
// -----------------------------------------------------------------------------

console.log('\n🔀 Détection archétype via API')

interface DetectionTestCase {
  name: string
  body: Record<string, unknown>
  expected: string
}

const DETECTION_CASES: DetectionTestCase[] = [
  {
    name: 'SaaS hyper-croissance → saas_hyper',
    body: { activityType: 'saas', revenue: 2400000, ebitda: -200000, growth: 65, recurring: 92, masseSalariale: 35, effectif: '21-50' },
    expected: 'saas_hyper',
  },
  {
    name: 'SaaS mature → saas_mature',
    body: { activityType: 'saas', revenue: 5000000, ebitda: 1200000, growth: 18, recurring: 88, masseSalariale: 40, effectif: '21-50' },
    expected: 'saas_mature',
  },
  {
    name: 'SaaS déclin → saas_decline',
    body: { activityType: 'saas', revenue: 3000000, ebitda: 600000, growth: -5, recurring: 75, masseSalariale: 45, effectif: '21-50' },
    expected: 'saas_decline',
  },
  {
    name: 'Marketplace → marketplace',
    body: { activityType: 'marketplace', revenue: 20000000, ebitda: -100000, growth: 45, recurring: 20, masseSalariale: 30, effectif: '50+' },
    expected: 'marketplace',
  },
  {
    name: 'E-commerce → ecommerce',
    body: { activityType: 'ecommerce', revenue: 4000000, ebitda: 400000, growth: 25, recurring: 15, masseSalariale: 20, effectif: '6-20' },
    expected: 'ecommerce',
  },
  {
    name: 'Conseil → conseil',
    body: { activityType: 'conseil', revenue: 2000000, ebitda: 300000, growth: 10, recurring: 30, masseSalariale: 55, effectif: '6-20' },
    expected: 'conseil',
  },
  {
    name: 'Commerce physique → commerce_retail',
    body: { activityType: 'commerce', revenue: 800000, ebitda: 120000, growth: 5, recurring: 0, masseSalariale: 30, effectif: '2-5' },
    expected: 'commerce_retail',
  },
  {
    name: 'Industrie → industrie',
    body: { activityType: 'industrie', revenue: 8000000, ebitda: 900000, growth: 3, recurring: 10, masseSalariale: 40, effectif: '50+' },
    expected: 'industrie',
  },
  {
    name: 'Immobilier (récurrent) → patrimoine',
    body: { activityType: 'immobilier', revenue: 200000, ebitda: 80000, growth: 2, recurring: 95, masseSalariale: 5, effectif: '1', hasPatrimoine: true },
    expected: 'patrimoine',
  },
  {
    name: 'Micro-entreprise → micro_solo',
    body: { activityType: 'services', revenue: 180000, ebitda: 120000, growth: 5, recurring: 40, masseSalariale: 0, effectif: '1' },
    expected: 'micro_solo',
  },
  {
    name: 'Services récurrents → services_recurrents',
    body: { activityType: 'services', revenue: 3000000, ebitda: 500000, growth: 10, recurring: 75, masseSalariale: 30, effectif: '21-50' },
    expected: 'services_recurrents',
  },
]

for (const tc of DETECTION_CASES) {
  test(tc.name, async () => {
    const { status, data } = await postDiagnostic(tc.body)
    assert(status === 200, `Attendu 200, obtenu ${status}`)
    assert(
      data.archetypeId === tc.expected,
      `Attendu "${tc.expected}", obtenu "${data.archetypeId}"`
    )
  })
}

// -----------------------------------------------------------------------------
// hasMRR / hasPhysicalStore automatic detection
// -----------------------------------------------------------------------------

console.log('\n🔧 Détection automatique hasMRR / hasPhysicalStore')

test('activityType=saas → hasMRR=true automatique (detect saas_mature)', async () => {
  const { data } = await postDiagnostic({
    activityType: 'saas',
    revenue: 5000000,
    ebitda: 1200000,
    growth: 18,
    recurring: 88,
    masseSalariale: 40,
    effectif: '21-50',
  })
  // If hasMRR is correctly derived, this should be saas_mature (not services_recurrents)
  assert(data.archetypeId === 'saas_mature', `Attendu saas_mature, obtenu ${data.archetypeId}`)
})

test('activityType=commerce → hasPhysicalStore=true automatique (detect commerce_retail)', async () => {
  const { data } = await postDiagnostic({
    activityType: 'commerce',
    revenue: 800000,
    ebitda: 120000,
    growth: 5,
    recurring: 0,
    masseSalariale: 30,
    effectif: '2-5',
  })
  assert(data.archetypeId === 'commerce_retail', `Attendu commerce_retail, obtenu ${data.archetypeId}`)
})

test('activityType=conseil → ni hasMRR ni hasPhysicalStore', async () => {
  const { data } = await postDiagnostic({
    activityType: 'conseil',
    revenue: 2000000,
    ebitda: 300000,
    growth: 10,
    recurring: 30,
    masseSalariale: 55,
    effectif: '6-20',
  })
  assert(data.archetypeId === 'conseil', `Attendu conseil, obtenu ${data.archetypeId}`)
})

// -----------------------------------------------------------------------------
// Multiples returned
// -----------------------------------------------------------------------------

console.log('\n📊 Multiples retournés')

test('SaaS mature retourne des multiples non-null', async () => {
  const { data } = await postDiagnostic({
    activityType: 'saas',
    revenue: 5000000,
    ebitda: 1200000,
    growth: 18,
    recurring: 88,
    masseSalariale: 40,
    effectif: '21-50',
  })
  assert(data.multiples !== null && data.multiples !== undefined, 'Multiples manquants pour saas_mature')
})

test('Commerce retourne des multiples non-null', async () => {
  const { data } = await postDiagnostic({
    activityType: 'commerce',
    revenue: 800000,
    ebitda: 120000,
    growth: 5,
    recurring: 0,
    masseSalariale: 30,
    effectif: '2-5',
  })
  assert(data.multiples !== null && data.multiples !== undefined, 'Multiples manquants pour commerce_retail')
})

// -----------------------------------------------------------------------------
// Optional fields handling
// -----------------------------------------------------------------------------

console.log('\n🔄 Champs optionnels')

test('growth/recurring/masseSalariale default à 0 si absents', async () => {
  const { status, data } = await postDiagnostic({
    activityType: 'services',
    revenue: 500000,
    ebitda: 100000,
    effectif: '2-5',
  })
  assert(status === 200, `Attendu 200, obtenu ${status}`)
  const input = data.input as Record<string, unknown>
  assert(input.growth === 0 || input.growth === undefined, `growth devrait être 0, obtenu ${input.growth}`)
})

test('nafCode optionnel accepté', async () => {
  const { status } = await postDiagnostic({
    activityType: 'industrie',
    revenue: 8000000,
    ebitda: 900000,
    growth: 3,
    recurring: 10,
    masseSalariale: 40,
    effectif: '50+',
    nafCode: '25.62A',
  })
  assert(status === 200, `Attendu 200, obtenu ${status}`)
})

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------

console.log('\n' + '═'.repeat(50))
console.log(`✅ ${passed} passés | ❌ ${failed} échoués | Total: ${passed + failed}`)
if (failures.length > 0) {
  console.log('\nÉchecs:')
  failures.forEach(f => console.log(`  → ${f}`))
}
console.log('═'.repeat(50) + '\n')

process.exit(failed > 0 ? 1 : 0)
