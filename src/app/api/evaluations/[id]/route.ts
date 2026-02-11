import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Evaluation } from '@/lib/usage/evaluations'

/**
 * GET /api/evaluations/[id]
 *
 * Returns evaluation info for the authenticated user.
 * Used by the upload page to verify auth + payment before proceeding.
 *
 * Returns:
 *  - 200 with evaluation data (id, siren, entreprise_nom, type, status)
 *  - 401 if not authenticated
 *  - 403 if the evaluation doesn't belong to the user
 *  - 402 if the evaluation hasn't been paid
 *  - 404 if not found
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Authentification requise' },
      { status: 401 }
    )
  }

  // Fetch the evaluation (cast needed: evaluations table not in generated Supabase types)
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, user_id, siren, entreprise_nom, type, status, questions_count, documents_count')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Evaluation introuvable' },
      { status: 404 }
    )
  }

  const evaluation = data as unknown as Evaluation

  // Ownership check
  if (evaluation.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Acces refuse' },
      { status: 403 }
    )
  }

  // Payment check — require paid/pending_upload/pending_review or complete_in_progress or completed
  const paidStatuses = ['paid', 'pending_upload', 'pending_review', 'complete_in_progress', 'completed']
  if (!paidStatuses.includes(evaluation.status)) {
    return NextResponse.json(
      { error: 'Paiement requis', evaluationId: evaluation.id, siren: evaluation.siren },
      { status: 402 }
    )
  }

  return NextResponse.json({
    id: evaluation.id,
    siren: evaluation.siren,
    entreprise_nom: evaluation.entreprise_nom,
    type: evaluation.type,
    status: evaluation.status,
    questionsCount: evaluation.questions_count,
    documentsCount: evaluation.documents_count,
  })
}
