'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChatInterface } from './ChatInterface'
import { Sidebar } from './Sidebar'
import { DataPanel } from '@/components/evaluation/DataPanel'
import { DataToast } from './DataToast'
import { SidebarDrawer } from '@/components/evaluation/SidebarDrawer'
import type { ConversationContext } from '@/lib/anthropic'
import {
  getEvaluations,
  saveEvaluation,
  updateEvaluationStep,
  deleteEvaluation,
  type SavedEvaluation,
} from '@/lib/evaluations'
import { ARCHETYPES } from '@/lib/valuation/archetypes'
import { contextToPanel, computeOverallCompleteness } from '@/components/evaluation/dataPanelBridge'

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
}

export function ChatLayout({ evaluationId, entreprise, initialContext }: ChatLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Desktop — collapsed by default
  const [currentStep, setCurrentStep] = useState(initialContext.evaluationProgress.step)
  const [context, setContext] = useState<ConversationContext>(initialContext)
  const [dataPanelOpen, setDataPanelOpen] = useState(false) // Mobile drawer
  const [dataPanelVisible, setDataPanelVisible] = useState(false) // Desktop toggle — starts CLOSED
  const [highlightedFields, setHighlightedFields] = useState<string[]>([])
  const [toast, setToast] = useState<{ label: string; value: string } | null>(null)
  const [evaluations, setEvaluations] = useState<SavedEvaluation[]>([])

  // Completeness for header badge
  const panel = useMemo(() => contextToPanel(context), [context])
  const overallCompleteness = useMemo(
    () => computeOverallCompleteness(panel, context.archetype),
    [panel, context.archetype]
  )

  // Field highlight callback (auto-clear after 3s)
  const handleFieldsMentioned = useCallback((fields: string[]) => {
    setHighlightedFields(fields)
    setTimeout(() => setHighlightedFields([]), 3000)
  }, [])

  // Field change toast callback
  const handleFieldChange = useCallback((label: string, value: string) => {
    setToast({ label, value })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

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
            {context.archetype && ARCHETYPES[context.archetype] && (
              <p className="text-xs text-[var(--text-muted)] truncate">
                {ARCHETYPES[context.archetype].icon} {ARCHETYPES[context.archetype].name}
                {context.objectif ? ` · ${context.objectif.charAt(0).toUpperCase() + context.objectif.slice(1)}` : ''}
              </p>
            )}
          </div>

          <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-[var(--radius-full)] whitespace-nowrap">
            Étape {currentStep}/6
          </div>

          {/* Toggle data panel — desktop */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setDataPanelOpen(true)
              } else {
                setDataPanelVisible(!dataPanelVisible)
              }
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-[var(--radius-md)] transition-colors ${
              dataPanelVisible
                ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]'
            }`}
            title={dataPanelVisible ? 'Masquer les donnees' : 'Afficher les donnees'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-12.75A1.125 1.125 0 013.375 4.5h17.25c.621 0 1.125.504 1.125 1.125v12.75m-20.625 0h20.625m0 0a1.125 1.125 0 01-1.125 1.125m1.125-1.125V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m0 0h-7.5" />
            </svg>
            Donnees
            {!dataPanelVisible && overallCompleteness > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--accent-light)] text-[var(--accent)] rounded-[var(--radius-full)]">
                {overallCompleteness}%
              </span>
            )}
          </button>
        </header>

        {/* Chat + Data Panel area */}
        <main className="flex-1 overflow-hidden bg-[var(--bg-primary)] flex">
          {/* Chat — takes remaining space */}
          <div className="flex-1 min-w-0 relative">
            <ChatInterface
              entreprise={entreprise}
              context={context}
              onContextChange={setContext}
              onStepChange={handleStepChange}
              onOpenDataPanel={() => {
                if (window.innerWidth < 768) {
                  setDataPanelOpen(true)
                } else {
                  setDataPanelVisible(true)
                }
              }}
              onCloseDataPanel={() => setDataPanelVisible(false)}
              dataPanelVisible={dataPanelVisible}
              onFieldsMentioned={handleFieldsMentioned}
            />
            {toast && (
              <DataToast label={toast.label} value={toast.value} onDismiss={dismissToast} />
            )}
          </div>

          {/* Data Panel — desktop, animated width (50%, min 450px, max 600px) */}
          <div className={`hidden md:block flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${dataPanelVisible ? 'w-[50%] min-w-[450px] max-w-[600px]' : 'w-0'}`}>
            <div className="min-w-[450px] h-full">
              <DataPanel
                context={context}
                onContextChange={setContext}
                evaluationId={evaluationId}
                onClose={() => setDataPanelVisible(false)}
                highlightedFields={highlightedFields}
                onFieldChange={handleFieldChange}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile FAB — open data panel drawer */}
      <button
        onClick={() => setDataPanelOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full bg-[var(--accent)] text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform animate-fade-up"
        aria-label="Ouvrir les donnees"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-12.75A1.125 1.125 0 013.375 4.5h17.25c.621 0 1.125.504 1.125 1.125v12.75m-20.625 0h20.625m0 0a1.125 1.125 0 01-1.125 1.125m1.125-1.125V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m0 0h-7.5" />
        </svg>
        {overallCompleteness > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[9px] font-bold bg-white text-[var(--accent)] rounded-full shadow-sm">
            {overallCompleteness}%
          </span>
        )}
      </button>

      {/* Mobile drawer */}
      <SidebarDrawer isOpen={dataPanelOpen} onClose={() => setDataPanelOpen(false)}>
        <DataPanel
          context={context}
          onContextChange={setContext}
          evaluationId={evaluationId}
          onClose={() => setDataPanelOpen(false)}
          highlightedFields={highlightedFields}
          onFieldChange={handleFieldChange}
        />
      </SidebarDrawer>
    </div>
  )
}
