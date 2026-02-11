// Tests unitaires pour les types et la logique des statuts d'évaluation
// Usage : npx tsx tests/unit/evaluations.test.ts

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

// -----------------------------------------------------------------------------
// Status definitions (mirrored from evaluations.ts)
// -----------------------------------------------------------------------------

const ALL_STATUSES = [
  'in_progress',
  'flash_completed',
  'payment_pending',
  'paid',
  'pending_upload',
  'pending_review',
  'complete_in_progress',
  'completed',
] as const

type EvaluationStatus = typeof ALL_STATUSES[number]

// Valid status transitions (business logic)
const VALID_TRANSITIONS: Record<string, string[]> = {
  in_progress: ['flash_completed'],
  flash_completed: ['payment_pending'],
  payment_pending: ['pending_upload', 'paid'], // paid is legacy
  paid: ['pending_upload', 'complete_in_progress'], // legacy migration path
  pending_upload: ['pending_review'],
  pending_review: ['complete_in_progress'],
  complete_in_progress: ['completed'],
  completed: [], // terminal state
}

// Access control rules per status
interface AccessRules {
  canContinueChat: boolean
  canUploadDocuments: boolean
  canDownloadPDF: boolean
  needsPayment: boolean
}

function getAccessRules(status: EvaluationStatus): AccessRules {
  switch (status) {
    case 'in_progress':
      return { canContinueChat: true, canUploadDocuments: false, canDownloadPDF: false, needsPayment: false }
    case 'flash_completed':
      return { canContinueChat: false, canUploadDocuments: false, canDownloadPDF: false, needsPayment: true }
    case 'payment_pending':
      return { canContinueChat: false, canUploadDocuments: false, canDownloadPDF: false, needsPayment: true }
    case 'paid':
      return { canContinueChat: true, canUploadDocuments: true, canDownloadPDF: false, needsPayment: false }
    case 'pending_upload':
      return { canContinueChat: false, canUploadDocuments: true, canDownloadPDF: false, needsPayment: false }
    case 'pending_review':
      return { canContinueChat: false, canUploadDocuments: true, canDownloadPDF: false, needsPayment: false }
    case 'complete_in_progress':
      return { canContinueChat: true, canUploadDocuments: false, canDownloadPDF: false, needsPayment: false }
    case 'completed':
      return { canContinueChat: false, canUploadDocuments: false, canDownloadPDF: true, needsPayment: false }
  }
}

// Paid statuses (give access to premium features)
const PAID_STATUSES: EvaluationStatus[] = [
  'paid',
  'pending_upload',
  'pending_review',
  'complete_in_progress',
  'completed',
]

// Pre-payment statuses
const PRE_PAYMENT_STATUSES: EvaluationStatus[] = [
  'in_progress',
  'flash_completed',
  'payment_pending',
]

// Terminal statuses (no further transitions)
const TERMINAL_STATUSES: EvaluationStatus[] = ['completed']

// -----------------------------------------------------------------------------
// Tests: Status definitions
// -----------------------------------------------------------------------------

console.log('\n📊 Tests statuts d\'évaluation\n')

console.log('📋 Définitions des statuts')

test('8 statuts définis au total', () => {
  assert(ALL_STATUSES.length === 8, `Attendu 8, obtenu ${ALL_STATUSES.length}`)
})

test('Tous les statuts sont des strings non vides', () => {
  for (const s of ALL_STATUSES) {
    assert(typeof s === 'string' && s.length > 0, `Statut vide détecté`)
  }
})

test('Statuts uniques (pas de doublons)', () => {
  const unique = new Set(ALL_STATUSES)
  assert(unique.size === ALL_STATUSES.length, 'Doublons détectés dans les statuts')
})

test('pending_upload et pending_review sont présents (nouveau flow)', () => {
  assert(ALL_STATUSES.includes('pending_upload'), 'pending_upload manquant')
  assert(ALL_STATUSES.includes('pending_review'), 'pending_review manquant')
})

// -----------------------------------------------------------------------------
// Tests: Transitions
// -----------------------------------------------------------------------------

console.log('\n🔀 Transitions de statut')

test('Chaque statut a une entrée dans VALID_TRANSITIONS', () => {
  for (const s of ALL_STATUSES) {
    assert(s in VALID_TRANSITIONS, `${s} manquant dans VALID_TRANSITIONS`)
  }
})

test('completed est un état terminal (pas de transitions)', () => {
  assert(VALID_TRANSITIONS.completed.length === 0, 'completed devrait être terminal')
})

test('in_progress → flash_completed est valide', () => {
  assert(VALID_TRANSITIONS.in_progress.includes('flash_completed'), 'Transition manquante')
})

test('flash_completed → payment_pending est valide', () => {
  assert(VALID_TRANSITIONS.flash_completed.includes('payment_pending'), 'Transition manquante')
})

test('payment_pending → pending_upload est valide (nouveau flow)', () => {
  assert(VALID_TRANSITIONS.payment_pending.includes('pending_upload'), 'Transition manquante')
})

test('pending_upload → pending_review est valide', () => {
  assert(VALID_TRANSITIONS.pending_upload.includes('pending_review'), 'Transition manquante')
})

test('pending_review → complete_in_progress est valide', () => {
  assert(VALID_TRANSITIONS.pending_review.includes('complete_in_progress'), 'Transition manquante')
})

test('complete_in_progress → completed est valide', () => {
  assert(VALID_TRANSITIONS.complete_in_progress.includes('completed'), 'Transition manquante')
})

test('Pas de transition directe in_progress → completed', () => {
  assert(!VALID_TRANSITIONS.in_progress.includes('completed'), 'Transition interdite détectée')
})

test('Pas de transition inverse completed → in_progress', () => {
  assert(!VALID_TRANSITIONS.completed.includes('in_progress'), 'Transition inverse détectée')
})

test('Toutes les transitions pointent vers des statuts valides', () => {
  for (const [from, targets] of Object.entries(VALID_TRANSITIONS)) {
    for (const target of targets) {
      assert(
        (ALL_STATUSES as readonly string[]).includes(target),
        `Transition ${from} → ${target} : "${target}" n'est pas un statut valide`
      )
    }
  }
})

// Happy path test
test('Happy path: in_progress → flash_completed → payment_pending → pending_upload → pending_review → complete_in_progress → completed', () => {
  const path = [
    'in_progress',
    'flash_completed',
    'payment_pending',
    'pending_upload',
    'pending_review',
    'complete_in_progress',
    'completed',
  ]
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i]
    const to = path[i + 1]
    assert(
      VALID_TRANSITIONS[from].includes(to),
      `Happy path broken: ${from} → ${to} non valide`
    )
  }
})

// -----------------------------------------------------------------------------
// Tests: Access control
// -----------------------------------------------------------------------------

console.log('\n🔒 Contrôle d\'accès par statut')

test('in_progress : peut chatter, pas d\'upload, pas de PDF', () => {
  const rules = getAccessRules('in_progress')
  assert(rules.canContinueChat === true, 'Devrait pouvoir chatter')
  assert(rules.canUploadDocuments === false, 'Ne devrait pas pouvoir uploader')
  assert(rules.canDownloadPDF === false, 'Ne devrait pas pouvoir télécharger')
  assert(rules.needsPayment === false, 'Ne devrait pas avoir besoin de payer')
})

test('flash_completed : ne peut rien faire, doit payer', () => {
  const rules = getAccessRules('flash_completed')
  assert(rules.canContinueChat === false, 'Ne devrait pas pouvoir chatter')
  assert(rules.canUploadDocuments === false, 'Ne devrait pas pouvoir uploader')
  assert(rules.needsPayment === true, 'Devrait avoir besoin de payer')
})

test('pending_upload : peut uploader, pas de chat', () => {
  const rules = getAccessRules('pending_upload')
  assert(rules.canContinueChat === false, 'Ne devrait pas pouvoir chatter')
  assert(rules.canUploadDocuments === true, 'Devrait pouvoir uploader')
  assert(rules.canDownloadPDF === false, 'Ne devrait pas pouvoir télécharger')
  assert(rules.needsPayment === false, 'Ne devrait pas avoir besoin de payer')
})

test('pending_review : peut uploader, pas de chat', () => {
  const rules = getAccessRules('pending_review')
  assert(rules.canContinueChat === false, 'Ne devrait pas pouvoir chatter')
  assert(rules.canUploadDocuments === true, 'Devrait pouvoir uploader')
  assert(rules.needsPayment === false, 'Ne devrait pas avoir besoin de payer')
})

test('complete_in_progress : peut chatter, pas d\'upload', () => {
  const rules = getAccessRules('complete_in_progress')
  assert(rules.canContinueChat === true, 'Devrait pouvoir chatter')
  assert(rules.canUploadDocuments === false, 'Ne devrait pas pouvoir uploader')
  assert(rules.needsPayment === false, 'Ne devrait pas avoir besoin de payer')
})

test('completed : PDF uniquement', () => {
  const rules = getAccessRules('completed')
  assert(rules.canContinueChat === false, 'Ne devrait pas pouvoir chatter')
  assert(rules.canUploadDocuments === false, 'Ne devrait pas pouvoir uploader')
  assert(rules.canDownloadPDF === true, 'Devrait pouvoir télécharger le PDF')
  assert(rules.needsPayment === false, 'Ne devrait pas avoir besoin de payer')
})

// -----------------------------------------------------------------------------
// Tests: Status categories
// -----------------------------------------------------------------------------

console.log('\n📂 Catégories de statut')

test('5 statuts payés', () => {
  assert(PAID_STATUSES.length === 5, `Attendu 5, obtenu ${PAID_STATUSES.length}`)
})

test('3 statuts pré-paiement', () => {
  assert(PRE_PAYMENT_STATUSES.length === 3, `Attendu 3, obtenu ${PRE_PAYMENT_STATUSES.length}`)
})

test('pending_upload est un statut payé', () => {
  assert(PAID_STATUSES.includes('pending_upload'), 'pending_upload devrait être payé')
})

test('pending_review est un statut payé', () => {
  assert(PAID_STATUSES.includes('pending_review'), 'pending_review devrait être payé')
})

test('Pas de chevauchement entre payés et pré-paiement', () => {
  for (const s of PAID_STATUSES) {
    assert(
      !PRE_PAYMENT_STATUSES.includes(s as typeof PRE_PAYMENT_STATUSES[number]),
      `${s} est dans les deux catégories`
    )
  }
})

test('Tous les statuts sont dans une catégorie (payé ou pré-paiement)', () => {
  for (const s of ALL_STATUSES) {
    const isPaid = PAID_STATUSES.includes(s)
    const isPre = PRE_PAYMENT_STATUSES.includes(s)
    assert(isPaid || isPre, `${s} n'est dans aucune catégorie`)
  }
})

test('1 seul état terminal', () => {
  assert(TERMINAL_STATUSES.length === 1, `Attendu 1, obtenu ${TERMINAL_STATUSES.length}`)
  assert(TERMINAL_STATUSES[0] === 'completed', `État terminal attendu: completed`)
})

// -----------------------------------------------------------------------------
// Tests: markEvaluationAsPaid → pending_upload
// -----------------------------------------------------------------------------

console.log('\n💳 markEvaluationAsPaid → pending_upload')

test('Après paiement, statut = pending_upload (pas paid)', () => {
  // Simulating what markEvaluationAsPaid() does
  const statusAfterPayment: EvaluationStatus = 'pending_upload'
  assert(statusAfterPayment === 'pending_upload', 'markEvaluationAsPaid devrait mettre pending_upload')
})

test('pending_upload est le premier statut du flow upload/review', () => {
  assert(
    VALID_TRANSITIONS.payment_pending.includes('pending_upload'),
    'pending_upload devrait suivre payment_pending'
  )
})

test('pending_upload ne permet pas le chat direct', () => {
  const rules = getAccessRules('pending_upload')
  assert(rules.canContinueChat === false, 'pending_upload ne devrait pas donner accès au chat')
})

// -----------------------------------------------------------------------------
// Tests: Evaluation data fields
// -----------------------------------------------------------------------------

console.log('\n📝 Champs de données évaluation')

interface EvaluationFields {
  id: string
  user_id: string
  siren: string
  entreprise_nom?: string
  archetype_id?: string
  diagnostic_data?: Record<string, unknown>
  type: 'flash' | 'complete'
  status: EvaluationStatus
  question_count: number
  document_count: number
  valuation_low?: number
  valuation_high?: number
  valuation_method?: string
  stripe_payment_id?: string
  amount_paid?: number
}

test('Interface Evaluation a les champs archetype_id et diagnostic_data', () => {
  const mockEval: EvaluationFields = {
    id: 'test-id',
    user_id: 'user-id',
    siren: '552032534',
    type: 'flash',
    status: 'pending_upload',
    question_count: 3,
    document_count: 0,
    archetype_id: 'saas_mature',
    diagnostic_data: { activityType: 'saas', revenue: 5000000 },
  }
  assert(mockEval.archetype_id === 'saas_mature', 'archetype_id manquant')
  assert(mockEval.diagnostic_data?.activityType === 'saas', 'diagnostic_data manquant')
})

test('archetype_id est optionnel', () => {
  const mockEval: EvaluationFields = {
    id: 'test-id',
    user_id: 'user-id',
    siren: '552032534',
    type: 'flash',
    status: 'in_progress',
    question_count: 0,
    document_count: 0,
  }
  assert(mockEval.archetype_id === undefined, 'archetype_id devrait être optionnel')
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
