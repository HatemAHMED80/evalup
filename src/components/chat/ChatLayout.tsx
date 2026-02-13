'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChatInterface } from './ChatInterface'
import { Sidebar } from './Sidebar'
import type { ConversationContext } from '@/lib/anthropic'
import {
  getEvaluations,
  saveEvaluation,
  updateEvaluationStep,
  deleteEvaluation,
  type SavedEvaluation,
} from '@/lib/evaluations'

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

interface ChatLayoutProps {
  evaluationId?: string
  entreprise: {
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
  initialContext: ConversationContext
  bentoGridData?: BentoGridData
}

export function ChatLayout({ evaluationId, entreprise, initialContext, bentoGridData }: ChatLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Desktop
  const [currentStep, setCurrentStep] = useState(initialContext.evaluationProgress.step)
  const [evaluations, setEvaluations] = useState<SavedEvaluation[]>([])

  // Charger les évaluations et sauvegarder l'évaluation actuelle au montage
  useEffect(() => {
    // Sauvegarder l'évaluation actuelle
    saveEvaluation({
      siren: entreprise.siren,
      nom: entreprise.nom,
      secteur: entreprise.secteur,
      dateCreation: entreprise.dateCreation,
      currentStep: currentStep,
      evaluationId: evaluationId,
    })

    // Charger toutes les évaluations
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Chargement initial nécessaire
    setEvaluations(getEvaluations())
  }, [entreprise, currentStep, evaluationId])

  // Mettre à jour l'étape
  const handleStepChange = (step: number) => {
    setCurrentStep(step)
    updateEvaluationStep(entreprise.siren, step)
    setEvaluations(getEvaluations())
  }

  // Supprimer une évaluation
  const handleDeleteEvaluation = (siren: string) => {
    deleteEvaluation(siren)
    setEvaluations(getEvaluations())
  }

  // Nouvelle évaluation
  const handleNewEvaluation = () => {
    router.push('/evaluation/new')
  }

  // Sélectionner une évaluation existante
  const handleSelectEvaluation = (siren: string) => {
    const evaluation = evaluations.find(e => e.siren === siren)
    if (evaluation?.evaluationId) {
      router.push(`/evaluation/${evaluation.evaluationId}/chat`)
    } else {
      router.push(`/evaluation/${siren}/chat`)
    }
  }

  return (
    <div className="h-screen-safe flex bg-[var(--bg-primary)] no-overscroll">
      {/* Sidebar */}
      <Sidebar
        entreprise={{
          nom: entreprise.nom,
          secteur: entreprise.secteur,
          siren: entreprise.siren,
        }}
        currentStep={currentStep}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        evaluations={evaluations}
        onDeleteEvaluation={handleDeleteEvaluation}
        onNewEvaluation={handleNewEvaluation}
        onSelectEvaluation={handleSelectEvaluation}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - with safe area top for notch */}
        <header className="relative z-10 flex items-center gap-3 px-4 py-3 sm:py-4 pt-safe bg-[var(--bg-primary)] border-b border-[var(--border)] shadow-[var(--shadow-xs)]">
          {/* Toggle sidebar button - larger touch target on mobile */}
          <button
            onClick={() => {
              // Mobile: open sidebar
              // Desktop: collapse/expand
              if (window.innerWidth < 1024) {
                setSidebarOpen(true)
              } else {
                setSidebarCollapsed(!sidebarCollapsed)
              }
            }}
            className="p-2.5 sm:p-2 -ml-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] transition-colors touch-target"
            title={sidebarCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
          >
            {sidebarCollapsed ? (
              <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-sm font-medium text-[var(--text-primary)] truncate">{entreprise.nom}</h1>
          </div>

          <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-[var(--radius-full)] whitespace-nowrap">
            Étape {currentStep}/6
          </div>
        </header>

        {/* Chat area */}
        <main className="flex-1 overflow-hidden bg-[var(--bg-primary)]">
          <ChatInterface
            entreprise={entreprise}
            initialContext={initialContext}
            onStepChange={handleStepChange}
            bentoGridData={bentoGridData}
          />
        </main>
      </div>
    </div>
  )
}
