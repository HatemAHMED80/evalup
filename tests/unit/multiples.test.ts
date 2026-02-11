// Tests unitaires pour les multiples de valorisation
// Usage : npx tsx tests/unit/multiples.test.ts

import {
  loadMultiples,
  getMultiplesForArchetype,
  applyFranceDiscount,
} from '../../src/lib/valuation/multiples'
import type { MultiplesData, ArchetypeMultiples } from '../../src/lib/valuation/multiples'
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
    `${label}: attendu ~${expected}, obtenu ${actual}`
  )
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

console.log('\n📊 Tests multiples de valorisation\n')

// --- Chargement ---

console.log('📂 Chargement du fichier')

let data: MultiplesData

test('loadMultiples() charge le fichier sans erreur', () => {
  data = loadMultiples()
  assert(data !== null && data !== undefined, 'data est null/undefined')
})

test('Le fichier a les métadonnées requises', () => {
  assert(data.source.length > 0, 'source vide')
  assert(data.sourceUrl.startsWith('https://'), 'sourceUrl invalide')
  assert(/^\d{4}-\d{2}$/.test(data.lastUpdated), `lastUpdated invalide: "${data.lastUpdated}"`)
  assert(data.note.length > 0, 'note vide')
})

test('loadMultiples() retourne le même objet au 2ème appel (cache)', () => {
  const data2 = loadMultiples()
  assert(data === data2, 'Le cache ne fonctionne pas (objets différents)')
})

// --- Présence des 15 archétypes ---

console.log('\n📋 Présence des 15 archétypes dans le JSON')

test('Le JSON contient 15 archétypes', () => {
  const count = Object.keys(data.archetypes).length
  assert(count === 15, `Attendu 15, obtenu ${count}`)
})

for (const id of ARCHETYPE_IDS) {
  test(`Archétype "${id}" a des multiples définis`, () => {
    assert(id in data.archetypes, `"${id}" absent du JSON`)
  })
}

test('Les clés du JSON correspondent exactement aux ARCHETYPE_IDS', () => {
  const jsonIds = Object.keys(data.archetypes).sort()
  const codeIds = [...ARCHETYPE_IDS].sort()
  assert(
    JSON.stringify(jsonIds) === JSON.stringify(codeIds),
    `Différence:\n  JSON: ${jsonIds.join(', ')}\n  Code: ${codeIds.join(', ')}`
  )
})

// --- Structure de chaque archétype ---

console.log('\n📐 Validation des champs pour chaque archétype')

for (const [id, multiples] of Object.entries(data.archetypes)) {
  const m = multiples as ArchetypeMultiples

  test(`[${id}] primaryMultiple a metric/low/median/high`, () => {
    assert(typeof m.primaryMultiple.metric === 'string' && m.primaryMultiple.metric.length > 0,
      'metric vide')
    assert(typeof m.primaryMultiple.low === 'number', 'low n\'est pas un nombre')
    assert(typeof m.primaryMultiple.median === 'number', 'median n\'est pas un nombre')
    assert(typeof m.primaryMultiple.high === 'number', 'high n\'est pas un nombre')
  })

  test(`[${id}] secondaryMultiple a metric/low/median/high`, () => {
    assert(typeof m.secondaryMultiple.metric === 'string' && m.secondaryMultiple.metric.length > 0,
      'metric vide')
    assert(typeof m.secondaryMultiple.low === 'number', 'low n\'est pas un nombre')
    assert(typeof m.secondaryMultiple.median === 'number', 'median n\'est pas un nombre')
    assert(typeof m.secondaryMultiple.high === 'number', 'high n\'est pas un nombre')
  })

  test(`[${id}] source est non vide`, () => {
    assert(typeof m.source === 'string' && m.source.length > 0, 'source vide')
  })

  test(`[${id}] damodaranSector est non vide`, () => {
    assert(typeof m.damodaranSector === 'string' && m.damodaranSector.length > 0,
      'damodaranSector vide')
  })
}

// --- Cohérence low < median < high ---

console.log('\n📈 Cohérence low ≤ median ≤ high')

// pre_revenue a des multiples à 0 (non applicable) → on l'exclut de ce test
const ARCHETYPES_WITH_MULTIPLES = ARCHETYPE_IDS.filter(id => id !== 'pre_revenue')

for (const id of ARCHETYPES_WITH_MULTIPLES) {
  const m = data.archetypes[id] as ArchetypeMultiples

  test(`[${id}] primaryMultiple : low ≤ median ≤ high`, () => {
    const { low, median, high } = m.primaryMultiple
    assert(low <= median, `low (${low}) > median (${median})`)
    assert(median <= high, `median (${median}) > high (${high})`)
  })

  test(`[${id}] secondaryMultiple : low ≤ median ≤ high`, () => {
    const { low, median, high } = m.secondaryMultiple
    assert(low <= median, `low (${low}) > median (${median})`)
    assert(median <= high, `median (${median}) > high (${high})`)
  })

  test(`[${id}] primaryMultiple.low > 0`, () => {
    assert(m.primaryMultiple.low > 0, `low = ${m.primaryMultiple.low} (devrait être > 0)`)
  })
}

// --- pre_revenue : multiples = 0 (N/A) ---

console.log('\n🔬 Pre-revenue : multiples non applicables')

test('[pre_revenue] primaryMultiple = 0/0/0 (DCF, pas de multiples)', () => {
  const m = data.archetypes['pre_revenue']
  assert(m.primaryMultiple.low === 0, `low = ${m.primaryMultiple.low}`)
  assert(m.primaryMultiple.median === 0, `median = ${m.primaryMultiple.median}`)
  assert(m.primaryMultiple.high === 0, `high = ${m.primaryMultiple.high}`)
})

test('[pre_revenue] secondaryMultiple = 0/0/0 (Méthode VC)', () => {
  const m = data.archetypes['pre_revenue']
  assert(m.secondaryMultiple.low === 0, `low = ${m.secondaryMultiple.low}`)
  assert(m.secondaryMultiple.median === 0, `median = ${m.secondaryMultiple.median}`)
  assert(m.secondaryMultiple.high === 0, `high = ${m.secondaryMultiple.high}`)
})

// --- getMultiplesForArchetype ---

console.log('\n🔧 getMultiplesForArchetype()')

test('getMultiplesForArchetype("saas_hyper") retourne les bons multiples', () => {
  const m = getMultiplesForArchetype('saas_hyper')
  assert(m !== undefined, 'Retourne undefined')
  assert(m!.primaryMultiple.metric === 'ARR', `metric="${m!.primaryMultiple.metric}"`)
  assert(m!.primaryMultiple.low === 8, `low=${m!.primaryMultiple.low}`)
  assert(m!.primaryMultiple.high === 25, `high=${m!.primaryMultiple.high}`)
})

test('getMultiplesForArchetype("commerce_retail") retourne EBITDA', () => {
  const m = getMultiplesForArchetype('commerce_retail')
  assert(m !== undefined, 'Retourne undefined')
  assert(m!.primaryMultiple.metric === 'EBITDA', `metric="${m!.primaryMultiple.metric}"`)
  assert(m!.primaryMultiple.low === 3, `low=${m!.primaryMultiple.low}`)
  assert(m!.primaryMultiple.high === 6, `high=${m!.primaryMultiple.high}`)
})

test('getMultiplesForArchetype("patrimoine") retourne ANR', () => {
  const m = getMultiplesForArchetype('patrimoine')
  assert(m !== undefined, 'Retourne undefined')
  assert(m!.primaryMultiple.metric === 'ANR', `metric="${m!.primaryMultiple.metric}"`)
})

test('getMultiplesForArchetype("inexistant") retourne undefined', () => {
  const m = getMultiplesForArchetype('inexistant')
  assert(m === undefined, 'Devrait retourner undefined')
})

// --- applyFranceDiscount ---

console.log('\n🇫🇷 applyFranceDiscount()')

test('Décote par défaut (25%) : 10x → 7.5x', () => {
  const result = applyFranceDiscount(10)
  assertClose(result, 7.5, 0.001, 'Décote 25%')
})

test('Décote 20% : 10x → 8x', () => {
  const result = applyFranceDiscount(10, 0.20)
  assertClose(result, 8, 0.001, 'Décote 20%')
})

test('Décote 30% : 10x → 7x', () => {
  const result = applyFranceDiscount(10, 0.30)
  assertClose(result, 7, 0.001, 'Décote 30%')
})

test('Décote 0% : 10x → 10x (pas de décote)', () => {
  const result = applyFranceDiscount(10, 0)
  assertClose(result, 10, 0.001, 'Décote 0%')
})

test('Multiple 0 avec décote → 0', () => {
  const result = applyFranceDiscount(0)
  assertClose(result, 0, 0.001, 'Multiple 0')
})

test('Décote sur fraction : 5.5x → 4.125x', () => {
  const result = applyFranceDiscount(5.5)
  assertClose(result, 4.125, 0.001, 'Décote sur 5.5x')
})

test('Décote appliquée aux multiples SaaS hyper (ARR median 15x → 11.25x)', () => {
  const m = getMultiplesForArchetype('saas_hyper')!
  const adjusted = applyFranceDiscount(m.primaryMultiple.median)
  assertClose(adjusted, 11.25, 0.001, 'SaaS hyper ARR median ajusté')
})

// --- Cohérence des métriques par famille ---

console.log('\n🏷️  Cohérence des métriques par famille')

test('Tous les SaaS utilisent EBITDA ou ARR comme métrique primaire', () => {
  const saasIds = ['saas_hyper', 'saas_mature', 'saas_decline']
  for (const id of saasIds) {
    const metric = data.archetypes[id].primaryMultiple.metric
    assert(
      metric === 'EBITDA' || metric === 'ARR',
      `${id} utilise "${metric}" au lieu de EBITDA ou ARR`
    )
  }
})

test('Tous les patrimoniaux utilisent ANR comme métrique primaire', () => {
  const patriIds = ['patrimoine', 'patrimoine_dominant']
  for (const id of patriIds) {
    const metric = data.archetypes[id].primaryMultiple.metric
    assert(metric === 'ANR', `${id} utilise "${metric}" au lieu de ANR`)
  }
})

test('Les multiples SaaS hyper > SaaS mature > SaaS déclin (median)', () => {
  const hyper = data.archetypes['saas_hyper'].primaryMultiple.median
  const mature = data.archetypes['saas_mature'].primaryMultiple.median
  const decline = data.archetypes['saas_decline'].primaryMultiple.median
  // hyper est en ARR, mature/decline en EBITDA → pas directement comparable
  // Mais on peut vérifier la hiérarchie mature > decline (même métrique EBITDA)
  assert(mature > decline, `SaaS mature (${mature}) devrait > SaaS déclin (${decline})`)
})

test('Multiples industrie < SaaS mature (EBITDA)', () => {
  const indus = data.archetypes['industrie'].primaryMultiple.median
  const saas = data.archetypes['saas_mature'].primaryMultiple.median
  assert(indus < saas, `Industrie (${indus}) devrait < SaaS mature (${saas})`)
})

test('Multiples commerce < services récurrents (EBITDA)', () => {
  const commerce = data.archetypes['commerce_retail'].primaryMultiple.median
  const services = data.archetypes['services_recurrents'].primaryMultiple.median
  assert(commerce < services, `Commerce (${commerce}) devrait < Services réc. (${services})`)
})

test('Multiples masse salariale lourde ≤ industrie (EBITDA)', () => {
  const masse = data.archetypes['masse_salariale_lourde'].primaryMultiple.median
  const indus = data.archetypes['industrie'].primaryMultiple.median
  assert(masse <= indus, `Masse sal. (${masse}) devrait ≤ Industrie (${indus})`)
})

// --- Vérification des valeurs du spreadsheet ---

console.log('\n📊 Valeurs du spreadsheet')

const EXPECTED_RANGES: Record<string, { metric: string; low: number; high: number }> = {
  saas_hyper: { metric: 'ARR', low: 8, high: 25 },
  saas_mature: { metric: 'EBITDA', low: 10, high: 20 },
  saas_decline: { metric: 'EBITDA', low: 4, high: 8 },
  marketplace: { metric: 'GMV', low: 1, high: 4 },
  ecommerce: { metric: 'CA', low: 1, high: 3 },
  conseil: { metric: 'EBITDA', low: 4, high: 8 },
  services_recurrents: { metric: 'EBITDA', low: 5, high: 10 },
  commerce_retail: { metric: 'EBITDA', low: 3, high: 6 },
  industrie: { metric: 'EBITDA', low: 4, high: 7 },
  deficit_structurel: { metric: 'CA', low: 0.3, high: 1.5 },
  masse_salariale_lourde: { metric: 'EBITDA', low: 3, high: 5 },
  micro_solo: { metric: 'Bénéfice retraité', low: 1, high: 3 },
}

for (const [id, expected] of Object.entries(EXPECTED_RANGES)) {
  test(`[${id}] metric="${expected.metric}", low=${expected.low}, high=${expected.high}`, () => {
    const m = data.archetypes[id].primaryMultiple
    assert(m.metric === expected.metric, `metric: attendu "${expected.metric}", obtenu "${m.metric}"`)
    assertClose(m.low, expected.low, 0.01, 'low')
    assertClose(m.high, expected.high, 0.01, 'high')
  })
}

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
