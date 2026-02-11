'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PLANS } from '@/lib/stripe/plans'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const siren = searchParams.get('siren')
  const evalId = searchParams.get('eval')
  const planId = searchParams.get('plan') || 'eval_complete'
  const archetypeId = searchParams.get('archetype')

  useEffect(() => {
    async function initiateCheckout() {
      try {
        // Vérifier que le plan existe (sans priceId car il est résolu côté serveur)
        const plan = PLANS[planId as keyof typeof PLANS]
        if (!plan) {
          throw new Error('Plan invalide')
        }

        // Récupérer les données du diagnostic depuis sessionStorage
        let diagnosticData: Record<string, unknown> | null = null
        try {
          const raw = sessionStorage.getItem('diagnostic_data')
          if (raw) diagnosticData = JSON.parse(raw)
        } catch { /* ignore */ }

        // Le serveur résout le priceId à partir du planId (car env vars serveur)
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

        const data = await response.json()

        if (!response.ok) {
          // Si non authentifie, rediriger vers connexion
          if (response.status === 401) {
            const returnUrl = encodeURIComponent(`/checkout?siren=${siren}&eval=${evalId}&plan=${planId}${archetypeId ? `&archetype=${archetypeId}` : ''}`)
            router.push(`/connexion?redirect=${returnUrl}`)
            return
          }
          throw new Error(data.error || 'Erreur lors du paiement')
        }

        // Rediriger vers Stripe Checkout
        if (data.url) {
          window.location.href = data.url
        }
      } catch (err) {
        console.error('Erreur checkout:', err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
        setIsLoading(false)
      }
    }

    if (siren) {
      initiateCheckout()
    } else {
      setError('Paramètres manquants')
      setIsLoading(false)
    }
  }, [siren, evalId, planId, archetypeId, router])

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
        <div className="bg-white/5 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Erreur</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Retour
          </button>
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
        <p className="text-white/60">Vous allez être redirigé vers notre partenaire de paiement sécurisé.</p>
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
