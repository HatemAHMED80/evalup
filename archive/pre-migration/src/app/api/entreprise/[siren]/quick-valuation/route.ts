// API Route pour une valorisation rapide instantanée (wow effect)
// Sécurisé: rate limiting, validation SIREN améliorée

import { NextRequest, NextResponse } from 'next/server'
import { rechercherEntreprise, isPappersConfigured, PappersError } from '@/lib/pappers'
import { detecterSecteur, getNomSecteur } from '@/lib/prompts'
import { evaluerEntrepriseV2 } from '@/lib/evaluation/calculateur-v2'
import { genererDiagnostic } from '@/lib/analyse/diagnostic'
import { convertirBilansNormalises } from '@/lib/analyse/anomalies'
import type { DonneesEvaluationV2, BilanAnnuel as BilanV2 } from '@/lib/evaluation/types'
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

  if (!isPappersConfigured()) {
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

  // Récupérer les données Pappers
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

  // Convertir les bilans
  const bilansNormalises = convertirBilansNormalises(entreprise.bilans)

  // Convertir au format V2 (anthropic BilanAnnuel utilise snake_case)
  const bilansV2: BilanV2[] = bilansNormalises.map(b => ({
    annee: b.annee,
    chiffreAffaires: b.chiffre_affaires,
    resultatExploitation: b.resultat_exploitation,
    dotationsAmortissements: b.dotations_amortissements,
    resultatNet: b.resultat_net,
    capitauxPropres: b.capitaux_propres,
    disponibilites: b.tresorerie, // anthropic utilise 'tresorerie'
    empruntsEtablissementsCredit: b.dettes_financieres,
    stocks: b.stocks || 0,
    creancesClients: b.creances_clients,
    dettesFournisseurs: b.dettes_fournisseurs,
    dettesFiscalesSociales: 0, // pas dispo dans anthropic BilanAnnuel
  }))

  // Pas de bilans = pas de valorisation possible
  if (bilansV2.length === 0) {
    const secteurCode = detecterSecteur(entreprise.codeNaf)
    return NextResponse.json({
      entreprise: {
        siren: entreprise.siren,
        nom: entreprise.nom,
        secteur: getNomSecteur(secteurCode),
        codeNaf: entreprise.codeNaf,
        dateCreation: entreprise.dateCreation,
        effectif: entreprise.effectif?.toString() || entreprise.trancheEffectif || 'Non renseigné',
        adresse: entreprise.adresse,
        ville: entreprise.ville,
      },
      hasValuation: false,
      message: 'Pas de données financières disponibles pour cette entreprise',
    })
  }

  // Préparer les données pour le calculateur V2
  const secteurCode = detecterSecteur(entreprise.codeNaf)
  const donneesV2: DonneesEvaluationV2 = {
    siren: entreprise.siren,
    nomEntreprise: entreprise.nom,
    codeNaf: entreprise.codeNaf,
    dateCreation: entreprise.dateCreation,
    effectif: entreprise.effectif || undefined,
    localisation: entreprise.ville,
    bilans: bilansV2,
    // Pas de retraitements pour la valorisation rapide (seront affinés dans le chat)
    retraitements: {},
  }

  // Calculer la valorisation V2
  const resultat = evaluerEntrepriseV2(donneesV2)

  // Calculer le diagnostic
  const bilanPourDiagnostic = {
    annee: bilansV2[0].annee,
    chiffreAffaires: bilansV2[0].chiffreAffaires,
    resultatExploitation: bilansV2[0].resultatExploitation,
    dotationsAmortissements: bilansV2[0].dotationsAmortissements,
    resultatNet: bilansV2[0].resultatNet,
    capitauxPropres: bilansV2[0].capitauxPropres,
    disponibilites: bilansV2[0].disponibilites,
    empruntsEtablissementsCredit: bilansV2[0].empruntsEtablissementsCredit,
    stocks: bilansV2[0].stocks,
    creancesClients: bilansV2[0].creancesClients,
    dettesFournisseurs: bilansV2[0].dettesFournisseurs,
    dettesFiscalesSociales: bilansV2[0].dettesFiscalesSociales,
  }
  const diagnostic = genererDiagnostic(bilanPourDiagnostic, secteurCode)

  // Construire la réponse
  const currentYear = new Date().getFullYear()
  const dataYear = bilansV2[0].annee
  const dataAge = currentYear - dataYear
  const isDataOld = dataAge >= 2

  return NextResponse.json({
    entreprise: {
      siren: entreprise.siren,
      nom: entreprise.nom,
      secteur: getNomSecteur(secteurCode),
      codeNaf: entreprise.codeNaf,
      dateCreation: entreprise.dateCreation,
      effectif: entreprise.effectif?.toString() || entreprise.trancheEffectif || 'Non renseigné',
      adresse: entreprise.adresse,
      ville: entreprise.ville,
    },
    hasValuation: true,
    financier: {
      chiffreAffaires: bilansV2[0].chiffreAffaires,
      resultatNet: bilansV2[0].resultatNet,
      resultatExploitation: bilansV2[0].resultatExploitation,
      dotationsAmortissements: bilansV2[0].dotationsAmortissements,
      ebitdaComptable: resultat.ebitda.ebitdaComptable,
      tresorerie: bilansV2[0].disponibilites,
      dettes: bilansV2[0].empruntsEtablissementsCredit || 0,
      capitauxPropres: bilansV2[0].capitauxPropres,
      stocks: bilansV2[0].stocks || 0,
      creancesClients: bilansV2[0].creancesClients || 0,
      dettesFournisseurs: bilansV2[0].dettesFournisseurs || 0,
      provisions: 0,
      anneeDernierBilan: bilansV2[0].annee,
    },
    // Bilans historiques (3 dernières années) pour enrichir le contexte du chat
    bilansHistorique: bilansNormalises.map(b => ({
      annee: b.annee,
      chiffre_affaires: b.chiffre_affaires,
      resultat_net: b.resultat_net,
      resultat_exploitation: b.resultat_exploitation,
      dotations_amortissements: b.dotations_amortissements || 0,
      stocks: b.stocks || 0,
      creances_clients: b.creances_clients || 0,
      tresorerie: b.tresorerie,
      capitaux_propres: b.capitaux_propres,
      dettes_financieres: b.dettes_financieres,
      dettes_fournisseurs: b.dettes_fournisseurs || 0,
      provisions: 0,
    })),
    valorisation: {
      valeurEntreprise: {
        basse: resultat.valeurEntreprise.basse,
        moyenne: resultat.valeurEntreprise.moyenne,
        haute: resultat.valeurEntreprise.haute,
      },
      prixCession: {
        basse: resultat.prixCession.basse,
        moyenne: resultat.prixCession.moyenne,
        haute: resultat.prixCession.haute,
      },
      detteNette: resultat.detteNette.detteFinanciereNette,
      multipleSectoriel: resultat.secteur.multiples.ebitda || { min: 3, max: 5 },
      methodePrincipale: resultat.methodes[0]?.nom || 'Multiple EBITDA',
    },
    ratios: {
      margeEbitda: resultat.ebitda.ebitdaComptable / bilansV2[0].chiffreAffaires,
      margeNette: bilansV2[0].resultatNet / bilansV2[0].chiffreAffaires,
      ratioEndettement: bilansV2[0].capitauxPropres > 0
        ? (bilansV2[0].empruntsEtablissementsCredit || 0) / bilansV2[0].capitauxPropres
        : 0,
      roe: bilansV2[0].capitauxPropres > 0
        ? bilansV2[0].resultatNet / bilansV2[0].capitauxPropres
        : 0,
    },
    diagnostic: {
      noteGlobale: diagnostic.synthese.noteGlobale,
      score: diagnostic.synthese.score,
      pointsForts: diagnostic.synthese.pointsForts.slice(0, 3),
      pointsVigilance: diagnostic.synthese.pointsVigilance.slice(0, 3),
    },
    dataQuality: {
      dataYear,
      dataAge,
      isDataOld,
      confidence: isDataOld ? 'faible' : dataAge === 1 ? 'moyenne' : 'haute',
    },
    avertissement: isDataOld
      ? `Attention : cette estimation est basée sur des données de ${dataYear} (${dataAge} ans). ` +
        'La situation financière actuelle peut avoir significativement évolué. ' +
        'Pour une valorisation fiable, fournissez vos données financières récentes.'
      : 'Cette estimation est basée uniquement sur les données publiques. ' +
        'Pour une valorisation précise, continuez l\'évaluation pour affiner avec vos données réelles ' +
        '(rémunération dirigeant, crédit-bail, éléments exceptionnels...).',
  })
}
