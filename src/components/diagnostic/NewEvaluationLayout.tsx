'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/chat/Sidebar'
import { DiagnosticForm } from '@/components/diagnostic/DiagnosticForm'
import {
  getEvaluations,
  deleteEvaluation,
  type SavedEvaluation,
} from '@/lib/evaluations'

export function NewEvaluationLayout() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [evaluations, setEvaluations] = useState<SavedEvaluation[]>(() => getEvaluations())

  const handleDeleteEvaluation = (siren: string) => {
    deleteEvaluation(siren)
    setEvaluations(getEvaluations())
  }

  const handleNewEvaluation = () => {
    router.refresh()
  }

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
        entreprise={{ nom: '', secteur: '', siren: '' }}
        currentStep={0}
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
        {/* Header */}
        <header className="relative z-10 flex items-center gap-3 px-4 py-3 sm:py-4 pt-safe bg-[var(--bg-primary)] border-b border-[var(--border)] shadow-[var(--shadow-xs)]">
          <button
            onClick={() => {
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
            <h1 className="text-sm sm:text-sm font-medium text-[var(--text-primary)] truncate">Nouvelle évaluation</h1>
          </div>
        </header>

        {/* Diagnostic form area */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
          <DiagnosticForm
            embedded
            className="flex flex-col items-center justify-center px-6 py-8 min-h-full"
          />
        </main>
      </div>
    </div>
  )
}
