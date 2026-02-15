// Route pour consulter le statut des documents financiers et relancer le fetch Pappers
// GET : statut + données extraites
// POST : relancer le pipeline Pappers

import { NextRequest, NextResponse } from 'next/server'
import { optionalAuth, validateAndCleanSiren } from '@/lib/security'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchPappersDocuments } from '@/lib/pappers-documents'

interface RouteParams {
  params: Promise<{ siren: string }>
}

export async function GET(request: NextRequest, { params: _params }: RouteParams) {
  const user = await optionalAuth()
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  const evaluationId = request.nextUrl.searchParams.get('evaluationId')
  if (!evaluationId) {
    return NextResponse.json({ error: 'evaluationId requis' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (createServiceClient() as any)
    .from('evaluations')
    .select('extracted_financials, documents_source, pappers_doc_status')
    .eq('id', evaluationId)
    .eq('user_id', user.id)
    .single()

  if (!data) {
    return NextResponse.json({ error: 'Évaluation non trouvée' }, { status: 404 })
  }

  return NextResponse.json({
    status: data.pappers_doc_status || 'not_started',
    source: data.documents_source || 'none',
    data: data.extracted_financials || null,
  })
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await optionalAuth()
  if (!user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  const { siren } = await params
  const sirenValidation = validateAndCleanSiren(siren)
  if (!sirenValidation.valid) {
    return NextResponse.json({ error: sirenValidation.error }, { status: 400 })
  }
  const cleanSiren = sirenValidation.cleaned!

  const body = await request.json()
  const evaluationId = body.evaluationId as string | undefined
  if (!evaluationId) {
    return NextResponse.json({ error: 'evaluationId requis' }, { status: 400 })
  }

  // Vérifier que l'évaluation appartient à l'utilisateur
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any
  const { data: evalData } = await supabase
    .from('evaluations')
    .select('id, pappers_doc_status')
    .eq('id', evaluationId)
    .eq('user_id', user.id)
    .single()

  if (!evalData) {
    return NextResponse.json({ error: 'Évaluation non trouvée' }, { status: 404 })
  }

  // Reset le statut pour permettre un retry
  if (evalData.pappers_doc_status === 'error' || evalData.pappers_doc_status === 'not_available') {
    await supabase
      .from('evaluations')
      .update({ pappers_doc_status: 'not_started' })
      .eq('id', evaluationId)
  }

  // Lancer le pipeline en background
  fetchPappersDocuments(evaluationId, cleanSiren)
    .catch(err => console.error('[Documents] Erreur fetch Pappers:', err))

  return NextResponse.json({ status: 'started' })
}
