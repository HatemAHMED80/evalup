'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/chat/Sidebar'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { InstantValuation } from '@/components/chat/InstantValuation'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { getEvaluations, type SavedEvaluation } from '@/lib/evaluations'
import type { ConversationContext } from '@/lib/anthropic'

const exemplesSiren = [
  { siren: '443061841', nom: 'Google France' },
  { siren: '542107651', nom: 'Engie' },
  { siren: '552081317', nom: 'EDF' },
]

// Type pour les donnees de valorisation rapide
interface QuickValuationData {
  entreprise: {
    siren: string
    nom: string
    secteur: string
    codeNaf: string
    dateCreation: string
    effectif: string
    adresse: string
    ville: string
  }
  hasValuation: boolean
  message?: string
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
    margeEbitda: number
    margeNette: number
    ratioEndettement: number
    roe: number
  }
  diagnostic?: {
    noteGlobale: 'A' | 'B' | 'C' | 'D' | 'E'
    score: number
    pointsForts: string[]
    pointsVigilance: string[]
  }
  avertissement?: string
}

// Phases de la page d'accueil
type PagePhase = 'input' | 'loading' | 'valuation' | 'chat'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [evaluations, setEvaluations] = useState<SavedEvaluation[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State pour le flow unifie
  const [phase, setPhase] = useState<PagePhase>('input')
  const [valuationData, setValuationData] = useState<QuickValuationData | null>(null)
  const [initialContext, setInitialContext] = useState<ConversationContext | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  // Charger les evaluations apres le montage
  useEffect(() => {
    const saved = getEvaluations()
    setEvaluations(saved)
  }, [])

  // Message d'accueil
  const welcomeMessage = {
    id: 'welcome',
    role: 'assistant' as const,
    content: `# Evaluez une entreprise

Estimation instantanee basee sur l'IA et les donnees officielles.

Je suis votre assistant expert en evaluation d'entreprises. Je vais analyser les donnees financieres, le secteur d'activite et les specificites de l'entreprise pour vous fournir une estimation precise.

**Pour commencer, entrez le numero SIREN de l'entreprise a evaluer (9 chiffres).**

_Le SIREN se trouve sur le Kbis, les factures ou le site societe.com_`,
    timestamp: new Date(),
  }

  const formatSiren = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 9)
    return numbers.replace(/(\d{3})(?=\d)/g, '$1 ')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanSiren = input.replace(/\s/g, '')
    if (!/^\d{9}$/.test(cleanSiren)) {
      setError('Le SIREN doit contenir 9 chiffres')
      return
    }

    setIsLoading(true)
    setPhase('loading')

    try {
      // Appeler l'API de valorisation rapide
      const response = await fetch(`/api/entreprise/${cleanSiren}/quick-valuation`)
      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'NOT_FOUND') {
          setError('Entreprise non trouvee. Verifiez le numero SIREN.')
        } else if (data.code === 'INVALID_SIREN') {
          setError('Le SIREN doit contenir 9 chiffres')
        } else {
          setError(data.error || 'Erreur lors de la recherche')
        }
        setPhase('input')
        setIsLoading(false)
        return
      }

      // Stocker les donnees de valorisation
      setValuationData(data)
      setPhase('valuation')
      setIsLoading(false)
    } catch {
      setError('Erreur de connexion. Reessayez.')
      setPhase('input')
      setIsLoading(false)
    }
  }

  // Continuer vers le chat
  const handleContinueToChat = async () => {
    if (!valuationData) return

    setIsLoading(true)

    try {
      // Charger le contexte complet pour le chat
      const response = await fetch(`/api/entreprise/${valuationData.entreprise.siren}`)
      const data = await response.json()

      if (!response.ok) {
        setError('Erreur lors du chargement des donnees')
        setIsLoading(false)
        return
      }

      setInitialContext(data.initialContext)
      setPhase('chat')
      setIsLoading(false)
    } catch {
      setError('Erreur de connexion')
      setIsLoading(false)
    }
  }

  const handleExemple = (sirenExemple: string) => {
    setInput(formatSiren(sirenExemple))
    setError('')
  }

  // Nouvelle evaluation (reset)
  const handleNewEvaluation = () => {
    setPhase('input')
    setValuationData(null)
    setInitialContext(null)
    setInput('')
    setError('')
    setCurrentStep(1)
  }

  // Donnees entreprise pour la sidebar et le chat
  const entrepriseData = valuationData ? {
    siren: valuationData.entreprise.siren,
    nom: valuationData.entreprise.nom,
    secteur: valuationData.entreprise.secteur,
    codeNaf: valuationData.entreprise.codeNaf,
    dateCreation: valuationData.entreprise.dateCreation,
    effectif: valuationData.entreprise.effectif,
    adresse: valuationData.entreprise.adresse,
    ville: valuationData.entreprise.ville,
    chiffreAffaires: valuationData.financier?.chiffreAffaires,
  } : null

  return (
    <div className="h-screen-safe flex bg-[#1a1a2e] no-overscroll">
      {/* Sidebar */}
      <Sidebar
        entreprise={entrepriseData ? {
          nom: entrepriseData.nom,
          secteur: entrepriseData.secteur,
          siren: entrepriseData.siren,
        } : {
          nom: 'Nouvelle evaluation',
          secteur: '',
          siren: '',
        }}
        currentStep={currentStep}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        evaluations={evaluations}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="relative z-10 flex items-center gap-3 px-4 py-3 sm:py-4 pt-safe bg-[#1a1a2e] shadow-lg shadow-black/20">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setSidebarOpen(true)
              } else {
                setSidebarCollapsed(!sidebarCollapsed)
              }
            }}
            className="p-2.5 sm:p-2 -ml-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors touch-target"
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
            <h1 className="text-sm font-medium text-white truncate">
              {phase === 'chat' && entrepriseData ? entrepriseData.nom : 'Nouvelle evaluation'}
            </h1>
          </div>

          {phase === 'chat' && (
            <div className="text-xs text-white/60 bg-white/10 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-full whitespace-nowrap">
              Etape {currentStep}/6
            </div>
          )}

          {(phase === 'valuation' || phase === 'chat') && (
            <button
              onClick={handleNewEvaluation}
              className="p-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors"
              title="Nouvelle evaluation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </header>

        {/* Zone principale */}
        <main className="flex-1 overflow-hidden bg-[#1a1a2e]">
          {/* Phase: Chat complet */}
          {phase === 'chat' && entrepriseData && initialContext ? (
            <ChatInterface
              entreprise={entrepriseData}
              initialContext={initialContext}
              onStepChange={setCurrentStep}
            />
          ) : (
            /* Phases: Input, Loading, Valuation */
            <div className="flex flex-col h-full relative">
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-0 scroll-smooth-mobile">
                <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 pb-4">

                  {/* Phase Input: Message d'accueil */}
                  {phase === 'input' && (
                    <>
                      <MessageBubble message={welcomeMessage} />

                      {/* Suggestions d'entreprises */}
                      <div className="flex justify-start">
                        <div className="flex-shrink-0 mr-2 sm:mr-3 w-8" />
                        <div className="flex flex-wrap gap-2">
                          {exemplesSiren.map((exemple) => (
                            <button
                              key={exemple.siren}
                              onClick={() => handleExemple(exemple.siren)}
                              className="px-3.5 py-2 sm:px-3 sm:py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors touch-target"
                            >
                              {exemple.nom}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Phase Loading */}
                  {phase === 'loading' && (
                    <>
                      <MessageBubble message={welcomeMessage} />
                      <TypingIndicator />
                      <div className="flex justify-start">
                        <div className="flex-shrink-0 mr-2 sm:mr-3 w-8" />
                        <p className="text-white/50 text-sm animate-pulse">
                          Analyse des donnees financieres en cours...
                        </p>
                      </div>
                    </>
                  )}

                  {/* Phase Valuation: Affichage du resultat */}
                  {phase === 'valuation' && valuationData && (
                    <InstantValuation
                      data={valuationData}
                      onContinue={handleContinueToChat}
                    />
                  )}

                  {/* Message d'erreur */}
                  {error && (
                    <div className="flex justify-start">
                      <div className="flex-shrink-0 mr-2 sm:mr-3 w-8" />
                      <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 sm:px-4 py-2">
                        {error}
                      </div>
                    </div>
                  )}

                  {/* Indicateur de chargement pendant transition vers chat */}
                  {isLoading && phase === 'valuation' && (
                    <div className="flex justify-center py-4">
                      <div className="flex items-center gap-2 text-white/60">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-sm">Chargement de l'evaluation...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Zone de saisie - uniquement en phase input */}
              {phase === 'input' && (
                <div className="sticky bottom-0 bg-[#1a1a2e] shadow-[0_-8px_20px_rgba(0,0,0,0.3)] sticky-input-mobile">
                  <div className="p-3 sm:p-4 pb-safe">
                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                      <div className="relative bg-white/5 rounded-2xl border border-white/20 focus-within:border-[#c9a227] focus-within:ring-2 focus-within:ring-[#c9a227]/20 transition-all">
                        <div className="flex items-end gap-1.5 sm:gap-2 p-1.5 sm:p-2">
                          {/* Icone SIREN */}
                          <div className="p-2.5 sm:p-3 text-white/50">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>

                          <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => {
                              setInput(formatSiren(e.target.value))
                              setError('')
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit(e)
                              }
                            }}
                            placeholder="Entrez un SIREN (ex: 443 061 841)"
                            className="flex-1 bg-transparent px-2 py-2.5 sm:py-2 resize-none focus:outline-none text-white placeholder:text-white/40 text-base sm:text-lg"
                            rows={1}
                            disabled={isLoading}
                          />

                          <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="p-3 sm:p-2.5 bg-[#c9a227] text-[#1a1a2e] rounded-xl hover:bg-[#e8c547] disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-target"
                          >
                            {isLoading ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-white/30 mt-2 text-center hidden sm:block">
                        Entree pour rechercher | <Link href="/evaluation" className="hover:text-white/50 underline">Remplir manuellement</Link>
                      </p>
                      <p className="text-xs text-white/30 mt-2 text-center sm:hidden">
                        <Link href="/evaluation" className="hover:text-white/50 underline">Remplir manuellement</Link>
                      </p>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
