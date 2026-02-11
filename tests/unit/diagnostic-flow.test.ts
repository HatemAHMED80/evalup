// Tests unitaires pour le flow diagnostic → archétype → résultat
// Vérifie que tous les chemins produisent des archétypes valides
// Usage : npx tsx tests/unit/diagnostic-flow.test.ts

import { detectArchetype, ARCHETYPES } from '../../src/lib/valuation/archetypes'
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

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

// =============================================================================
// SECTION 1 : Chaque type d'activité du formulaire → archétype valide
// =============================================================================
// Reproduit exactement ce que l'API fait : activityType → sector + flags → detectArchetype
// Avec les valeurs par défaut des sliders du formulaire

console.log('\n🧪 Flow diagnostic : types d\'activité → archétypes valides')
console.log('─'.repeat(60))

const FORM_ACTIVITY_TYPES = [
  { id: 'saas', label: 'SaaS / Logiciel' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'conseil', label: 'Conseil / Services' },
  { id: 'services', label: 'Services récurrents' },
  { id: 'commerce', label: 'Commerce / Retail' },
  { id: 'industrie', label: 'Industrie / BTP' },
  { id: 'immobilier', label: 'Immobilier' },
]

// Valeurs par défaut des sliders du formulaire diagnostic
const DEFAULT_SLIDERS = {
  growth: 15,
  recurring: 20,
  masseSalariale: 35,
}

// Variations de revenue/EBITDA pour couvrir les edge cases
const REVENUE_VARIATIONS = [
  { revenue: 100_000, ebitda: 10_000, label: 'micro (100K)' },
  { revenue: 500_000, ebitda: 50_000, label: 'petite (500K)' },
  { revenue: 2_000_000, ebitda: 200_000, label: 'PME (2M)' },
  { revenue: 10_000_000, ebitda: 1_000_000, label: 'ETI (10M)' },
]

for (const actType of FORM_ACTIVITY_TYPES) {
  for (const rev of REVENUE_VARIATIONS) {
    test(`${actType.label} ${rev.label} → archétype valide`, () => {
      // Reproduit la logique de l'API route /api/diagnostic
      const input: DiagnosticInput = {
        sector: actType.id,
        revenue: rev.revenue,
        ebitda: rev.ebitda,
        growth: DEFAULT_SLIDERS.growth,
        recurring: DEFAULT_SLIDERS.recurring,
        masseSalariale: DEFAULT_SLIDERS.masseSalariale,
        hasPhysicalStore: ['commerce', 'industrie'].includes(actType.id),
        hasMRR: ['saas', 'marketplace'].includes(actType.id),
      }

      const archetypeId = detectArchetype(input)

      // L'archétype retourné DOIT exister dans ARCHETYPES
      assert(
        archetypeId in ARCHETYPES,
        `detectArchetype retourne "${archetypeId}" pour ${actType.id}/${rev.label} mais ARCHETYPES["${archetypeId}"] n'existe pas`
      )

      // L'archétype doit avoir un id, name, icon, color
      const arch = ARCHETYPES[archetypeId]
      assert(!!arch.id, `Archétype "${archetypeId}" manque id`)
      assert(!!arch.name, `Archétype "${archetypeId}" manque name`)
      assert(!!arch.icon, `Archétype "${archetypeId}" manque icon`)
      assert(!!arch.color, `Archétype "${archetypeId}" manque color`)
      assert(!!arch.primaryMethod, `Archétype "${archetypeId}" manque primaryMethod`)
    })
  }
}

// =============================================================================
// SECTION 2 : Edge cases EBITDA négatif (toutes les activités)
// =============================================================================

console.log('\n🧪 Edge cases : EBITDA négatif')
console.log('─'.repeat(60))

for (const actType of FORM_ACTIVITY_TYPES) {
  test(`${actType.label} avec EBITDA négatif → archétype valide`, () => {
    const input: DiagnosticInput = {
      sector: actType.id,
      revenue: 1_000_000,
      ebitda: -100_000,
      growth: DEFAULT_SLIDERS.growth,
      recurring: DEFAULT_SLIDERS.recurring,
      masseSalariale: DEFAULT_SLIDERS.masseSalariale,
      hasPhysicalStore: ['commerce', 'industrie'].includes(actType.id),
      hasMRR: ['saas', 'marketplace'].includes(actType.id),
    }

    const archetypeId = detectArchetype(input)
    assert(
      archetypeId in ARCHETYPES,
      `EBITDA négatif : "${archetypeId}" n'existe pas dans ARCHETYPES`
    )
  })
}

// =============================================================================
// SECTION 3 : Edge cases sliders extrêmes
// =============================================================================

console.log('\n🧪 Edge cases : sliders extrêmes')
console.log('─'.repeat(60))

const SLIDER_EXTREMES = [
  { growth: -30, recurring: 0, masseSalariale: 0, label: 'tout au minimum' },
  { growth: 100, recurring: 100, masseSalariale: 90, label: 'tout au maximum' },
  { growth: 0, recurring: 0, masseSalariale: 90, label: 'masse salariale max' },
  { growth: 100, recurring: 0, masseSalariale: 0, label: 'croissance max seule' },
  { growth: 0, recurring: 100, masseSalariale: 0, label: 'récurrence max seule' },
]

for (const actType of FORM_ACTIVITY_TYPES) {
  for (const sliders of SLIDER_EXTREMES) {
    test(`${actType.label} + ${sliders.label} → archétype valide`, () => {
      const input: DiagnosticInput = {
        sector: actType.id,
        revenue: 2_000_000,
        ebitda: 200_000,
        growth: sliders.growth,
        recurring: sliders.recurring,
        masseSalariale: sliders.masseSalariale,
        hasPhysicalStore: ['commerce', 'industrie'].includes(actType.id),
        hasMRR: ['saas', 'marketplace'].includes(actType.id),
      }

      const archetypeId = detectArchetype(input)
      assert(
        archetypeId in ARCHETYPES,
        `Sliders extrêmes "${sliders.label}" : "${archetypeId}" n'existe pas dans ARCHETYPES`
      )
    })
  }
}

// =============================================================================
// SECTION 4 : Cas spécial revenue = 0 et immobilier
// =============================================================================

console.log('\n🧪 Cas spéciaux')
console.log('─'.repeat(60))

test('Revenue = 0 → pre_revenue (archétype valide)', () => {
  const input: DiagnosticInput = {
    sector: 'saas',
    revenue: 0,
    ebitda: -50_000,
    growth: 0,
    recurring: 0,
    masseSalariale: 0,
    hasMRR: true,
  }
  const id = detectArchetype(input)
  assert(id === 'pre_revenue', `Attendu pre_revenue, obtenu ${id}`)
  assert(id in ARCHETYPES, `"${id}" n'existe pas dans ARCHETYPES`)
})

test('Immobilier avec récurrence → patrimoine (archétype valide)', () => {
  const input: DiagnosticInput = {
    sector: 'immobilier',
    revenue: 500_000,
    ebitda: 200_000,
    growth: 2,
    recurring: 80,
    masseSalariale: 5,
  }
  const id = detectArchetype(input)
  assert(id === 'patrimoine', `Attendu patrimoine, obtenu ${id}`)
  assert(id in ARCHETYPES, `"${id}" n'existe pas dans ARCHETYPES`)
})

test('Secteur totalement inconnu → archétype valide (pas de crash)', () => {
  const input: DiagnosticInput = {
    sector: 'xyz_inconnu_123',
    revenue: 1_000_000,
    ebitda: 100_000,
    growth: 10,
    recurring: 30,
    masseSalariale: 40,
  }
  const id = detectArchetype(input)
  assert(id in ARCHETYPES, `Secteur inconnu : "${id}" n'existe pas dans ARCHETYPES`)
})

// =============================================================================
// SECTION 5 : Tous les archétypes ont les champs requis pour la page résultat
// =============================================================================

console.log('\n🧪 Intégrité des archétypes (page résultat)')
console.log('─'.repeat(60))

for (const [id, arch] of Object.entries(ARCHETYPES)) {
  test(`Archétype "${id}" a tous les champs pour la page résultat`, () => {
    assert(!!arch.name, 'manque name')
    assert(!!arch.icon, 'manque icon')
    assert(!!arch.color, 'manque color')
    assert(!!arch.primaryMethod, 'manque primaryMethod')
    assert(!!arch.secondaryMethod, 'manque secondaryMethod')
    assert(!!arch.whyThisMethod, 'manque whyThisMethod')
    assert(!!arch.metricBase, 'manque metricBase')
    assert(Array.isArray(arch.commonMistakes), 'commonMistakes pas un array')
    assert(arch.commonMistakes.length >= 1, 'commonMistakes vide')
    assert(Array.isArray(arch.keyFactors), 'keyFactors pas un array')
    assert(arch.keyFactors.length >= 1, 'keyFactors vide')
    assert(Array.isArray(arch.reportIncludes), 'reportIncludes pas un array')
    assert(arch.reportIncludes.length >= 1, 'reportIncludes vide')

    // Vérifier que chaque CommonMistake a les bons champs
    for (const m of arch.commonMistakes) {
      assert(!!m.mistake, `commonMistakes[].mistake manquant pour ${id}`)
      assert(!!m.impact, `commonMistakes[].impact manquant pour ${id}`)
      assert(!!m.icon, `commonMistakes[].icon manquant pour ${id}`)
    }

    // Vérifier que chaque KeyFactor a les bons champs
    for (const f of arch.keyFactors) {
      assert(!!f.factor, `keyFactors[].factor manquant pour ${id}`)
      assert(!!f.impact, `keyFactors[].impact manquant pour ${id}`)
      assert(f.direction === 'up' || f.direction === 'down', `keyFactors[].direction invalide pour ${id}`)
    }
  })
}

// =============================================================================
// SECTION 6 : Auth callback redirect whitelist
// =============================================================================

console.log('\n🧪 Auth callback redirect whitelist')
console.log('─'.repeat(60))

// Reproduit la logique de isValidRedirect dans /api/auth/callback
const ALLOWED_REDIRECT_PREFIXES = ['/app', '/compte', '/chat', '/tarifs', '/aide', '/checkout', '/diagnostic', '/evaluation']

function isValidRedirect(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false
  return ALLOWED_REDIRECT_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '?'))
}

const REQUIRED_REDIRECTS = [
  '/checkout?plan=eval_complete&archetype=saas_hyper&siren=123456789',
  '/diagnostic/result?archetype=services_recurrents',
  '/diagnostic/result?archetype=conseil',
  '/evaluation/abc-123/upload?payment=success',
  '/app',
  '/compte',
  '/chat/123456789',
  '/tarifs',
]

for (const path of REQUIRED_REDIRECTS) {
  test(`Redirect "${path}" est autorisé`, () => {
    assert(isValidRedirect(path), `"${path}" devrait être autorisé par isValidRedirect`)
  })
}

const BLOCKED_REDIRECTS = [
  '//evil.com',
  'https://evil.com',
  '/admin',
  '/api/stripe/webhooks',
  '',
]

for (const path of BLOCKED_REDIRECTS) {
  test(`Redirect "${path}" est bloqué`, () => {
    assert(!isValidRedirect(path), `"${path}" ne devrait PAS être autorisé`)
  })
}

// =============================================================================
// Résumé
// =============================================================================

console.log('\n' + '═'.repeat(60))
console.log(`✅ ${passed} passés | ❌ ${failed} échoués | Total: ${passed + failed}`)

if (failures.length > 0) {
  console.log('\n🔴 Échecs :')
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`))
}

console.log('═'.repeat(60) + '\n')

process.exit(failed > 0 ? 1 : 0)
