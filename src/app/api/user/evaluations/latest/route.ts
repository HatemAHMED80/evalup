import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/user/evaluations/latest
 *
 * Returns the latest evaluation for the authenticated user.
 * Used by the dashboard redirect page to route to the right evaluation.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Cast needed: evaluations table not in generated Supabase types
  const { data } = await supabase
    .from('evaluations')
    .select('id, siren, entreprise_nom, status')
    .eq('user_id', user.id)
    .not('status', 'in', '("payment_pending","refunded")')
    .order('created_at', { ascending: false })
    .limit(1)

  const evaluation = (data as { id: string; siren: string; entreprise_nom: string; status: string }[] | null)?.[0] ?? null

  if (!evaluation) {
    return NextResponse.json({ evaluation: null })
  }

  return NextResponse.json({
    evaluation: {
      id: evaluation.id,
      siren: evaluation.siren,
      entreprise_nom: evaluation.entreprise_nom,
      status: evaluation.status,
    },
  })
}
