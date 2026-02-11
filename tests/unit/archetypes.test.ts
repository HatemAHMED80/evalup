// Tests unitaires pour les archétypes de valorisation
// Usage : npx tsx tests/unit/archetypes.test.ts

import { ARCHETYPES, ARCHETYPE_IDS, getArchetype, getAllArchetypes } from '../../src/lib/valuation/archetypes'
import type { Archetype } from '../../src/lib/valuation/archetypes'

// -----------------------------------------------------------------------------
// Mini test runner (pas de dépendance externe)
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
    failed++
    const msg = e instanceof Error ? e.message : String(e)
    failures.push(`${name}: ${msg}`)
    console.log(`  ❌ ${name}`)
    console.log(`     → ${msg}`)
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function assertNonEmpty(value: unknown, field: string) {
  if (typeof value === 'string') {
    assert(value.trim().length > 0, `"${field}" est vide`)
  } else if (Array.isArray(value)) {
    assert(value.length > 0, `"${field}" est un tableau vide`)
  } else {
    assert(value !== undefined && value !== null, `"${field}" est undefined/null`)
  }
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

const EXPECTED_IDS = [
  'saas_hyper',
  'saas_mature',
  'saas_decline',
  'marketplace',
  'ecommerce',
  'conseil',
  'services_recurrents',
  'commerce_retail',
  'industrie',
  'patrimoine',
  'patrimoine_dominant',
  'deficit_structurel',
  'masse_salariale_lourde',
  'micro_solo',
  'pre_revenue',
]

console.log('\n🏗️  Tests archétypes de valorisation\n')

// --- Présence des 15 archétypes ---

console.log('📋 Présence des 15 archétypes')

test('ARCHETYPES contient exactement 15 entrées', () => {
  assert(Object.keys(ARCHETYPES).length === 15, `Attendu 15, obtenu ${Object.keys(ARCHETYPES).length}`)
})

test('ARCHETYPE_IDS contient 15 IDs', () => {
  assert(ARCHETYPE_IDS.length === 15, `Attendu 15, obtenu ${ARCHETYPE_IDS.length}`)
})

for (const id of EXPECTED_IDS) {
  test(`Archétype "${id}" existe`, () => {
    assert(id in ARCHETYPES, `"${id}" absent de ARCHETYPES`)
  })
}

// --- Champs requis pour chaque archétype ---

console.log('\n📐 Validation des champs pour chaque archétype')

for (const [id, archetype] of Object.entries(ARCHETYPES)) {
  const a = archetype as Archetype

  test(`[${id}] id correspond à la clé`, () => {
    assert(a.id === id, `id="${a.id}" ≠ clé="${id}"`)
  })

  test(`[${id}] name est non vide`, () => {
    assertNonEmpty(a.name, 'name')
  })

  test(`[${id}] icon est un emoji`, () => {
    assertNonEmpty(a.icon, 'icon')
    assert(a.icon.length <= 4, `icon trop long: "${a.icon}"`)
  })

  test(`[${id}] color est un hex valide`, () => {
    assert(/^#[0-9A-Fa-f]{6}$/.test(a.color), `color invalide: "${a.color}"`)
  })

  test(`[${id}] primaryMethod est non vide`, () => {
    assertNonEmpty(a.primaryMethod, 'primaryMethod')
  })

  test(`[${id}] secondaryMethod est non vide`, () => {
    assertNonEmpty(a.secondaryMethod, 'secondaryMethod')
  })

  test(`[${id}] metricBase est non vide`, () => {
    assertNonEmpty(a.metricBase, 'metricBase')
  })

  test(`[${id}] whyThisMethod est non vide (> 50 chars)`, () => {
    assertNonEmpty(a.whyThisMethod, 'whyThisMethod')
    assert(a.whyThisMethod.length > 50, `whyThisMethod trop court (${a.whyThisMethod.length} chars)`)
  })

  // --- commonMistakes ---

  test(`[${id}] commonMistakes a au moins 2 erreurs`, () => {
    assert(a.commonMistakes.length >= 2, `Seulement ${a.commonMistakes.length} erreur(s)`)
  })

  for (let i = 0; i < a.commonMistakes.length; i++) {
    const cm = a.commonMistakes[i]
    test(`[${id}] commonMistakes[${i}] a mistake/impact/icon`, () => {
      assertNonEmpty(cm.mistake, `commonMistakes[${i}].mistake`)
      assertNonEmpty(cm.impact, `commonMistakes[${i}].impact`)
      assertNonEmpty(cm.icon, `commonMistakes[${i}].icon`)
    })
  }

  // --- keyFactors ---

  test(`[${id}] keyFactors a au moins 4 facteurs`, () => {
    assert(a.keyFactors.length >= 4, `Seulement ${a.keyFactors.length} facteur(s)`)
  })

  test(`[${id}] keyFactors contient des "up" et des "down"`, () => {
    const ups = a.keyFactors.filter(f => f.direction === 'up')
    const downs = a.keyFactors.filter(f => f.direction === 'down')
    assert(ups.length > 0, 'Aucun facteur "up"')
    assert(downs.length > 0, 'Aucun facteur "down"')
  })

  for (let i = 0; i < a.keyFactors.length; i++) {
    const kf = a.keyFactors[i]
    test(`[${id}] keyFactors[${i}] a factor/impact/direction valide`, () => {
      assertNonEmpty(kf.factor, `keyFactors[${i}].factor`)
      assertNonEmpty(kf.impact, `keyFactors[${i}].impact`)
      assert(kf.direction === 'up' || kf.direction === 'down', `direction invalide: "${kf.direction}"`)
    })
  }

  // --- reportIncludes ---

  test(`[${id}] reportIncludes a au moins 3 éléments`, () => {
    assert(a.reportIncludes.length >= 3, `Seulement ${a.reportIncludes.length} élément(s)`)
  })

  for (let i = 0; i < a.reportIncludes.length; i++) {
    test(`[${id}] reportIncludes[${i}] est non vide`, () => {
      assertNonEmpty(a.reportIncludes[i], `reportIncludes[${i}]`)
    })
  }

  // --- requiredDataFlash ---

  test(`[${id}] requiredDataFlash a au moins 2 éléments`, () => {
    assert(a.requiredDataFlash.length >= 2, `Seulement ${a.requiredDataFlash.length} élément(s)`)
  })

  for (let i = 0; i < a.requiredDataFlash.length; i++) {
    test(`[${id}] requiredDataFlash[${i}] est non vide`, () => {
      assertNonEmpty(a.requiredDataFlash[i], `requiredDataFlash[${i}]`)
    })
  }

  // --- requiredDataComplete ---

  test(`[${id}] requiredDataComplete a au moins 2 éléments`, () => {
    assert(a.requiredDataComplete.length >= 2, `Seulement ${a.requiredDataComplete.length} élément(s)`)
  })

  for (let i = 0; i < a.requiredDataComplete.length; i++) {
    test(`[${id}] requiredDataComplete[${i}] est non vide`, () => {
      assertNonEmpty(a.requiredDataComplete[i], `requiredDataComplete[${i}]`)
    })
  }
}

// --- Helpers ---

console.log('\n🔧 Helpers')

test('getArchetype("saas_hyper") retourne le bon archétype', () => {
  const a = getArchetype('saas_hyper')
  assert(a !== undefined, 'Retourne undefined')
  assert(a!.name === 'SaaS Hyper-croissance', `name="${a!.name}"`)
})

test('getArchetype("inexistant") retourne undefined', () => {
  const a = getArchetype('inexistant')
  assert(a === undefined, 'Devrait retourner undefined')
})

test('getAllArchetypes() retourne 15 archétypes', () => {
  const all = getAllArchetypes()
  assert(all.length === 15, `Attendu 15, obtenu ${all.length}`)
})

// --- Unicité ---

console.log('\n🔑 Unicité')

test('Tous les IDs sont uniques', () => {
  const ids = Object.keys(ARCHETYPES)
  const unique = new Set(ids)
  assert(ids.length === unique.size, `Doublons détectés: ${ids.length} clés, ${unique.size} uniques`)
})

test('Tous les noms sont uniques', () => {
  const names = Object.values(ARCHETYPES).map(a => (a as Archetype).name)
  const unique = new Set(names)
  assert(names.length === unique.size, `Noms en double détectés`)
})

test('Toutes les couleurs sont uniques', () => {
  const colors = Object.values(ARCHETYPES).map(a => (a as Archetype).color)
  const unique = new Set(colors)
  assert(colors.length === unique.size, `Couleurs en double: ${colors.filter((c, i) => colors.indexOf(c) !== i).join(', ')}`)
})

// --- Résumé ---

console.log('\n' + '═'.repeat(50))
console.log(`✅ ${passed} passés | ❌ ${failed} échoués | Total: ${passed + failed}`)
if (failures.length > 0) {
  console.log('\nÉchecs:')
  failures.forEach(f => console.log(`  → ${f}`))
}
console.log('═'.repeat(50) + '\n')

process.exit(failed > 0 ? 1 : 0)
