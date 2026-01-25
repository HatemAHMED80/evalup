// Page de chat IA pour l'évaluation d'entreprise

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { rechercherEntreprise, isPappersConfigured, PappersError } from '@/lib/pappers'
import { isAnthropicConfigured } from '@/lib/anthropic'
import { detecterSecteur, getNomSecteur } from '@/lib/prompts'
import { detecterAnomalies, convertirBilansNormalises } from '@/lib/analyse/anomalies'
import { ChatLayout } from '@/components/chat'
import type { ConversationContext, BilanAnnuel, RatiosFinanciers, Anomalie } from '@/lib/anthropic'

interface PageProps {
  params: Promise<{ siren: string }>
}

export default async function ChatPage({ params }: PageProps) {
  const { siren } = await params

  // Vérifier les configurations
  if (!isPappersConfigured()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Configuration requise</h1>
          <p className="text-gray-600 mb-6">
            L&apos;API Pappers n&apos;est pas configurée. Ajoute <code className="bg-gray-100 px-1 rounded">PAPPERS_API_KEY</code> dans .env.local
          </p>
          <Link href="/" className="btn-secondary">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  if (!isAnthropicConfigured()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">API Claude non configurée</h1>
          <p className="text-gray-600 mb-6">
            Ajoute <code className="bg-gray-100 px-1 rounded">ANTHROPIC_API_KEY</code> dans .env.local pour activer l&apos;agent IA
          </p>
          <Link href="/" className="btn-secondary">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  // Récupérer les données de l'entreprise
  let entreprise
  try {
    entreprise = await rechercherEntreprise(siren)
  } catch (error) {
    if (error instanceof PappersError && error.code === 'NOT_FOUND') {
      notFound()
    }
    throw error
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

  return (
    <ChatLayout
      entreprise={entrepriseData}
      initialContext={initialContext}
    />
  )
}
