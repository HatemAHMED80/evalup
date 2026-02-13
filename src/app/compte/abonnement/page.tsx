'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { PLANS, type PlanId } from '@/lib/stripe/plans'

interface SubscriptionData {
  plan_id: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export default function AbonnementPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [evalCount, setEvalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isPortalLoading, setIsPortalLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Charger l'abonnement actif
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_id, status, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .in('status', ['active', 'past_due', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setSubscription(sub as SubscriptionData | null)

      // Compter les evaluations du mois
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('evaluations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())

      setEvalCount(count || 0)
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleManageSubscription = async () => {
    setIsPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      alert('Erreur lors de l\'ouverture du portail de gestion')
    }
    setIsPortalLoading(false)
  }

  const planId = subscription?.plan_id || 'flash'
  const plan = PLANS[planId as PlanId] || PLANS.flash
  const isSubscription = plan.type === 'subscription'
  const hasStripeCustomer = subscription != null

  const statusLabel = (() => {
    if (!subscription) return 'Actif'
    if (subscription.cancel_at_period_end) return 'Annulation programmee'
    if (subscription.status === 'past_due') return 'Paiement en retard'
    if (subscription.status === 'trialing') return 'Essai gratuit'
    return 'Actif'
  })()

  const statusVariant = (() => {
    if (!subscription || subscription.status === 'active') return 'success' as const
    if (subscription.status === 'past_due' || subscription.cancel_at_period_end) return 'warning' as const
    return 'success' as const
  })()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Mon abonnement</h1>
          <p className="text-[var(--text-secondary)] mt-1">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Mon abonnement</h1>
        <p className="text-[var(--text-secondary)] mt-1">Gerez votre plan et vos options</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold">Plan actuel</h2>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              {plan.name} {plan.price > 0 ? `(${plan.price}€${isSubscription ? '/mois' : ''})` : '(Gratuit)'}
            </p>
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Inclus
              </p>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-[14px] text-[var(--text-primary)]">
                    <svg className="w-4 h-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            {plan.limitations.length > 0 && (
              <div>
                <p className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                  Non inclus
                </p>
                <ul className="space-y-2">
                  {plan.limitations.map((limitation, i) => (
                    <li key={i} className="flex items-center gap-2 text-[14px] text-[var(--text-secondary)]">
                      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {subscription?.current_period_end && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-[13px] text-[var(--text-secondary)]">
                {subscription.cancel_at_period_end
                  ? `Votre abonnement se termine le ${new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}`
                  : `Prochain renouvellement le ${new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}`
                }
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-[var(--border)] flex items-center justify-between">
            {hasStripeCustomer ? (
              <>
                <p className="text-[var(--text-secondary)]">
                  Gerez votre abonnement, moyen de paiement ou annulez
                </p>
                <Button onClick={handleManageSubscription} isLoading={isPortalLoading}>
                  Gerer l'abonnement
                </Button>
              </>
            ) : (
              <>
                <p className="text-[var(--text-secondary)]">
                  Passez a un plan superieur pour debloquer toutes les fonctionnalites
                </p>
                <Button asChild>
                  <Link href="/tarifs">Voir les plans</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold">Utilisation ce mois</h2>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Evaluations
              </p>
              <p className="text-[28px] font-bold text-[var(--text-primary)] mt-1">{evalCount}</p>
              <p className="text-[13px] text-[var(--text-secondary)]">
                {plan.limits.evalsPerMonth != null
                  ? `sur ${plan.limits.evalsPerMonth} disponibles`
                  : 'ce mois-ci'
                }
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Rapports PDF
              </p>
              <p className="text-[28px] font-bold text-[var(--text-primary)] mt-1">
                {plan.type === 'free' ? (
                  <span className="text-[var(--text-muted)]">-</span>
                ) : (
                  evalCount
                )}
              </p>
              <p className="text-[13px] text-[var(--text-secondary)]">
                {plan.type === 'free' ? (
                  <Link href="/tarifs" className="text-[var(--accent)] hover:underline">
                    Debloquer
                  </Link>
                ) : (
                  'inclus avec votre plan'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
