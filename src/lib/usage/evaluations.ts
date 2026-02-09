// Service de gestion des evaluations
// Nouveau modele: Flash (gratuit) -> Complete (79€) -> Pro (199€/399€)

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getEvalsPerMonthLimit, canDoCompleteEval } from '@/lib/stripe/plans'

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

export type EvaluationType = 'flash' | 'complete'

export type EvaluationStatus =
  | 'in_progress'        // Flash en cours
  | 'flash_completed'    // Flash terminee, en attente paiement
  | 'payment_pending'    // Paiement initie
  | 'paid'               // Paye, pret pour complete
  | 'complete_in_progress' // Complete en cours
  | 'completed'          // Terminee

export interface Evaluation {
  id: string
  user_id: string
  siren: string
  entreprise_nom?: string
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
  flash_completed_at?: string
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
// CONSTANTES
// ============================================

export const FLASH_QUESTIONS_LIMIT = 8

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

  // Creer une nouvelle evaluation Flash
  const { data: newEval, error } = await supabase
    .from('evaluations')
    .insert({
      user_id: userId,
      siren,
      entreprise_nom: entrepriseNom,
      type: 'flash',
      status: 'in_progress',
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

  // Cas 0: Abonnement actif -> accès complet (priorité sur le statut Flash)
  const hasProAccess = canDoCompleteEval(planId)

  if (hasProAccess && (evaluation.status === 'in_progress' || evaluation.status === 'flash_completed')) {
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

  // Cas 1: Evaluation Flash en cours (utilisateur gratuit)
  // Limite stricte côté serveur à FLASH_QUESTIONS_LIMIT questions
  if (evaluation.status === 'in_progress' && evaluation.type === 'flash') {
    return {
      canContinue: evaluation.questions_count < FLASH_QUESTIONS_LIMIT,
      canUploadDocuments: false,
      canDownloadPDF: false,
      questionsRemaining: Math.max(0, FLASH_QUESTIONS_LIMIT - evaluation.questions_count),
      needsPayment: evaluation.questions_count >= FLASH_QUESTIONS_LIMIT,
      evaluation,
    }
  }

  // Cas 2: Flash terminee, en attente de paiement
  if (evaluation.status === 'flash_completed' || evaluation.status === 'payment_pending') {
    return {
      canContinue: false,
      canUploadDocuments: false,
      canDownloadPDF: false,
      questionsRemaining: 0,
      needsPayment: true,
      evaluation,
    }
  }

  // Cas 3: Paye ou en cours de complete -> acces complet
  if (evaluation.status === 'paid' || evaluation.status === 'complete_in_progress') {
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

  // Par defaut: Flash limits
  return {
    canContinue: evaluation.questions_count < FLASH_QUESTIONS_LIMIT,
    canUploadDocuments: false,
    canDownloadPDF: false,
    questionsRemaining: Math.max(0, FLASH_QUESTIONS_LIMIT - evaluation.questions_count),
    needsPayment: evaluation.questions_count >= FLASH_QUESTIONS_LIMIT,
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
 * Marque la Flash comme terminee
 */
export async function completeFlashEvaluation(
  evaluationId: string,
  valuationLow?: number,
  valuationHigh?: number
): Promise<void> {
  const supabase = getSupabaseAdmin()

  const updateData: Record<string, unknown> = {
    status: 'flash_completed',
    flash_completed_at: new Date().toISOString(),
  }

  // Ajouter les valorisations si fournies
  if (valuationLow !== undefined) updateData.valuation_low = valuationLow
  if (valuationHigh !== undefined) updateData.valuation_high = valuationHigh

  await supabase
    .from('evaluations')
    .update(updateData)
    .eq('id', evaluationId)
}

/**
 * Marque une évaluation Flash comme terminée par SIREN
 * Utilisé quand l'IA donne la valorisation
 */
export async function markFlashCompleteByUserAndSiren(
  userId: string,
  siren: string
): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Trouver l'évaluation en cours
  const { data: evaluation } = await supabase
    .from('evaluations')
    .select('id')
    .eq('user_id', userId)
    .eq('siren', siren)
    .eq('status', 'in_progress')
    .eq('type', 'flash')
    .single()

  if (evaluation) {
    await supabase
      .from('evaluations')
      .update({
        status: 'flash_completed',
        flash_completed_at: new Date().toISOString(),
      })
      .eq('id', evaluation.id)
  }
}

/**
 * Marque l'evaluation comme payee (apres paiement Stripe)
 * Garde: uniquement depuis flash_completed, payment_pending ou in_progress
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

  const validFromStatuses = ['flash_completed', 'payment_pending', 'in_progress']
  if (evaluation && !validFromStatuses.includes(evaluation.status)) {
    console.warn(`[Evaluations] Transition invalide: ${evaluation.status} -> paid pour ${evaluationId}`)
    return
  }

  await supabase
    .from('evaluations')
    .update({
      type: 'complete',
      status: 'paid',
      stripe_payment_id: stripePaymentId,
      amount_paid: amountPaid,
      paid_at: new Date().toISOString(),
    })
    .eq('id', evaluationId)
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
      amount: 7900, // 79€ en centimes
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
  const { data: purchase } = await supabase
    .from('purchases')
    .update({
      stripe_payment_intent_id: stripePaymentIntentId,
      status: 'succeeded',
      paid_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', stripeCheckoutSessionId)
    .select('evaluation_id')
    .single()

  // Mettre a jour l'evaluation
  if (purchase?.evaluation_id) {
    await markEvaluationAsPaid(purchase.evaluation_id, stripePaymentIntentId, 7900)
  }
}
