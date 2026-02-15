import { NextRequest, NextResponse } from 'next/server'
import { detectArchetype, ARCHETYPES } from '@/lib/valuation/archetypes'
import type { DiagnosticInput } from '@/lib/valuation/archetypes'
import { getMultiplesForArchetype } from '@/lib/valuation/multiples'
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
} from '@/lib/security'

// ---------------------------------------------------------------------------
// POST /api/diagnostic
// Receives form inputs, detects archetype, returns archetype + multiples
// ---------------------------------------------------------------------------

interface DiagnosticRequestBody {
  activityType: string
  revenue: number
  ebitda: number
  growth: number
  recurring: number
  masseSalariale: number
  effectif: string
  nafCode?: string
  hasPatrimoine?: boolean
  loyersNets?: number
  remunerationDirigeant?: number
  dettesFinancieres?: number
  tresorerieActuelle?: number
  concentrationClient?: number
  mrrMensuel?: number
}

export async function POST(request: NextRequest) {
  // Rate limiting by IP
  const identifier = getClientIp(request)
  const rateLimitResult = await checkRateLimit(identifier, 'entrepriseApi')

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez plus tard.', code: 'RATE_LIMITED' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }

  // Parse body
  let body: DiagnosticRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide.', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  // Validate required fields
  const { activityType, revenue, ebitda, growth, recurring, masseSalariale, effectif } = body
  if (!activityType || typeof revenue !== 'number' || typeof ebitda !== 'number') {
    return NextResponse.json(
      { error: 'Champs obligatoires manquants : activityType, revenue, ebitda.', code: 'MISSING_FIELDS' },
      { status: 400 }
    )
  }

  // Build DiagnosticInput
  const input: DiagnosticInput = {
    sector: activityType,
    revenue,
    ebitda,
    growth: growth ?? 0,
    recurring: recurring ?? 0,
    masseSalariale: masseSalariale ?? 0,
    hasPhysicalStore: ['commerce', 'industrie'].includes(activityType),
    hasMRR: ['saas', 'marketplace'].includes(activityType) || (body.mrrMensuel != null && body.mrrMensuel > 0),
    nafCode: body.nafCode || undefined,
    remunerationDirigeant: body.remunerationDirigeant,
    concentrationClient: body.concentrationClient,
    mrrMensuel: body.mrrMensuel,
  }

  // Detect archetype
  const archetypeId = detectArchetype(input)

  // Load archetype details
  const archetype = ARCHETYPES[archetypeId] || null

  // Load multiples for this archetype
  const multiples = getMultiplesForArchetype(archetypeId) || null

  return NextResponse.json({
    archetypeId,
    archetype,
    multiples,
    input: {
      activityType,
      revenue,
      ebitda,
      growth,
      recurring,
      masseSalariale,
      effectif,
      hasPatrimoine: body.hasPatrimoine ?? false,
      loyersNets: body.loyersNets ?? null,
      remunerationDirigeant: body.remunerationDirigeant ?? null,
      dettesFinancieres: body.dettesFinancieres ?? null,
      tresorerieActuelle: body.tresorerieActuelle ?? null,
      concentrationClient: body.concentrationClient ?? null,
      mrrMensuel: body.mrrMensuel ?? null,
    },
  })
}
