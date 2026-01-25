// Homepage - Style IA/Product moderne

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const exemplesSiren = [
  { siren: '443061841', nom: 'Google France' },
  { siren: '542107651', nom: 'Engie' },
  { siren: '552081317', nom: 'EDF' },
  { siren: '775670417', nom: 'LVMH' },
]

export default function Home() {
  const router = useRouter()
  const [siren, setSiren] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [placeholderText, setPlaceholderText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  // Animation de typing pour le placeholder
  useEffect(() => {
    const fullText = '123 456 789'
    let index = 0
    let direction = 1 // 1 = typing, -1 = deleting

    const interval = setInterval(() => {
      if (direction === 1) {
        setPlaceholderText(fullText.slice(0, index + 1))
        index++
        if (index === fullText.length) {
          setTimeout(() => { direction = -1 }, 2000)
        }
      } else {
        setPlaceholderText(fullText.slice(0, index))
        index--
        if (index === 0) {
          direction = 1
        }
      }
    }, 150)

    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanSiren = siren.replace(/\s/g, '')
    if (!/^\d{9}$/.test(cleanSiren)) {
      setError('Le SIREN doit contenir 9 chiffres')
      return
    }

    setIsLoading(true)
    router.push(`/resultats/${cleanSiren}`)
  }

  const handleExemple = (sirenExemple: string) => {
    setSiren(formatSiren(sirenExemple))
  }

  const formatSiren = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 9)
    return numbers.replace(/(\d{3})(?=\d)/g, '$1 ')
  }

  return (
    <div className="min-h-screen bg-[#fafafa] relative overflow-hidden">
      {/* Gradient background subtil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1e3a5f]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c9a227]/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative min-h-screen flex flex-col">
        {/* Hero central */}
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-2xl mx-auto text-center">
            {/* Logo/Titre */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-light text-[#1e3a5f] mb-3">
                Évaluez votre entreprise
              </h1>
              <p className="text-lg text-gray-500">
                Estimation instantanée basée sur l&apos;IA et les données officielles
              </p>
            </div>

            {/* Input principal - Style IA */}
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#1e3a5f]/20 via-[#c9a227]/20 to-[#1e3a5f]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />

                <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
                  <div className="flex items-center">
                    {/* Icône */}
                    <div className="pl-5 pr-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>

                    {/* Input */}
                    <input
                      type="text"
                      value={siren}
                      onChange={(e) => {
                        setSiren(formatSiren(e.target.value))
                        setError('')
                      }}
                      placeholder={placeholderText || 'Entrez un SIREN...'}
                      className="flex-1 py-5 text-lg bg-transparent outline-none placeholder:text-gray-300"
                    />

                    {/* Bouton */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="m-2 px-6 py-3 bg-[#1e3a5f] text-white rounded-xl font-semibold hover:bg-[#2d5a8f] disabled:bg-[#1e3a5f]/70 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#1e3a5f]/30"
                    >
                      {isLoading ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <>
                          Analyser
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <p className="mt-3 text-sm text-red-500 animate-shake">{error}</p>
              )}
            </form>

            {/* Suggestions */}
            <div className="mb-8">
              <p className="text-sm text-gray-400 mb-3">Essayer avec</p>
              <div className="flex flex-wrap justify-center gap-2">
                {exemplesSiren.map((exemple) => (
                  <button
                    key={exemple.siren}
                    onClick={() => handleExemple(exemple.siren)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors"
                  >
                    {exemple.nom}
                  </button>
                ))}
              </div>
            </div>

            {/* Lien manuel */}
            <Link
              href="/evaluation"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#1e3a5f] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Remplir manuellement sans SIREN
            </Link>
          </div>
        </main>

        {/* Footer stats - Style minimaliste */}
        <footer className="py-8 border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
              <div>
                <div className="text-2xl font-semibold text-[#1e3a5f]">12 847</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Évaluations</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#c9a227]">847</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Acquéreurs</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#1e3a5f]">&lt;30s</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Analyse</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#10b981]">100%</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Gratuit</div>
              </div>
            </div>

            {/* Trust */}
            <div className="mt-8 flex justify-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Données sécurisées
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Confidentiel
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Powered by AI
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
