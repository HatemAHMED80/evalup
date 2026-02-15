import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { verifyAndUnlockPayment } from '@/lib/usage/evaluations'

/**
 * POST /api/evaluations/[id]/verify-payment
 *
 * Vérifie le paiement directement via Stripe API et débloque l'évaluation.
 * Appelé par le frontend après retour de Stripe checkout.
 */

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: evaluationId } = await params

  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  // Ownership check (admin pour bypass RLS)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: evaluation } = await admin
    .from('evaluations')
    .select('id, user_id, status')
    .eq('id', evaluationId)
    .single()

  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluation introuvable' }, { status: 404 })
  }

  if (evaluation.user_id !== user.id) {
    return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
  }

  // Déjà payé
  const paidStatuses = ['pending_upload', 'pending_review', 'complete_in_progress', 'completed']
  if (paidStatuses.includes(evaluation.status)) {
    return NextResponse.json({ verified: true, status: evaluation.status })
  }

  // Vérifier via Stripe et débloquer
  const unlocked = await verifyAndUnlockPayment(evaluationId)

  if (unlocked) {
    return NextResponse.json({ verified: true, status: 'pending_upload' })
  }

  return NextResponse.json(
    { error: 'Paiement non confirme par Stripe.' },
    { status: 402 }
  )
}
