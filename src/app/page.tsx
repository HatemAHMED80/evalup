'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/chat/Sidebar'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { getEvaluations, type SavedEvaluation } from '@/lib/evaluations'

const exemplesSiren = [
  { siren: '443061841', nom: 'Google France' },
  { siren: '542107651', nom: 'Engie' },
  { siren: '552081317', nom: 'EDF' },
]

export default function Home() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [evaluations, setEvaluations] = useState<SavedEvaluation[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Charger les évaluations après le montage (côté client)
  useEffect(() => {
    const saved = getEvaluations()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Chargement initial nécessaire
    setEvaluations(saved)
  }, [])

  // Message d'accueil
  const welcomeMessage = {
    id: 'welcome',
    role: 'assistant' as const,
    content: `# Évaluez une entreprise

Estimation instantanée basée sur l'IA et les données officielles.

Je suis votre assistant expert en évaluation d'entreprises. Je vais analyser les données financières, le secteur d'activité et les spécificités de l'entreprise pour vous fournir une estimation précise.

**Pour commencer, entrez le numéro SIREN de l'entreprise à évaluer (9 chiffres).**

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

    try {
      // Vérifier que l'entreprise existe
      const response = await fetch(`/api/entreprise/${cleanSiren}`)
      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'NOT_FOUND') {
          setError('Entreprise non trouvée. Vérifiez le numéro SIREN.')
        } else if (data.code === 'INVALID_SIREN') {
          setError('Le SIREN doit contenir 9 chiffres')
        } else {
          setError(data.error || 'Erreur lors de la recherche')
        }
        setIsLoading(false)
        return
      }

      // Rediriger vers la page de chat
      router.push(`/chat/${cleanSiren}`)
    } catch {
      setError('Erreur de connexion. Réessayez.')
      setIsLoading(false)
    }
  }

  const handleExemple = (sirenExemple: string) => {
    setInput(formatSiren(sirenExemple))
    setError('')
  }

  return (
    <div className="h-screen flex bg-[#1a1a2e]">
      {/* Sidebar */}
      <Sidebar
        entreprise={{
          nom: 'Nouvelle évaluation',
          secteur: '',
          siren: '',
        }}
        currentStep={0}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        evaluations={evaluations}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="relative z-10 flex items-center gap-3 px-4 py-4 bg-[#1a1a2e] shadow-lg shadow-black/20">
          {/* Toggle sidebar button */}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setSidebarOpen(true)
              } else {
                setSidebarCollapsed(!sidebarCollapsed)
              }
            }}
            className="p-2 -ml-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors"
            title={sidebarCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
          >
            {sidebarCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-white truncate">Nouvelle évaluation</h1>
          </div>
        </header>

        {/* Chat area */}
        <main className="flex-1 overflow-hidden bg-[#1a1a2e]">
          <div className="flex flex-col h-full relative">
            {/* Zone de messages - scrollable */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-0">
              <div className="max-w-3xl mx-auto space-y-4 pb-4">
                {/* Message d'accueil */}
                <MessageBubble message={welcomeMessage} />

                {/* Suggestions d'entreprises */}
                <div className="flex justify-start">
                  <div className="flex-shrink-0 mr-3 w-8" />
                  <div className="flex flex-wrap gap-2">
                    {exemplesSiren.map((exemple) => (
                      <button
                        key={exemple.siren}
                        onClick={() => handleExemple(exemple.siren)}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        {exemple.nom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message d'erreur */}
                {error && (
                  <div className="flex justify-start">
                    <div className="flex-shrink-0 mr-3 w-8" />
                    <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                      {error}
                    </div>
                  </div>
                )}

                {/* Indicateur de chargement */}
                {isLoading && <TypingIndicator />}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Zone de saisie - sticky en bas */}
            <div className="sticky bottom-0 bg-[#1a1a2e] shadow-[0_-8px_20px_rgba(0,0,0,0.3)]">
              <div className="p-4">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                  <div className="relative bg-white/5 rounded-2xl border border-white/20 focus-within:border-[#c9a227] focus-within:ring-2 focus-within:ring-[#c9a227]/20 transition-all">
                    <div className="flex items-end gap-2 p-2">
                      {/* Icône SIREN */}
                      <div className="p-3 text-white/50">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="flex-1 bg-transparent px-2 py-2 resize-none focus:outline-none text-white placeholder:text-white/40 text-lg"
                        rows={1}
                        disabled={isLoading}
                      />

                      <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-2.5 bg-[#c9a227] text-[#1a1a2e] rounded-xl hover:bg-[#e8c547] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

                  <p className="text-xs text-white/30 mt-2 text-center">
                    Entrée pour rechercher • <Link href="/evaluation" className="hover:text-white/50 underline">Remplir manuellement</Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
