// API Route pour récupérer les données d'une entreprise par SIREN
// Sécurisé: rate limiting, validation SIREN améliorée

import { NextRequest, NextResponse } from 'next/server'
import { rechercherEntreprise, isPappersConfigured, PappersError } from '@/lib/pappers'
import { isAnthropicConfigured } from '@/lib/anthropic'
import { detecterSecteur, getNomSecteur } from '@/lib/prompts'
import { detecterAnomalies, convertirBilansNormalises } from '@/lib/analyse/anomalies'
import type { ConversationContext, BilanAnnuel, RatiosFinanciers, Anomalie } from '@/lib/anthropic'
import {
  optionalAuth,
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  validateAndCleanSiren,
} from '@/lib/security'

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

  // Vérifier les configurations
  if (!isPappersConfigured()) {
    return NextResponse.json(
      { error: 'Service temporairement indisponible', code: 'SERVICE_UNAVAILABLE' },
      { status: 503 }
    )
  }

  if (!isAnthropicConfigured()) {
    return NextResponse.json(
      { error: 'Service temporairement indisponible', code: 'SERVICE_UNAVAILABLE' },
      { status: 503 }
    )
  }

  // Valider le SIREN avec algorithme de Luhn
  const sirenValidation = validateAndCleanSiren(siren)
  if (!sirenValidation.valid) {
    return NextResponse.json(
      { error: sirenValidation.error, code: 'INVALID_SIREN' },
      { status: 400 }
    )
  }
  const cleanSiren = sirenValidation.cleaned!

  // Récupérer les données de l'entreprise
  let entreprise
  try {
    entreprise = await rechercherEntreprise(cleanSiren)
  } catch (error) {
    if (error instanceof PappersError && error.code === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'Entreprise non trouvée', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    console.error('Erreur Pappers:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recherche', code: 'SEARCH_ERROR' },
      { status: 500 }
    )
  }

  // Détecter le secteur
  const secteurCode = detecterSecteur(entreprise.codeNaf)
  const secteurNom = getNomSecteur(secteurCode)

  // Convertir les bilans au format attendu
  const bilans: BilanAnnuel[] = convertirBilansNormalises(entreprise.bilans)

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

  // Détecter les anomalies
  const anomalies: Anomalie[] = detecterAnomalies(bilans)

  // Construire le contexte initial
  const initialContext: ConversationContext = {
    entreprise: {
      siren: entreprise.siren,
      nom: entreprise.nom,
      secteur: secteurNom,
      codeNaf: entreprise.codeNaf,
      dateCreation: entreprise.dateCreation,
      effectif: entreprise.effectif?.toString() || entreprise.trancheEffectif || 'Non renseigné',
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

  // Données pour le composant
  const entrepriseData = {
    siren: entreprise.siren,
    nom: entreprise.nom,
    secteur: secteurNom,
    codeNaf: entreprise.codeNaf,
    dateCreation: entreprise.dateCreation,
    effectif: entreprise.effectif?.toString() || entreprise.trancheEffectif || 'Non renseigné',
    adresse: entreprise.adresse,
    ville: entreprise.ville,
    chiffreAffaires: entreprise.chiffreAffaires || undefined,
  }

  return NextResponse.json({
    entreprise: entrepriseData,
    initialContext,
  })
}
