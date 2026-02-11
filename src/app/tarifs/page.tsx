'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'

const PRIMARY_PLANS = [
  {
    id: 'diagnostic',
    name: 'Diagnostic gratuit',
    description: 'Découvrez votre profil de valorisation',
    price: 'Gratuit',
    priceDetail: null,
    features: [
      'Diagnostic en 2 minutes',
      'Détection de votre archétype',
      'Méthode de valorisation recommandée',
      'Erreurs courantes à éviter',
      'Facteurs clés identifiés',
    ],
    limitations: [
      'Pas de chiffre de valorisation',
      'Pas de rapport PDF',
    ],
    cta: 'Lancer le diagnostic',
    ctaHref: '/diagnostic',
    popular: false,
    isSubscription: false,
  },
  {
    id: 'eval_complete',
    name: 'Rapport complet',
    description: 'Valorisation précise par IA + rapport PDF',
    price: '79\u20AC',
    priceDetail: 'par évaluation',
    features: [
      'Analyse IA conversationnelle',
      'Méthode adaptée à votre profil',
      'Multiples Damodaran 2026',
      'Retraitements EBITDA',
      'Analyse des risques',
      'Rapport PDF 30+ pages',
    ],
    limitations: [],
    cta: 'Obtenir mon rapport',
    ctaHref: '/diagnostic',
    popular: true,
    isSubscription: false,
  },
]

const PRO_PLANS = [
  {
    id: 'pro_10',
    name: 'Pro 10',
    description: 'Pour les professionnels',
    price: '199\u20AC',
    priceDetail: '/mois',
    features: [
      '10 évaluations complètes/mois',
      'Tout inclus',
      'Historique illimité',
      'Support prioritaire',
    ],
    limitations: [],
    cta: 'S\'abonner',
    ctaHref: '/checkout?plan=pro_10',
    popular: false,
    isSubscription: true,
  },
  {
    id: 'pro_unlimited',
    name: 'Pro Illimité',
    description: 'Pour les cabinets M&A',
    price: '399\u20AC',
    priceDetail: '/mois',
    features: [
      'Évaluations illimitées',
      'Tout inclus',
      'Historique illimité',
      'Support prioritaire',
      'API (bientôt)',
    ],
    limitations: [],
    cta: 'S\'abonner',
    ctaHref: '/checkout?plan=pro_unlimited',
    popular: false,
    isSubscription: true,
  },
]

export default function TarifsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    setIsLoading(planId)

    // Vérifier si l'utilisateur est connecté
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Rediriger vers connexion avec retour vers checkout
      router.push(`/connexion?redirect=${encodeURIComponent(`/checkout?plan=${planId}`)}`)
      return
    }

    // Créer la session checkout
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erreur lors de la création du paiement')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Une erreur est survenue')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-[var(--nav-height)]">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-[var(--accent-subtle)] to-transparent">
          <div className="max-w-[var(--content-max-width)] mx-auto px-8 text-center">
            <Badge variant="accent" className="mb-4">Tarifs</Badge>
            <h1 className="text-[40px] font-bold text-[var(--text-primary)] mb-4">
              Des tarifs simples et transparents
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
              Commencez gratuitement avec l'évaluation Flash, puis passez à l'évaluation Complète pour une valorisation précise.
            </p>
          </div>
        </section>

        {/* Primary Plans */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-8">
            <div className="grid md:grid-cols-2 gap-8">
              {PRIMARY_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`
                    bg-[var(--bg-primary)]
                    border rounded-[var(--radius-xl)] p-8
                    relative
                    ${plan.popular
                      ? 'border-[var(--accent)] shadow-[var(--shadow-lg)]'
                      : 'border-[var(--border)]'
                    }
                  `}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="accent">Recommandé</Badge>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-[20px] font-bold text-[var(--text-primary)]">
                      {plan.name}
                    </h3>
                    <p className="text-[14px] text-[var(--text-secondary)] mt-1">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="text-[36px] font-bold text-[var(--text-primary)]">
                      {plan.price}
                    </span>
                    {plan.priceDetail && (
                      <span className="text-[var(--text-muted)] ml-1">
                        {plan.priceDetail}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-[14px]">
                        <svg className="w-4 h-4 text-[var(--success)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[var(--text-primary)]">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, i) => (
                      <li key={i} className="flex items-start gap-2 text-[14px]">
                        <svg className="w-4 h-4 text-[var(--text-muted)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-[var(--text-muted)]">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="lg"
                    className="w-full"
                    asChild
                  >
                    <Link href={plan.ctaHref}>{plan.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pro Plans */}
        <section className="py-16 bg-[var(--bg-secondary)]">
          <div className="max-w-4xl mx-auto px-8">
            <div className="text-center mb-10">
              <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">
                Offres professionnelles
              </h2>
              <p className="text-[var(--text-secondary)]">
                Pour les experts-comptables, cabinets M&A et professionnels du chiffre.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {PRO_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-[18px] font-bold text-[var(--text-primary)]">
                      {plan.name}
                    </h3>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <span className="text-[28px] font-bold text-[var(--text-primary)]">
                      {plan.price}
                    </span>
                    <span className="text-[var(--text-muted)] ml-1">
                      {plan.priceDetail}
                    </span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px]">
                        <svg className="w-4 h-4 text-[var(--success)] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[var(--text-primary)]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSubscribe(plan.id)}
                    isLoading={isLoading === plan.id}
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-[var(--bg-secondary)]">
          <div className="max-w-3xl mx-auto px-8">
            <h2 className="text-[28px] font-bold text-[var(--text-primary)] text-center mb-10">
              Questions fréquentes
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Quelle est la différence entre Flash et Complète ?',
                  a: 'L\'évaluation Flash donne une fourchette indicative basée sur les données publiques. L\'évaluation Complète analyse vos documents, identifie les risques et génère un rapport PDF professionnel.',
                },
                {
                  q: 'Puis-je passer de Flash à Complète ?',
                  a: 'Oui ! Après votre évaluation Flash, vous pouvez payer 79€ pour passer à l\'évaluation Complète et obtenir une valorisation plus précise.',
                },
                {
                  q: 'Les abonnements sont-ils sans engagement ?',
                  a: 'Oui, vous pouvez annuler votre abonnement à tout moment. Vous conservez l\'accès jusqu\'à la fin de la période payée.',
                },
              ].map((faq, i) => (
                <details key={i} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 group">
                  <summary className="font-medium text-[var(--text-primary)] cursor-pointer list-none flex justify-between items-center">
                    {faq.q}
                    <svg className="w-5 h-5 text-[var(--text-muted)] group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="text-[var(--text-secondary)] mt-3">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
