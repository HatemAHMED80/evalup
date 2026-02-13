'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PLANS } from '@/lib/stripe/plans'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [_isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const sirenParam = searchParams.get('siren')
  const evalId = searchParams.get('eval')
  const planId = searchParams.get('plan') || 'eval_complete'
  const archetypeId = searchParams.get('archetype')

  // Fallback: read SIREN from sessionStorage if not in URL
  const siren = sirenParam || (() => {
    try {
      const raw = sessionStorage.getItem('diagnostic_data')
      if (raw) {
        const d = JSON.parse(raw)
        return (d.siren || '').replace(/\D/g, '') || null
      }
    } catch { /* ignore */ }
    return null
  })()

  const initiateCheckout = useCallback(async (signal: { cancelled: boolean }) => {
    setIsLoading(true)
    setError(null)

    try {
      const plan = PLANS[planId as keyof typeof PLANS]
      if (!plan) {
        throw new Error('Plan invalide')
      }

      let diagnosticData: Record<string, unknown> | null = null
      try {
        const raw = sessionStorage.getItem('diagnostic_data')
        if (raw) diagnosticData = JSON.parse(raw)
      } catch { /* ignore */ }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          evaluationId: evalId,
          siren,
          archetypeId,
          diagnosticData,
        }),
      })

      if (signal.cancelled) return

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          const returnUrl = encodeURIComponent(`/checkout?siren=${siren}&eval=${evalId}&plan=${planId}${archetypeId ? `&archetype=${archetypeId}` : ''}`)
          router.push(`/connexion?redirect=${returnUrl}`)
          return
        }
        throw new Error(data.error || 'Erreur lors du paiement')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de paiement non reçue')
      }
    } catch (err) {
      if (signal.cancelled) return
      console.error('Erreur checkout:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      setIsLoading(false)
    }
  }, [siren, evalId, planId, archetypeId, router])

  useEffect(() => {
    if (!siren) {
      setError('Paramètres manquants')
      setIsLoading(false)
      return
    }

    const signal = { cancelled: false }
    const timeout = setTimeout(() => {
      if (!signal.cancelled) {
        setError('La connexion au service de paiement prend trop de temps. Veuillez réessayer.')
        setIsLoading(false)
      }
    }, 40000)

    initiateCheckout(signal).finally(() => clearTimeout(timeout))

    return () => {
      signal.cancelled = true
      clearTimeout(timeout)
    }
  }, [siren, initiateCheckout, retryCount])

  const handleRetry = () => {
    setRetryCount(c => c + 1)
  }

  if (error) {
    const isNetworkError = error.includes('connection') || error.includes('retried') || error.includes('trop de temps') || error.includes('network')
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
        <div className="bg-white/5 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Erreur</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            {isNetworkError && (
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-[#c9a227] hover:bg-[#d4ad2e] text-[#1a1a2e] font-semibold rounded-xl transition-colors"
              >
                Réessayer
              </button>
            )}
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#c9a227]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#c9a227] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Redirection vers le paiement...</h1>
        <p className="text-white/60 mb-6">Vous allez être redirigé vers notre partenaire de paiement sécurisé.</p>
        <button
          onClick={() => router.back()}
          className="text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#c9a227]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#c9a227] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Chargement...</h1>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutContent />
    </Suspense>
  )
}
