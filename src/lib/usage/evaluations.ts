// Service de gestion des evaluations
// Modele: Diagnostic (gratuit, formulaire) -> Paiement (79€) -> Upload -> Review -> Chat IA -> Rapport PDF

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getEvalsPerMonthLimit, canDoCompleteEval, PLANS } from '@/lib/stripe/plans'

// Client Supabase admin (lazy init)
let _supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

// ============================================
// TYPES
// ============================================

export type EvaluationType = 'complete'

export type EvaluationStatus =
  | 'payment_pending'       // Paiement initie (evaluation creee au checkout)
  | 'pending_upload'        // Paye, en attente upload documents
  | 'pending_review'        // Documents uploades, en attente review
  | 'complete_in_progress'  // Chat IA en cours
  | 'completed'             // Terminee
  | 'refunded'              // Remboursee

export interface Evaluation {
  id: string
  user_id: string
  siren: string
  entreprise_nom?: string
  archetype_id?: string
  diagnostic_data?: Record<string, unknown>
  type: EvaluationType
  status: EvaluationStatus
  questions_count: number
  documents_count: number
  valuation_low?: number
  valuation_high?: number
  valuation_method?: string
  stripe_payment_id?: string
  amount_paid?: number
  created_at: string
  paid_at?: string
  completed_at?: string
}

export interface EvaluationAccess {
  canContinue: boolean
  canUploadDocuments: boolean
  canDownloadPDF: boolean
  questionsRemaining: number | null // null = illimite
  needsPayment: boolean
  evaluation?: Evaluation
}

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Cree ou recupere une evaluation pour un SIREN
 */
export async function getOrCreateEvaluation(
  userId: string,
  siren: string,
  entrepriseNom?: string
): Promise<Evaluation> {
  const supabase = getSupabaseAdmin()

  // Chercher une evaluation existante non terminee
  const { data: existing } = await supabase
    .from('evaluations')
    .select('*')
    .eq('user_id', userId)
    .eq('siren', siren)
    .not('status', 'eq', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    return existing as Evaluation
  }

  // Creer une nouvelle evaluation
  const { data: newEval, error } = await supabase
    .from('evaluations')
    .insert({
      user_id: userId,
      siren,
      entreprise_nom: entrepriseNom,
      type: 'complete',
      status: 'payment_pending',
      questions_count: 0,
      documents_count: 0,
    })
    .select()
    .single()

  if (error) throw error

  return newEval as Evaluation
}

/**
 * Verifie les droits d'acces pour une evaluation
 */
export async function checkEvaluationAccess(
  userId: string,
  siren: string
): Promise<EvaluationAccess> {
  const supabase = getSupabaseAdmin()

  // Recuperer l'evaluation
  const evaluation = await getOrCreateEvaluation(userId, siren)

  // Recuperer le plan actif (inclure past_due pour période de grâce)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id, status')
    .eq('user_id', userId)
    .in('status', ['active', 'past_due', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const planId = subscription?.plan_id || null

  // Cas 0: Abonnement Pro actif -> accès complet
  const hasProAccess = canDoCompleteEval(planId)

  if (hasProAccess && evaluation.status === 'payment_pending') {
    const evalsUsed = await getMonthlyEvalCount(userId)
    const limit = getEvalsPerMonthLimit(planId)

    if (limit === null || evalsUsed < limit) {
      return {
        canContinue: true,
        canUploadDocuments: true,
        canDownloadPDF: true,
        questionsRemaining: null,
        needsPayment: false,
        evaluation,
      }
    }
  }

  // Cas 1: En attente de paiement
  if (evaluation.status === 'payment_pending') {
    return {
      canContinue: false,
      canUploadDocuments: false,
      canDownloadPDF: false,
      questionsRemaining: 0,
      needsPayment: true,
      evaluation,
    }
  }

  // Cas 2: En attente upload ou review -> accès documents, pas de chat
  if (evaluation.status === 'pending_upload' || evaluation.status === 'pending_review') {
    return {
      canContinue: false,
      canUploadDocuments: true,
      canDownloadPDF: false,
      questionsRemaining: null,
      needsPayment: false,
      evaluation,
    }
  }

  // Cas 3: Chat IA en cours -> acces complet
  if (evaluation.status === 'complete_in_progress') {
    return {
      canContinue: true,
      canUploadDocuments: true,
      canDownloadPDF: true,
      questionsRemaining: null,
      needsPayment: false,
      evaluation,
    }
  }

  // Cas 4: Evaluation terminee -> lecture seule (PDF autorisé)
  if (evaluation.status === 'completed') {
    return {
      canContinue: false,
      canUploadDocuments: false,
      canDownloadPDF: true,
      questionsRemaining: 0,
      needsPayment: false,
      evaluation,
    }
  }

  // Cas 5: Evaluation remboursee -> aucun acces
  if (evaluation.status === 'refunded') {
    return {
      canContinue: false,
      canUploadDocuments: false,
      canDownloadPDF: false,
      questionsRemaining: 0,
      needsPayment: false,
      evaluation,
    }
  }

  // Par defaut: pas d'acces
  return {
    canContinue: false,
    canUploadDocuments: false,
    canDownloadPDF: false,
    questionsRemaining: 0,
    needsPayment: true,
    evaluation,
  }
}

/**
 * Incremente le compteur de questions (atomique via RPC)
 */
export async function incrementQuestionCount(evaluationId: string): Promise<number> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .rpc('increment_question_count', { p_evaluation_id: evaluationId })

  if (error) {
    console.error('[Evaluations] Erreur increment_question_count RPC:', error)
    // Fallback non-atomique si la fonction RPC n'existe pas encore
    const { data: current } = await supabase
      .from('evaluations')
      .select('questions_count')
      .eq('id', evaluationId)
      .single()

    const newCount = (current?.questions_count || 0) + 1

    await supabase
      .from('evaluations')
      .update({ questions_count: newCount })
      .eq('id', evaluationId)

    return newCount
  }

  return (data as number) || 0
}

/**
 * Marque l'evaluation comme payee (apres paiement Stripe)
 */
export async function markEvaluationAsPaid(
  evaluationId: string,
  stripePaymentId: string,
  amountPaid: number
): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Vérifier que la transition est valide
  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('status')
    .eq('id', evaluationId)
    .single()

  const validFromStatuses = ['payment_pending']
  if (evaluation && !validFromStatuses.includes(evaluation.status)) {
    console.warn(`[Evaluations] Transition invalide: ${evaluation.status} -> paid pour ${evaluationId}`)
    return
  }

  const { error } = await supabase
    .from('evaluations')
    .update({
      type: 'complete',
      status: 'pending_upload',
      stripe_payment_id: stripePaymentId,
      amount_paid: amountPaid,
      paid_at: new Date().toISOString(),
    })
    .eq('id', evaluationId)

  if (error) {
    console.error(`[Evaluations] Erreur update evaluation ${evaluationId}:`, error)
  }
}

/**
 * Demarre l'evaluation complete (apres paiement)
 */
export async function startCompleteEvaluation(evaluationId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  await supabase
    .from('evaluations')
    .update({
      status: 'complete_in_progress',
    })
    .eq('id', evaluationId)
}

/**
 * Termine l'evaluation complete
 */
export async function completeEvaluation(
  evaluationId: string,
  valuationLow: number,
  valuationHigh: number,
  method: string
): Promise<void> {
  const supabase = getSupabaseAdmin()

  await supabase
    .from('evaluations')
    .update({
      status: 'completed',
      valuation_low: valuationLow,
      valuation_high: valuationHigh,
      valuation_method: method,
      completed_at: new Date().toISOString(),
    })
    .eq('id', evaluationId)
}

/**
 * Incremente le compteur de documents (atomique via RPC)
 */
export async function incrementDocumentCount(evaluationId: string): Promise<number> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .rpc('increment_document_count', { p_evaluation_id: evaluationId })

  if (error) {
    console.error('[Evaluations] Erreur increment_document_count RPC:', error)
    // Fallback non-atomique si la fonction RPC n'existe pas encore
    const { data: current } = await supabase
      .from('evaluations')
      .select('documents_count')
      .eq('id', evaluationId)
      .single()

    const newCount = (current?.documents_count || 0) + 1

    await supabase
      .from('evaluations')
      .update({ documents_count: newCount })
      .eq('id', evaluationId)

    return newCount
  }

  return (data as number) || 0
}

// ============================================
// COMPTEUR MENSUEL (pour Pro 10)
// ============================================

/**
 * Recupere le nombre d'evaluations utilisees ce mois
 */
export async function getMonthlyEvalCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('eval_usage')
    .select('evals_used')
    .eq('user_id', userId)
    .eq('month', monthStart.toISOString().split('T')[0])
    .single()

  return data?.evals_used || 0
}

/**
 * Incremente le compteur mensuel
 */
export async function incrementMonthlyEvalCount(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthStr = monthStart.toISOString().split('T')[0]

  // Upsert
  const { data: existing } = await supabase
    .from('eval_usage')
    .select('id, evals_used')
    .eq('user_id', userId)
    .eq('month', monthStr)
    .single()

  if (existing) {
    const newCount = existing.evals_used + 1
    await supabase
      .from('eval_usage')
      .update({ evals_used: newCount })
      .eq('id', existing.id)
    return newCount
  } else {
    await supabase
      .from('eval_usage')
      .insert({
        user_id: userId,
        month: monthStr,
        evals_used: 1,
      })
    return 1
  }
}

// ============================================
// ACHATS UNITAIRES
// ============================================

/**
 * Cree un enregistrement d'achat
 */
export async function createPurchase(
  userId: string,
  evaluationId: string,
  stripeCheckoutSessionId: string
): Promise<string> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      evaluation_id: evaluationId,
      stripe_checkout_session_id: stripeCheckoutSessionId,
      product_type: 'eval_complete',
      amount: PLANS.eval_complete.price * 100,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) throw error

  return data.id
}

/**
 * Confirme un achat (apres webhook Stripe)
 */
export async function confirmPurchase(
  stripePaymentIntentId: string,
  stripeCheckoutSessionId: string
): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Mettre a jour l'achat
  const { data: purchase, error } = await supabase
    .from('purchases')
    .update({
      stripe_payment_intent_id: stripePaymentIntentId,
      status: 'succeeded',
      paid_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', stripeCheckoutSessionId)
    .select('evaluation_id')
    .single()

  if (error) {
    console.error('[confirmPurchase] Erreur update purchase:', error, { stripeCheckoutSessionId })
  }

  // Mettre a jour l'evaluation
  if (purchase?.evaluation_id) {
    await markEvaluationAsPaid(purchase.evaluation_id, stripePaymentIntentId, PLANS.eval_complete.price * 100)
  } else {
    console.warn('[confirmPurchase] Purchase non trouvee pour session:', stripeCheckoutSessionId)
  }
}

/**
 * Stocke les donnees du diagnostic et l'archetype dans l'evaluation
 */
export async function updateEvaluationDiagnosticData(
  evaluationId: string,
  archetypeId: string,
  diagnosticData: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabaseAdmin()

  await supabase
    .from('evaluations')
    .update({
      archetype_id: archetypeId,
      diagnostic_data: diagnosticData,
    })
    .eq('id', evaluationId)
}
