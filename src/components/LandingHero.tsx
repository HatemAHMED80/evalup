'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LandingHero() {
  const router = useRouter()
  const [siren, setSiren] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Nettoyer le SIREN (enlever espaces)
    const cleanSiren = siren.replace(/\s/g, '')

    // Validation basique
    if (!/^\d{9}$/.test(cleanSiren)) {
      setError('Le SIREN doit contenir exactement 9 chiffres')
      return
    }

    setIsLoading(true)
    setError('')

    // Rediriger directement vers le chat
    router.push(`/chat/${cleanSiren}`)
  }

  const formatSiren = (value: string) => {
    // Enlever tout ce qui n'est pas un chiffre
    const digits = value.replace(/\D/g, '').slice(0, 9)
    // Formater avec des espaces: XXX XXX XXX
    return digits.replace(/(\d{3})(?=\d)/g, '$1 ')
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a227] to-[#e8c547] flex items-center justify-center">
            <span className="text-[#1a1a2e] font-bold text-lg">E</span>
          </div>
          <span className="text-white font-semibold text-xl">EvalUp</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        <div className="max-w-2xl w-full text-center">
          {/* Titre */}
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Evaluation d&apos;entreprise, decryptage de bilans{' '}
            <span className="text-[#c9a227]">en 2 minutes</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg text-white/60 mb-10">
            Entrez votre SIREN, notre IA analyse vos chiffres et vous explique tout clairement.
          </p>

          {/* Formulaire SIREN */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center gap-2">
              <input
                type="text"
                value={siren}
                onChange={(e) => {
                  setSiren(formatSiren(e.target.value))
                  setError('')
                }}
                placeholder="Numero SIREN (9 chiffres)"
                className="flex-1 bg-transparent text-white text-lg px-4 py-3 outline-none placeholder:text-white/30"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || siren.replace(/\s/g, '').length !== 9}
                className="px-6 py-3 bg-[#c9a227] text-[#1a1a2e] font-semibold rounded-xl hover:bg-[#e8c547] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyse...
                  </>
                ) : (
                  <>
                    Analyser
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm mt-3">{error}</p>
            )}
          </form>

          {/* Points cles */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Gratuit pour commencer
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Données publiques + vos bilans
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Resultats en 2 minutes
            </div>
          </div>

          {/* Profils */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-white/40 text-sm mb-4">
              EvalUp s&apos;adapte a votre besoin
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon: '🏢', label: 'Dirigeant' },
                { icon: '💰', label: 'Cedant' },
                { icon: '🔍', label: 'Repreneur' },
                { icon: '📊', label: 'Comptable' },
              ].map((profil) => (
                <div
                  key={profil.label}
                  className="px-4 py-2 bg-white/5 rounded-full text-white/60 text-sm flex items-center gap-2"
                >
                  <span>{profil.icon}</span>
                  <span>{profil.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-white/30 text-sm">
        <p>Le SIREN se trouve sur le Kbis, les factures ou sur societe.com</p>
      </footer>
    </div>
  )
}
