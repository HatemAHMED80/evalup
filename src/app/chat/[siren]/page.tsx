'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { ChatLayout } from '@/components/chat/ChatLayout'
import type { ConversationContext } from '@/lib/anthropic'
import type { UserParcours } from '@/lib/prompts/parcours'

interface EntrepriseData {
  siren: string
  nom: string
  secteur: string
  codeNaf: string
  dateCreation: string
  effectif: string
  adresse: string
  ville: string
  formeJuridique?: string
  capitalSocial?: number
  chiffreAffaires?: number
  financier?: {
    chiffreAffaires: number
    resultatNet: number
    anneeDernierBilan: number
  }
}

interface BentoGridData {
  financier?: {
    chiffreAffaires: number
    resultatNet: number
    ebitdaComptable: number
    tresorerie: number
    dettes: number
    capitauxPropres: number
    anneeDernierBilan: number
  }
  valorisation?: {
    valeurEntreprise: { basse: number; moyenne: number; haute: number }
    prixCession: { basse: number; moyenne: number; haute: number }
    detteNette: number
    multipleSectoriel: { min: number; max: number }
    methodePrincipale: string
  }
  ratios?: {
    margeNette: number
    margeEbitda: number
    ratioEndettement: number
    roe: number
  }
  diagnostic?: {
    noteGlobale: string
    score: number
    pointsForts: string[]
    pointsVigilance: string[]
  }
  dataQuality?: {
    dataYear: number
    dataAge: number
    isDataOld: boolean
    confidence: 'faible' | 'moyenne' | 'haute'
  }
}

export default function ChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const siren = params.siren as string
  const parcours = searchParams.get('parcours') as UserParcours | null
  const upgradeSuccess = searchParams.get('upgrade') === 'success'

  const [entreprise, setEntreprise] = useState<EntrepriseData | null>(null)
  const [context, setContext] = useState<ConversationContext | null>(null)
  const [bentoGridData, setBentoGridData] = useState<BentoGridData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/entreprise/${siren}/quick-valuation`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Entreprise non trouvee')
          return
        }

        const entrepriseData: EntrepriseData = {
          ...data.entreprise,
          chiffreAffaires: data.entreprise.financier?.chiffreAffaires,
        }
        setEntreprise(entrepriseData)

        // Stocker les données pour le bento grid
        setBentoGridData({
          financier: data.financier,
          valorisation: data.valorisation,
          ratios: data.ratios,
          diagnostic: data.diagnostic,
          dataQuality: data.dataQuality,
        })

        // Creer le contexte initial
        const initialContext: ConversationContext = {
          entreprise: {
            siren: entrepriseData.siren,
            nom: entrepriseData.nom,
            secteur: entrepriseData.secteur,
            codeNaf: entrepriseData.codeNaf,
            dateCreation: entrepriseData.dateCreation,
            effectif: entrepriseData.effectif,
            adresse: entrepriseData.adresse,
            ville: entrepriseData.ville,
          },
          parcours: parcours || undefined,
          financials: {
            // Utiliser les bilans historiques (3 ans) si disponibles, sinon construire depuis financier
            bilans: data.bilansHistorique?.length > 0
              ? data.bilansHistorique
              : data.financier ? [{
                  annee: data.financier.anneeDernierBilan || new Date().getFullYear() - 1,
                  chiffre_affaires: data.financier.chiffreAffaires || 0,
                  resultat_net: data.financier.resultatNet || 0,
                  resultat_exploitation: data.financier.resultatExploitation || 0,
                  dotations_amortissements: data.financier.dotationsAmortissements || 0,
                  stocks: data.financier.stocks || 0,
                  creances_clients: data.financier.creancesClients || 0,
                  tresorerie: data.financier.tresorerie || 0,
                  capitaux_propres: data.financier.capitauxPropres || 0,
                  dettes_financieres: data.financier.dettes || 0,
                  dettes_fournisseurs: data.financier.dettesFournisseurs || 0,
                  provisions: data.financier.provisions || 0,
                }] : [],
            ratios: data.ratios || {
              margeNette: 0,
              ebitda: 0,
              margeEbitda: 0,
            },
            anomaliesDetectees: [],
          },
          documents: [],
          responses: {},
          evaluationProgress: {
            step: 1,
            completedTopics: [],
            pendingTopics: ['Activite', 'Finances', 'Marche', 'Risques', 'Valorisation', 'Synthese'],
          },
        }
        setContext(initialContext)
      } catch (err) {
        setError('Erreur de chargement')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [siren, parcours])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-3 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !entreprise || !context) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[var(--danger)] mb-4">{error || 'Erreur inconnue'}</p>
          <a href="/" className="text-[var(--accent)] hover:underline">
            Retour a l&apos;accueil
          </a>
        </div>
      </div>
    )
  }

  return <ChatLayout entreprise={entreprise} initialContext={context} bentoGridData={bentoGridData || undefined} upgradeSuccess={upgradeSuccess} />
}
