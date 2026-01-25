'use client'

// Composant de recherche d'entreprise par SIREN/SIRET
// Redirige vers la page de résultats dynamique

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function SirenSearch() {
  const router = useRouter()
  const [siren, setSiren] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Nettoyer le numéro
    const numero = siren.replace(/[\s-]/g, '')

    // Validation
    if (!numero) {
      setError('Veuillez entrer un numéro SIREN ou SIRET')
      return
    }

    if (!/^\d{9}$/.test(numero) && !/^\d{14}$/.test(numero)) {
      setError('Format invalide. Entrez 9 chiffres (SIREN) ou 14 chiffres (SIRET)')
      return
    }

    // Redirection vers la page de résultats
    setIsLoading(true)
    const sirenNumber = numero.length === 14 ? numero.substring(0, 9) : numero
    router.push(`/resultats/${sirenNumber}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={siren}
            onChange={(e) => {
              setSiren(e.target.value)
              setError(null)
            }}
            placeholder="Entrez un numéro SIREN ou SIRET"
            className={`
              w-full px-5 py-4 rounded-xl border-2 text-lg text-gray-900 placeholder-gray-400 bg-white
              transition-all duration-200 outline-none
              ${error
                ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-gray-200 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20'
              }
            `}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`
            px-8 py-4 rounded-xl font-semibold text-lg text-white
            transition-all duration-200
            ${isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#10b981] hover:bg-[#059669] hover:scale-[1.02] shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Recherche...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Analyser
            </span>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-red-600 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}

      <p className="mt-4 text-center text-sm text-gray-500">
        Exemple : 443061841 (SIREN) ou 44306184100047 (SIRET)
      </p>
    </form>
  )
}
