'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SavedEvaluation } from '@/lib/evaluations'
import { formatRelativeDate } from '@/lib/evaluations'

interface SidebarProps {
  entreprise: {
    nom: string
    secteur: string
    siren: string
  }
  currentStep: number
  isOpen: boolean
  isCollapsed: boolean
  onToggle: () => void
  onCollapse: () => void
  evaluations: SavedEvaluation[]
  onDeleteEvaluation?: (siren: string) => void
}

const steps = [
  { num: 1, name: 'Découverte', icon: '🔍' },
  { num: 2, name: 'Finances', icon: '📊' },
  { num: 3, name: 'Actifs', icon: '🏢' },
  { num: 4, name: 'Équipe', icon: '👥' },
  { num: 5, name: 'Marché', icon: '🎯' },
  { num: 6, name: 'Synthèse', icon: '✨' },
]

export function Sidebar({
  entreprise,
  currentStep,
  isOpen,
  isCollapsed,
  onToggle,
  onCollapse,
  evaluations,
  onDeleteEvaluation,
}: SidebarProps) {
  const [learnMoreOpen, setLearnMoreOpen] = useState(false)
  const [showAllEvaluations, setShowAllEvaluations] = useState(false)

  // Afficher les 5 premières ou toutes
  const displayedEvaluations = showAllEvaluations ? evaluations : evaluations.slice(0, 5)
  const hasMoreEvaluations = evaluations.length > 5

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-[#1a1a2e] text-white
          border-r border-white/10
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'lg:w-16' : 'lg:w-72'}
          lg:translate-x-0
          w-72 flex flex-col
        `}
      >
        {/* Logo / Header */}
        <div className={`p-4 border-b border-white/10 ${isCollapsed ? 'lg:px-3' : ''}`}>
          <Link
            href="/"
            onClick={() => {
              // Fermer la sidebar sur mobile
              if (window.innerWidth < 1024 && isOpen) {
                onToggle()
              }
            }}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c9a227] to-[#e8c547] flex items-center justify-center flex-shrink-0">
              <span className="text-[#1a1a2e] font-bold text-sm">E</span>
            </div>
            <span className={`font-semibold transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : ''}`}>
              EvalUp
            </span>
          </Link>
        </div>

        {/* Nouvelle évaluation */}
        <div className={`p-3 border-b border-white/10 ${isCollapsed ? 'lg:p-2' : ''}`}>
          <Link
            href="/"
            onClick={() => {
              // Fermer la sidebar sur mobile
              if (window.innerWidth < 1024 && isOpen) {
                onToggle()
              }
            }}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm text-white/80 bg-white/5 hover:bg-white/10 rounded-lg transition-colors ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
            title="Nouvelle évaluation"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className={`${isCollapsed ? 'lg:hidden' : ''}`}>Nouvelle évaluation</span>
          </Link>
        </div>

        {/* Historique des évaluations */}
        <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'lg:hidden' : ''}`}>
          {/* Évaluation actuelle - seulement si une entreprise est sélectionnée */}
          {entreprise.siren && currentStep > 0 && (
            <div className="p-3 border-b border-white/10">
              <div className="text-xs text-white/40 uppercase tracking-wide mb-2 px-2">Actuelle</div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="font-medium text-white/90 text-sm truncate">{entreprise.nom}</div>
                <div className="text-xs text-white/50 truncate mt-0.5">{entreprise.secteur}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#c9a227] to-[#e8c547] rounded-full transition-all duration-500"
                      style={{ width: `${(currentStep / 6) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/50">{currentStep}/6</span>
                </div>
              </div>
            </div>
          )}

          {/* Liste des évaluations précédentes */}
          {evaluations.length > 0 && (
            <div className="p-3">
              <div className="text-xs text-white/40 uppercase tracking-wide mb-2 px-2">Historique</div>
              <div className="space-y-1">
                {displayedEvaluations.map((evaluation) => {
                  const isCurrent = evaluation.siren === entreprise.siren
                  if (isCurrent) return null

                  return (
                    <div key={evaluation.id} className="group relative">
                      <Link
                        href={`/?siren=${evaluation.siren}`}
                        onClick={() => {
                          // Fermer la sidebar sur mobile
                          if (window.innerWidth < 1024 && isOpen) {
                            onToggle()
                          }
                        }}
                        className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-white/50">{evaluation.currentStep}/6</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white/80 truncate group-hover:text-white transition-colors">
                            {evaluation.nom}
                          </div>
                          <div className="text-xs text-white/40 truncate">{evaluation.secteur}</div>
                          <div className="text-xs text-white/30 mt-0.5">
                            {formatRelativeDate(evaluation.lastAccess)}
                          </div>
                        </div>
                      </Link>
                      {/* Bouton supprimer */}
                      {onDeleteEvaluation && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            onDeleteEvaluation(evaluation.siren)
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Supprimer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Voir plus / moins */}
              {hasMoreEvaluations && (
                <button
                  onClick={() => setShowAllEvaluations(!showAllEvaluations)}
                  className="w-full mt-2 px-2 py-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  {showAllEvaluations ? 'Voir moins' : `Voir tout (${evaluations.length})`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progression (mode collapsed) */}
        <div className={`flex-1 p-2 overflow-y-auto hidden ${isCollapsed ? 'lg:block' : 'lg:hidden'}`}>
          <nav className="space-y-1">
            {steps.map((step) => {
              const isActive = step.num === currentStep
              const isCompleted = step.num < currentStep
              const isPending = step.num > currentStep

              return (
                <div
                  key={step.num}
                  className={`
                    flex items-center justify-center py-2.5 rounded-lg transition-colors
                    ${isActive ? 'bg-white/10 text-white' : ''}
                    ${isCompleted ? 'text-white/70' : ''}
                    ${isPending ? 'text-white/30' : ''}
                  `}
                  title={step.name}
                >
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs
                      ${isCompleted ? 'bg-green-500/20 text-green-400' : ''}
                      ${isActive ? 'bg-[#c9a227]/20 text-[#c9a227]' : ''}
                      ${isPending ? 'bg-white/5 text-white/30' : ''}
                    `}
                  >
                    {isCompleted ? '✓' : step.num}
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Actions (mode collapsed) */}
        <div className={`p-2 border-t border-white/10 space-y-1 hidden ${isCollapsed ? 'lg:block' : ''}`}>
          <button
            className="w-full flex items-center justify-center py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Exporter"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
        </div>

        {/* Learn More - Liens légaux */}
        <div className={`border-t border-white/10 ${isCollapsed ? 'lg:hidden' : ''}`}>
          <button
            onClick={() => setLearnMoreOpen(!learnMoreOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            <span>En savoir plus</span>
            <svg
              className={`w-4 h-4 transition-transform ${learnMoreOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {learnMoreOpen && (
            <div className="px-4 pb-3 space-y-1">
              <Link
                href="/mentions-legales"
                className="block px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Mentions légales
              </Link>
              <Link
                href="/cgu"
                className="block px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Conditions d&apos;utilisation
              </Link>
              <Link
                href="/privacy"
                className="block px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Contact
              </Link>
            </div>
          )}
        </div>

        {/* Compte utilisateur */}
        <div className={`p-4 border-t border-white/10 ${isCollapsed ? 'lg:p-2' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className={`flex-1 min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
              <div className="text-sm font-medium text-white/90 truncate">Utilisateur</div>
              <div className="text-xs text-white/50">Plan gratuit</div>
            </div>
            <button className={`p-1.5 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-colors ${isCollapsed ? 'lg:hidden' : ''}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bouton collapse (desktop only) */}
        <button
          onClick={onCollapse}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#1a1a2e] border border-white/10 rounded-full items-center justify-center text-white/50 hover:text-white hover:bg-[#2a2a4e] transition-colors"
          title={isCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
        >
          <svg
            className={`w-3 h-3 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    </>
  )
}
