// Tests de routing : chaque cas benchmark passe dans detectArchetype()
// + cas métier courants (cabinet comptable, coiffeur, hôtel, etc.)
// Usage : npx tsx tests/unit/routing-benchmark.test.ts

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

function assertOneOf(actual: string, allowed: string[], context: string) {
  if (!allowed.includes(actual)) {
    throw new Error(`${context} — obtenu "${actual}", attendu un de [${allowed.join(', ')}]`)
  }
}

// -----------------------------------------------------------------------------
// PARTIE 1 : Les 28 cas benchmark mappés en DiagnosticInput
// -----------------------------------------------------------------------------

console.log('\n🎯 Routing des 28 cas benchmark\n')

// ── Damodaran ─────────────────────────────────────────────────────────────────

console.log('📊 Damodaran')

test('DAM-001 Con Ed (Utilities) → services_recurrents ou industrie', () => {
  // Utility stable, revenus récurrents (électricité), grande entreprise
  const result = detectArchetype({
    sector: 'énergie',
    revenue: 10_000_000_000,
    ebitda: 2_000_000_000,
    growth: 2,
    recurring: 85,
    masseSalariale: 25,
  })
  assertOneOf(result, ['services_recurrents', 'industrie'], 'Con Ed')
})

test('DAM-002 3M Pre-Crisis (Industrial) → industrie', () => {
  const result = detectArchetype({
    sector: 'industrie',
    revenue: 24_462_000_000,
    ebitda: 5_344_000_000,
    growth: 7,
    recurring: 30,
    masseSalariale: 35,
  })
  assertEqual(result, 'industrie', '3M Pre-Crisis')
})

test('DAM-003 3M Post-Crisis (Industrial) → industrie', () => {
  const result = detectArchetype({
    sector: 'manufacturing',
    revenue: 24_462_000_000,
    ebitda: 4_892_000_000,
    growth: 5,
    recurring: 30,
    masseSalariale: 35,
  })
  assertEqual(result, 'industrie', '3M Post-Crisis')
})

// ── Vernimmen ─────────────────────────────────────────────────────────────────

console.log('\n📘 Vernimmen')

test('VER-001 MEDICA (EHPAD / Santé) → services_recurrents', () => {
  // Cliniques/EHPAD : revenus récurrents (séjours long terme)
  const result = detectArchetype({
    sector: 'santé',
    revenue: 525_000_000,
    ebitda: 83_000_000,
    growth: 8,
    recurring: 90,
    masseSalariale: 55,
  })
  assertEqual(result, 'services_recurrents', 'MEDICA')
})

test('VER-002 ASF (Autoroutes) → services_recurrents', () => {
  // Concession autoroutière : revenus de péage ultra-récurrents
  const result = detectArchetype({
    sector: 'infrastructure',
    revenue: 1_929_000_000,
    ebitda: 1_150_000_000,
    growth: 4,
    recurring: 98,
    masseSalariale: 15,
  })
  assertEqual(result, 'services_recurrents', 'ASF')
})

test('VER-003 Pirelli (Pneumatiques) → industrie', () => {
  const result = detectArchetype({
    sector: 'industrie',
    revenue: 4_976_000_000,
    ebitda: 844_000_000,
    growth: 5,
    recurring: 15,
    masseSalariale: 35,
  })
  assertEqual(result, 'industrie', 'Pirelli')
})

test('VER-004 SYCOM (Assemblage industriel) → industrie', () => {
  const result = detectArchetype({
    sector: 'industrie',
    revenue: 9_000_000,
    ebitda: 900_000,
    growth: 8,
    recurring: 20,
    masseSalariale: 40,
  })
  assertEqual(result, 'industrie', 'SYCOM')
})

test('VER-005 MAB (Immobilier commercial) → patrimoine', () => {
  const result = detectArchetype({
    sector: 'immobilier',
    revenue: 11_000_000,
    ebitda: 5_000_000,
    growth: 2,
    recurring: 95,
    masseSalariale: 5,
  })
  assertEqual(result, 'patrimoine', 'MAB')
})

test('VER-006 Europcar (Location véhicules) → services_recurrents', () => {
  const result = detectArchetype({
    sector: 'location',
    revenue: 784_000_000,
    ebitda: 100_000_000,
    growth: 5,
    recurring: 40,
    masseSalariale: 30,
  })
  assertOneOf(result, ['services_recurrents', 'commerce_retail'], 'Europcar')
})

test('VER-007 EPC (Explosifs chimiques) → industrie', () => {
  const result = detectArchetype({
    sector: 'industrie',
    revenue: 500_000_000,
    ebitda: 50_000_000,
    growth: 5,
    recurring: 30,
    masseSalariale: 40,
  })
  assertEqual(result, 'industrie', 'EPC')
})

// ── Thauvron — Cas avec entreprises réelles ───────────────────────────────────

console.log('\n📕 Thauvron (entreprises réelles)')

test('THA-001 AOMP (Mécanique industrielle) → industrie', () => {
  const result = detectArchetype({
    sector: 'industrie',
    revenue: 3_992_000,
    ebitda: 484_000,
    growth: 5,
    recurring: 20,
    masseSalariale: 24, // 910K / 3992K ≈ 23%
  })
  assertEqual(result, 'industrie', 'AOMP')
})

test('THA-002 Saint Gobain (Matériaux construction) → industrie', () => {
  const result = detectArchetype({
    sector: 'btp',
    revenue: 30_000_000_000,
    ebitda: 3_000_000_000,
    growth: 3,
    recurring: 15,
    masseSalariale: 35,
  })
  assertEqual(result, 'industrie', 'Saint Gobain')
})

test('THA-003 Danone (Agroalimentaire) → industrie', () => {
  const result = detectArchetype({
    sector: 'agroalimentaire',
    revenue: 20_000_000_000,
    ebitda: 3_500_000_000,
    growth: 4,
    recurring: 30,
    masseSalariale: 25,
  })
  assertEqual(result, 'industrie', 'Danone')
})

test('THA-006 Eiffage (BTP) → industrie', () => {
  const result = detectArchetype({
    sector: 'btp',
    revenue: 7_697_000_000,
    ebitda: 340_000_000,
    growth: 5,
    recurring: 20,
    masseSalariale: 40,
  })
  assertEqual(result, 'industrie', 'Eiffage')
})

test('THA-013 Eiffage Multiples (BTP) → industrie', () => {
  const result = detectArchetype({
    sector: 'btp',
    revenue: 7_697_000_000,
    ebitda: 285_000_000,
    growth: 5,
    recurring: 20,
    masseSalariale: 40,
  })
  assertEqual(result, 'industrie', 'Eiffage Multiples')
})

test('THA-014 Hermes (Luxe/Retail) → commerce_retail', () => {
  // Hermès a des boutiques physiques (luxe retail)
  const result = detectArchetype({
    sector: 'luxe',
    revenue: 4_183_000_000,
    ebitda: 917_000_000,
    growth: 8,
    recurring: 20,
    masseSalariale: 25,
    hasPhysicalStore: true,
  })
  assertEqual(result, 'commerce_retail', 'Hermes')
})

// ── Thauvron — Cas pédagogiques (secteur implicite) ──────────────────────────

console.log('\n📕 Thauvron (cas pédagogiques)')

test('THA-012 Hospitalières Saint Gervais (Clinique) → services_recurrents', () => {
  const result = detectArchetype({
    sector: 'santé',
    revenue: 50_000_000,
    ebitda: 5_000_000,
    growth: 5,
    recurring: 80,
    masseSalariale: 55,
  })
  assertEqual(result, 'services_recurrents', 'Hospitalières Saint Gervais')
})

test('THA-017 RDC Mine d\'or → industrie', () => {
  const result = detectArchetype({
    sector: 'extraction',
    revenue: 15_000_000,
    ebitda: 4_840_000,
    growth: 0,
    recurring: 10,
    masseSalariale: 30,
  })
  assertEqual(result, 'industrie', 'RDC Mine d\'or')
})

// =============================================================================
// PARTIE 2 : Cas métier courants français
// Un cabinet comptable ne doit PAS tomber dans "industrie"
// =============================================================================

console.log('\n\n🇫🇷 Routing des métiers courants français\n')

// ── Services intellectuels → conseil ──────────────────────────────────────────

console.log('🧠 Professions intellectuelles')

test('Cabinet comptable → conseil (PAS industrie)', () => {
  const result = detectArchetype({
    sector: 'expert-comptable',
    revenue: 2_500_000,
    ebitda: 400_000,
    growth: 5,
    recurring: 40,
    masseSalariale: 55,
  })
  assertEqual(result, 'conseil', 'Cabinet comptable')
})

test('Cabinet d\'avocats → conseil', () => {
  const result = detectArchetype({
    sector: 'avocat',
    revenue: 1_500_000,
    ebitda: 350_000,
    growth: 3,
    recurring: 30,
    masseSalariale: 50,
  })
  assertEqual(result, 'conseil', 'Cabinet d\'avocats')
})

test('Cabinet d\'architecte → conseil', () => {
  const result = detectArchetype({
    sector: 'architecte',
    revenue: 800_000,
    ebitda: 150_000,
    growth: 5,
    recurring: 15,
    masseSalariale: 45,
  })
  assertEqual(result, 'conseil', 'Cabinet d\'architecte')
})

test('Agence de communication → conseil', () => {
  const result = detectArchetype({
    sector: 'communication',
    revenue: 1_200_000,
    ebitda: 200_000,
    growth: 10,
    recurring: 25,
    masseSalariale: 50,
  })
  assertEqual(result, 'conseil', 'Agence de communication')
})

test('Agence web / digitale → conseil', () => {
  const result = detectArchetype({
    sector: 'agence web',
    revenue: 600_000,
    ebitda: 120_000,
    growth: 15,
    recurring: 30,
    masseSalariale: 50,
  })
  assertEqual(result, 'conseil', 'Agence web')
})

test('Bureau d\'études → conseil', () => {
  const result = detectArchetype({
    sector: 'bureau d\'études',
    revenue: 3_000_000,
    ebitda: 400_000,
    growth: 5,
    recurring: 20,
    masseSalariale: 55,
  })
  assertEqual(result, 'conseil', 'Bureau d\'études')
})

test('Formateur indépendant → conseil', () => {
  const result = detectArchetype({
    sector: 'formation',
    revenue: 400_000,
    ebitda: 100_000,
    growth: 8,
    recurring: 30,
    masseSalariale: 20,
  })
  assertEqual(result, 'conseil', 'Formateur indépendant')
})

// ── Commerce physique → commerce_retail ───────────────────────────────────────

console.log('\n🏬 Commerce physique')

test('Coiffeur → commerce_retail', () => {
  const result = detectArchetype({
    sector: 'coiffeur',
    revenue: 350_000,
    ebitda: 60_000,
    growth: 2,
    recurring: 50,
    masseSalariale: 45,
    hasPhysicalStore: true,
  })
  assertEqual(result, 'commerce_retail', 'Coiffeur')
})

test('Salon esthétique → commerce_retail', () => {
  const result = detectArchetype({
    sector: 'esthétique',
    revenue: 400_000,
    ebitda: 80_000,
    growth: 5,
    recurring: 40,
    masseSalariale: 35,
    hasPhysicalStore: true,
  })
  assertEqual(result, 'commerce_retail', 'Salon esthétique')
})

test('Garage automobile → commerce_retail', () => {
  const result = detectArchetype({
    sector: 'garage',
    revenue: 600_000,
    ebitda: 90_000,
    growth: 2,
    recurring: 20,
    masseSalariale: 30,
    hasPhysicalStore: true,
  })
  assertEqual(result, 'commerce_retail', 'Garage automobile')
})

test('Hôtel → commerce_retail', () => {
  const result = detectArchetype({
    sector: 'hôtel',
    revenue: 1_200_000,
    ebitda: 200_000,
    growth: 3,
    recurring: 10,
    masseSalariale: 40,
    hasPhysicalStore: true,
  })
  assertEqual(result, 'commerce_retail', 'Hôtel')
})

test('Fleuriste → commerce_retail', () => {
  const result = detectArchetype({
    sector: 'fleuriste',
    revenue: 350_000,
    ebitda: 40_000,
    growth: 1,
    recurring: 5,
    masseSalariale: 25,
    hasPhysicalStore: true,
  })
  assertEqual(result, 'commerce_retail', 'Fleuriste')
})

test('Opticien → commerce_retail', () => {
  const result = detectArchetype({
    sector: 'opticien',
    revenue: 500_000,
    ebitda: 100_000,
    growth: 3,
    recurring: 10,
    masseSalariale: 30,
    hasPhysicalStore: true,
  })
  assertEqual(result, 'commerce_retail', 'Opticien')
})

test('Caviste → commerce_retail', () => {
  const result = detectArchetype({
    sector: 'caviste',
    revenue: 400_000,
    ebitda: 60_000,
    growth: 5,
    recurring: 10,
    masseSalariale: 15,
    hasPhysicalStore: true,
  })
  assertEqual(result, 'commerce_retail', 'Caviste')
})

// ── Industrie / Manufacturing ─────────────────────────────────────────────────

console.log('\n🏭 Industrie')

test('Agroalimentaire → industrie', () => {
  const result = detectArchetype({
    sector: 'agroalimentaire',
    revenue: 5_000_000,
    ebitda: 400_000,
    growth: 3,
    recurring: 20,
    masseSalariale: 35,
  })
  assertEqual(result, 'industrie', 'Agroalimentaire')
})

test('Imprimerie → industrie', () => {
  const result = detectArchetype({
    sector: 'imprimerie',
    revenue: 2_000_000,
    ebitda: 200_000,
    growth: -2,
    recurring: 30,
    masseSalariale: 40,
  })
  assertEqual(result, 'industrie', 'Imprimerie')
})

test('Menuiserie industrielle → industrie', () => {
  const result = detectArchetype({
    sector: 'menuiserie',
    revenue: 1_500_000,
    ebitda: 180_000,
    growth: 3,
    recurring: 15,
    masseSalariale: 45,
  })
  assertEqual(result, 'industrie', 'Menuiserie')
})

test('Extraction / Carrière → industrie', () => {
  const result = detectArchetype({
    sector: 'extraction',
    revenue: 4_000_000,
    ebitda: 600_000,
    growth: 1,
    recurring: 10,
    masseSalariale: 30,
  })
  assertEqual(result, 'industrie', 'Extraction/Carrière')
})

// ── Patrimoine ────────────────────────────────────────────────────────────────

console.log('\n🏛️ Patrimoine')

test('Agence immobilière (PAS patrimoine) → conseil', () => {
  // Une agence immobilière est un service, pas une société patrimoniale
  const result = detectArchetype({
    sector: 'agence immobilière',
    revenue: 800_000,
    ebitda: 150_000,
    growth: 5,
    recurring: 20,
    masseSalariale: 40,
  })
  assertEqual(result, 'conseil', 'Agence immobilière')
})

test('Foncière → patrimoine', () => {
  const result = detectArchetype({
    sector: 'fonciere',
    revenue: 3_000_000,
    ebitda: 2_000_000,
    growth: 2,
    recurring: 95,
    masseSalariale: 5,
  })
  assertEqual(result, 'patrimoine', 'Foncière')
})

test('Holding familiale → patrimoine_dominant', () => {
  const result = detectArchetype({
    sector: 'holding',
    revenue: 500_000,
    ebitda: 100_000,
    growth: 1,
    recurring: 30,
    masseSalariale: 5,
  })
  assertEqual(result, 'patrimoine_dominant', 'Holding familiale')
})

// ── Masse salariale lourde ────────────────────────────────────────────────────

console.log('\n👷 Masse salariale lourde')

test('Entreprise de nettoyage → masse_salariale_lourde', () => {
  const result = detectArchetype({
    sector: 'nettoyage',
    revenue: 2_000_000,
    ebitda: 150_000,
    growth: 3,
    recurring: 80,
    masseSalariale: 72,
  })
  assertEqual(result, 'masse_salariale_lourde', 'Nettoyage')
})

test('Société de gardiennage → masse_salariale_lourde', () => {
  const result = detectArchetype({
    sector: 'sécurité',
    revenue: 5_000_000,
    ebitda: 300_000,
    growth: 4,
    recurring: 85,
    masseSalariale: 75,
  })
  assertEqual(result, 'masse_salariale_lourde', 'Gardiennage')
})

test('Aide à domicile → masse_salariale_lourde', () => {
  const result = detectArchetype({
    sector: 'aide à domicile',
    revenue: 1_500_000,
    ebitda: 80_000,
    growth: 10,
    recurring: 70,
    masseSalariale: 80,
  })
  assertEqual(result, 'masse_salariale_lourde', 'Aide à domicile')
})

// ── Services récurrents ───────────────────────────────────────────────────────

console.log('\n🔄 Services récurrents')

test('Entreprise paysagiste (contrats entretien) → services_recurrents', () => {
  const result = detectArchetype({
    sector: 'paysagiste',
    revenue: 800_000,
    ebitda: 100_000,
    growth: 5,
    recurring: 65,
    masseSalariale: 55,
  })
  assertEqual(result, 'services_recurrents', 'Paysagiste')
})

test('Maintenance informatique (contrats) → services_recurrents', () => {
  const result = detectArchetype({
    sector: 'informatique',
    revenue: 1_000_000,
    ebitda: 200_000,
    growth: 8,
    recurring: 70,
    masseSalariale: 40,
  })
  assertEqual(result, 'services_recurrents', 'Maintenance informatique')
})

// ── Cas limites / Pièges ──────────────────────────────────────────────────────

console.log('\n⚠️ Cas limites / Pièges')

test('Cabinet comptable avec masse salariale > 60% → conseil (PAS masse_salariale_lourde)', () => {
  // Un cabinet comptable avec 15 salariés : masse salariale 65% du CA
  // Le secteur "conseil" devrait primer sur la règle P3 masse_salariale
  // MAIS actuellement P3 (masse > 60%) passe AVANT P5 (secteur conseil)
  // C'est un BUG : un cabinet comptable n'est pas un business "masse salariale lourde"
  const result = detectArchetype({
    sector: 'expert-comptable',
    revenue: 2_000_000,
    ebitda: 300_000,
    growth: 3,
    recurring: 40,
    masseSalariale: 65,
  })
  // Note : si masse > 60% → P3 s'active AVANT P5 secteur
  // Le secteur expert-comptable doit être reconnu en P4/P5 OU
  // la logique P3 doit exclure les professions libérales
  assertEqual(result, 'conseil', 'Cabinet comptable masse lourde')
})

test('Restaurant gastronomique (masse sal. 65%) → commerce_retail (PAS masse_sal)', () => {
  // Un restaurant étoilé avec une grosse équipe cuisine
  // C'est un commerce de restauration, pas un archétype "masse salariale"
  const result = detectArchetype({
    sector: 'restaurant',
    revenue: 1_500_000,
    ebitda: 120_000,
    growth: 5,
    recurring: 5,
    masseSalariale: 65,
  })
  // Même piège : P3 (masse > 60%) passe avant P5 (restaurant)
  assertEqual(result, 'commerce_retail', 'Restaurant gastronomique')
})

test('Hôtel-restaurant (masse sal. 55%, récurrence faible) → commerce_retail', () => {
  const result = detectArchetype({
    sector: 'hôtellerie',
    revenue: 3_000_000,
    ebitda: 350_000,
    growth: 3,
    recurring: 15,
    masseSalariale: 55,
  })
  assertEqual(result, 'commerce_retail', 'Hôtel-restaurant')
})

test('Clinique vétérinaire → commerce_retail ou conseil', () => {
  const result = detectArchetype({
    sector: 'vétérinaire',
    revenue: 600_000,
    ebitda: 120_000,
    growth: 5,
    recurring: 30,
    masseSalariale: 40,
    hasPhysicalStore: true,
  })
  assertOneOf(result, ['commerce_retail', 'conseil'], 'Clinique vétérinaire')
})

test('Crèche privée → services_recurrents', () => {
  const result = detectArchetype({
    sector: 'crèche',
    revenue: 500_000,
    ebitda: 50_000,
    growth: 5,
    recurring: 90,
    masseSalariale: 70,
  })
  // Récurrence forte (places réservées) + masse salariale
  // masse > 60% → P3 pourrait s'activer
  // MAIS recurring > 60 → on voudrait services_recurrents
  assertOneOf(result, ['services_recurrents', 'masse_salariale_lourde'], 'Crèche privée')
})

test('Auto-école → commerce_retail', () => {
  const result = detectArchetype({
    sector: 'auto-école',
    revenue: 400_000,
    ebitda: 60_000,
    growth: 2,
    recurring: 20,
    masseSalariale: 45,
    hasPhysicalStore: true,
  })
  assertEqual(result, 'commerce_retail', 'Auto-école')
})

// -----------------------------------------------------------------------------
// Résumé
// -----------------------------------------------------------------------------

console.log('\n' + '═'.repeat(60))
console.log(`✅ ${passed} passés | ❌ ${failed} échoués | Total: ${passed + failed}`)
if (failures.length > 0) {
  console.log('\nÉchecs détaillés:')
  failures.forEach(f => console.log(`  → ${f}`))
}
console.log('═'.repeat(60) + '\n')

process.exit(failed > 0 ? 1 : 0)
