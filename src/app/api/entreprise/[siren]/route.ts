// API Route pour récupérer les données d'une entreprise par SIREN
// Sécurisé: rate limiting, validation SIREN améliorée
// Cache Supabase: évite la dépendance en temps réel à Pappers

import { NextRequest, NextResponse } from 'next/server'
import { rechercherEntreprise, isPappersConfigured, PappersError } from '@/lib/pappers'
import { detecterSecteur, getNomSecteur } from '@/lib/prompts'
import { detecterAnomalies, convertirBilansNormalises } from '@/lib/analyse/anomalies'
import type { ConversationContext, BilanAnnuel, RatiosFinanciers, Anomalie } from '@/lib/anthropic'
import { getTestFixture, buildTestResponse } from '../test-fixtures'
import {
  optionalAuth,
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  validateAndCleanSiren,
} from '@/lib/security'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchPappersDocuments } from '@/lib/pappers-documents'

// ============================================
// CACHE PAPPERS (Supabase)
// ============================================
const CACHE_TTL_DAYS = 30

interface CacheEntry {
  response: unknown
  isExpired: boolean
  fetchedAt: string
}

async function getCachedEntreprise(siren: string): Promise<CacheEntry | null> {
  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('pappers_cache')
    .select('api_response, fetched_at, expires_at, hit_count')
    .eq('siren', siren)
    .single()

  if (error || !data) return null

  const row = data as { api_response: unknown; fetched_at: string; expires_at: string; hit_count: number }
  const isExpired = new Date(row.expires_at) < new Date()

  // Incrémenter le hit_count (fire-and-forget, non-bloquant)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(supabase as any)
    .from('pappers_cache')
    .update({ hit_count: (row.hit_count || 0) + 1 })
    .eq('siren', siren)
    .then(() => {})

  return {
    response: row.api_response,
    isExpired,
    fetchedAt: row.fetched_at,
  }
}

async function setCachedEntreprise(siren: string, rawData: unknown, apiResponse: unknown) {
  const supabase = createServiceClient()
  const now = new Date()
  const expires = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('pappers_cache')
    .upsert({
      siren,
      raw_data: rawData,
      api_response: apiResponse,
      fetched_at: now.toISOString(),
      expires_at: expires.toISOString(),
      hit_count: 0,
    }, { onConflict: 'siren' })

  if (error) {
    console.warn('[Entreprise] Erreur écriture cache:', error.message)
  }
}

// ============================================
// ROUTE HANDLER
// ============================================
interface RouteParams {
  params: Promise<{ siren: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limiting (par IP ou user ID)
  const user = await optionalAuth()
  const identifier = user?.id || getClientIp(request)
  const rateLimitResult = await checkRateLimit(identifier, 'entrepriseApi')

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez plus tard.', code: 'RATE_LIMITED' },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    )
  }

  const { siren } = await params

  // Valider le SIREN
  const sirenValidation = validateAndCleanSiren(siren)
  if (!sirenValidation.valid) {
    return NextResponse.json(
      { error: sirenValidation.error, code: 'INVALID_SIREN' },
      { status: 400 }
    )
  }
  const cleanSiren = sirenValidation.cleaned!

  // E2E test mode: SIRENs 901* or 000* bypass Pappers with mock data
  const testFixture = getTestFixture(cleanSiren)
  if (testFixture) {
    return NextResponse.json(buildTestResponse(testFixture))
  }
  if (cleanSiren.startsWith('000')) {
    const testEntreprise = {
      siren: cleanSiren,
      nom: `Entreprise Test ${cleanSiren}`,
      secteur: 'Services',
      codeNaf: '6201Z',
      dateCreation: '01-01-2020',
      effectif: 'Non renseigné',
      adresse: '1 rue du Test',
      ville: 'Paris',
    }
    return NextResponse.json({
      entreprise: testEntreprise,
      initialContext: {
        entreprise: testEntreprise,
        financials: { bilans: [], ratios: { margeNette: 0, margeEbitda: 0, ebitda: 0, dso: 0, ratioEndettement: 0 }, anomaliesDetectees: [] },
        documents: [],
        responses: {},
        evaluationProgress: { step: 1, completedTopics: [], pendingTopics: ['Découverte', 'Finances', 'Actifs', 'Équipe', 'Marché', 'Synthèse'] },
      },
    })
  }

  // ============================================
  // 1. VÉRIFIER LE CACHE SUPABASE
  // ============================================
  let cached: CacheEntry | null = null
  try {
    cached = await getCachedEntreprise(cleanSiren)
  } catch (cacheError) {
    console.warn('[Entreprise] Erreur lecture cache (non-bloquant):', cacheError)
  }

  // Si cache frais (< 30j) → retourner directement sans appeler Pappers
  if (cached && !cached.isExpired) {
    return NextResponse.json(cached.response, {
      headers: { 'X-Data-Source': 'cache', 'X-Cache-Date': cached.fetchedAt },
    })
  }

  // ============================================
  // 2. TENTER PAPPERS (cache miss ou stale)
  // ============================================
  const pappersAvailable = isPappersConfigured()

  let entreprise
  let pappersSuccess = false

  if (pappersAvailable) {
    try {
      entreprise = await rechercherEntreprise(cleanSiren)
      pappersSuccess = true
    } catch (error) {
      if (error instanceof PappersError && error.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Entreprise non trouvée', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }
      console.error('[Entreprise] Erreur Pappers:', error)
    }
  }

  // ============================================
  // 3. FALLBACK: cache stale si Pappers KO
  // ============================================
  if (!pappersSuccess && cached) {
    console.warn(`[Entreprise] Pappers KO, fallback cache stale pour ${cleanSiren} (${cached.fetchedAt})`)
    return NextResponse.json(cached.response, {
      headers: { 'X-Data-Source': 'cache-stale', 'X-Cache-Date': cached.fetchedAt },
    })
  }

  // Ni Pappers ni cache → erreur
  if (!pappersSuccess || !entreprise) {
    return NextResponse.json(
      { error: 'Erreur lors de la recherche', code: 'SEARCH_ERROR' },
      { status: pappersAvailable ? 500 : 503 }
    )
  }

  // ============================================
  // 4. CONSTRUIRE LA RÉPONSE (Pappers OK)
  // ============================================
  try {
    // Détecter le secteur
    const secteurCode = detecterSecteur(entreprise.codeNaf || '')
    const secteurNom = getNomSecteur(secteurCode)

    // Convertir les bilans au format attendu (défensif: bilans peut être undefined)
    const bilans: BilanAnnuel[] = convertirBilansNormalises(entreprise.bilans || [])

    // Calculer les ratios
    const dernierBilan = bilans[0]
    const ratios: RatiosFinanciers = dernierBilan ? {
      margeNette: dernierBilan.chiffre_affaires > 0
        ? (dernierBilan.resultat_net / dernierBilan.chiffre_affaires) * 100
        : 0,
      margeEbitda: dernierBilan.chiffre_affaires > 0
        ? ((dernierBilan.resultat_exploitation + dernierBilan.dotations_amortissements) / dernierBilan.chiffre_affaires) * 100
        : 0,
      ebitda: dernierBilan.resultat_exploitation + dernierBilan.dotations_amortissements,
      dso: dernierBilan.chiffre_affaires > 0
        ? (dernierBilan.creances_clients / dernierBilan.chiffre_affaires) * 365
        : 0,
      ratioEndettement: dernierBilan.capitaux_propres > 0
        ? dernierBilan.dettes_financieres / dernierBilan.capitaux_propres
        : 0,
    } : {
      margeNette: 0,
      margeEbitda: 0,
      ebitda: 0,
      dso: 0,
      ratioEndettement: 0,
    }

    // Détecter les anomalies (défensif)
    let anomalies: Anomalie[] = []
    try {
      anomalies = detecterAnomalies(bilans)
    } catch (anomalyError) {
      console.error('Erreur détection anomalies:', anomalyError)
    }

    // Construire le contexte initial
    const initialContext: ConversationContext = {
      entreprise: {
        siren: entreprise.siren,
        nom: entreprise.nom,
        secteur: secteurNom,
        codeNaf: entreprise.codeNaf || '',
        dateCreation: entreprise.dateCreation,
        effectif: entreprise.trancheEffectif || entreprise.effectif?.toString() || 'Non renseigné',
        adresse: entreprise.adresse,
        ville: entreprise.ville,
      },
      financials: {
        bilans,
        ratios,
        anomaliesDetectees: anomalies,
      },
      documents: [],
      responses: {},
      evaluationProgress: {
        step: 1,
        completedTopics: [],
        pendingTopics: ['Découverte', 'Finances', 'Actifs', 'Équipe', 'Marché', 'Synthèse'],
      },
    }

    // Injecter les données financières extraites depuis l'évaluation (si disponibles)
    const evaluationId = request.nextUrl.searchParams.get('evaluationId')
    if (evaluationId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: evalData } = await (createServiceClient() as any)
          .from('evaluations')
          .select('extracted_financials, pappers_doc_status')
          .eq('id', evaluationId)
          .single()

        if (evalData?.extracted_financials) {
          initialContext.extractedDocData = evalData.extracted_financials
        }

        // Déclencher le fetch Pappers si pas encore fait
        if (!evalData || evalData.pappers_doc_status === 'not_started') {
          fetchPappersDocuments(evaluationId, cleanSiren)
            .catch(err => console.warn('[Documents] Erreur fetch Pappers:', err))
        }
      } catch (err) {
        console.warn('[Entreprise] Erreur chargement extracted_financials:', err)
      }
    }

    // Données pour le composant
    const entrepriseData = {
      siren: entreprise.siren,
      nom: entreprise.nom,
      secteur: secteurNom,
      codeNaf: entreprise.codeNaf || '',
      dateCreation: entreprise.dateCreation,
      effectif: entreprise.trancheEffectif || (entreprise.effectif != null ? `${entreprise.effectif} salariés` : 'Non renseigné'),
      adresse: entreprise.adresse,
      ville: entreprise.ville,
      chiffreAffaires: entreprise.chiffreAffaires || undefined,
    }

    const responsePayload = {
      entreprise: entrepriseData,
      initialContext,
    }

    // ============================================
    // 5. STOCKER EN CACHE (fire-and-forget)
    // ============================================
    setCachedEntreprise(cleanSiren, entreprise, responsePayload)
      .catch(err => console.warn('[Entreprise] Erreur écriture cache:', err))

    return NextResponse.json(responsePayload, {
      headers: { 'X-Data-Source': 'pappers' },
    })
  } catch (buildError) {
    console.error('Erreur construction réponse entreprise:', buildError)
    return NextResponse.json(
      { error: 'Erreur lors du traitement des données', code: 'PROCESSING_ERROR' },
      { status: 500 }
    )
  }
}
