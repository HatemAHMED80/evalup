'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatLayout } from '@/components/chat/ChatLayout'
import type { ConversationContext } from '@/lib/anthropic'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EntrepriseData {
  siren: string
  nom: string
  secteur: string
  codeNaf: string
  dateCreation: string
  effectif: string
  adresse: string
  ville: string
  chiffreAffaires?: number
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

interface EvalApiResponse {
  id: string
  siren: string
  entreprise_nom?: string
  type: string
  status: string
  archetypeId?: string
  diagnosticData?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function EvaluationChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: evaluationId } = use(params)
  const router = useRouter()

  const [entreprise, setEntreprise] = useState<EntrepriseData | null>(null)
  const [context, setContext] = useState<ConversationContext | null>(null)
  const [bentoGridData, setBentoGridData] = useState<BentoGridData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Charger les données de l'évaluation (archetype, diagnostic_data)
        const evalRes = await fetch(`/api/evaluations/${evaluationId}`)
        if (evalRes.status === 401) {
          router.replace(`/connexion?redirect=/evaluation/${evaluationId}/chat`)
          return
        }
        if (evalRes.status === 402) {
          router.replace(`/checkout?eval=${evaluationId}`)
          return
        }
        if (!evalRes.ok) {
          setError('Evaluation introuvable.')
          setIsLoading(false)
          return
        }
        const evalData: EvalApiResponse = await evalRes.json()

        // 2. Charger les données entreprise depuis Pappers
        const response = await fetch(`/api/entreprise/${evalData.siren}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Entreprise non trouvee')
          setIsLoading(false)
          return
        }

        const entrepriseData: EntrepriseData = data.entreprise
        setEntreprise(entrepriseData)

        // Construire BentoGrid depuis les bilans Pappers (sans valorisation)
        const bilans = data.initialContext?.financials?.bilans || []
        const dernierBilan = bilans[0]

        if (dernierBilan) {
          const currentYear = new Date().getFullYear()
          const dataYear = dernierBilan.annee
          const dataAge = currentYear - dataYear
          const isDataOld = dataAge >= 2
          const ebitda = (dernierBilan.resultat_exploitation || 0) + (dernierBilan.dotations_amortissements || 0)

          setBentoGridData({
            financier: {
              chiffreAffaires: dernierBilan.chiffre_affaires || 0,
              resultatNet: dernierBilan.resultat_net || 0,
              ebitdaComptable: ebitda,
              tresorerie: dernierBilan.tresorerie || 0,
              dettes: dernierBilan.dettes_financieres || 0,
              capitauxPropres: dernierBilan.capitaux_propres || 0,
              anneeDernierBilan: dataYear,
            },
            ratios: {
              margeEbitda: dernierBilan.chiffre_affaires > 0 ? ebitda / dernierBilan.chiffre_affaires : 0,
              margeNette: dernierBilan.chiffre_affaires > 0 ? dernierBilan.resultat_net / dernierBilan.chiffre_affaires : 0,
              ratioEndettement: dernierBilan.capitaux_propres > 0 ? (dernierBilan.dettes_financieres || 0) / dernierBilan.capitaux_propres : 0,
              roe: dernierBilan.capitaux_propres > 0 ? dernierBilan.resultat_net / dernierBilan.capitaux_propres : 0,
            },
            dataQuality: {
              dataYear,
              dataAge,
              isDataOld,
              confidence: isDataOld ? 'faible' : dataAge === 1 ? 'moyenne' : 'haute',
            },
          })
        }

        // 3. Charger les données validées des documents (sessionStorage)
        let extractedDocData: ConversationContext['extractedDocData'] = undefined
        const validatedRaw = sessionStorage.getItem(`evalup_validated_data_${evaluationId}`)
        if (validatedRaw) {
          try {
            extractedDocData = JSON.parse(validatedRaw)
          } catch {
            // Données corrompues — on continue sans
          }
        }

        // 4. Construire le contexte enrichi
        const diag = evalData.diagnosticData as Record<string, number | string> | undefined
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
          financials: {
            bilans,
            ratios: data.initialContext?.financials?.ratios || {
              margeNette: 0,
              ebitda: 0,
              margeEbitda: 0,
            },
            anomaliesDetectees: data.initialContext?.financials?.anomaliesDetectees || [],
          },
          documents: [],
          responses: {},
          evaluationProgress: {
            step: 1,
            completedTopics: [],
            pendingTopics: ['Activite', 'Finances', 'Marche', 'Risques', 'Valorisation', 'Synthese'],
          },
          // Post-paiement
          isPaid: true,
          archetype: evalData.archetypeId,
          diagnosticData: diag ? {
            revenue: Number(diag.revenue) || 0,
            ebitda: Number(diag.ebitda) || 0,
            growth: Number(diag.growth) || 0,
            recurring: Number(diag.recurring) || 0,
            masseSalariale: Number(diag.masseSalariale) || 0,
            effectif: String(diag.effectif || ''),
          } : undefined,
          // Données extraites des documents comptables
          extractedDocData,
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
  }, [evaluationId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-3 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Chargement de votre evaluation...</p>
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

  return <ChatLayout entreprise={entreprise} initialContext={context} bentoGridData={bentoGridData || undefined} />
}
