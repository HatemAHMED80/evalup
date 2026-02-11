'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default function AbonnementPage() {
  // Mock data - en production, vient de l'API
  const currentPlan = {
    name: 'Flash (Gratuit)',
    status: 'active',
    features: [
      'Diagnostic gratuit',
      'Donnees Pappers incluses',
      'Valorisation indicative',
    ],
    limitations: [
      'Pas d\'upload de documents',
      'Pas de rapport PDF',
    ],
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
              {currentPlan.name}
            </p>
          </div>
          <Badge variant="success">Actif</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Inclus
              </p>
              <ul className="space-y-2">
                {currentPlan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-[14px] text-[var(--text-primary)]">
                    <svg className="w-4 h-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
                Non inclus
              </p>
              <ul className="space-y-2">
                {currentPlan.limitations.map((limitation, i) => (
                  <li key={i} className="flex items-center gap-2 text-[14px] text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {limitation}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--border)] flex items-center justify-between">
            <p className="text-[var(--text-secondary)]">
              Passez a un plan superieur pour debloquer toutes les fonctionnalites
            </p>
            <Button asChild>
              <Link href="/tarifs">Voir les plans</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold">Utilisation ce mois</h2>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Evaluations
              </p>
              <p className="text-[28px] font-bold text-[var(--text-primary)] mt-1">3</p>
              <p className="text-[13px] text-[var(--text-secondary)]">evaluations Flash</p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Questions posees
              </p>
              <p className="text-[28px] font-bold text-[var(--text-primary)] mt-1">24</p>
              <p className="text-[13px] text-[var(--text-secondary)]">sur 3 evaluations</p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Rapports PDF
              </p>
              <p className="text-[28px] font-bold text-[var(--text-muted)] mt-1">0</p>
              <p className="text-[13px] text-[var(--text-secondary)]">
                <Link href="/tarifs" className="text-[var(--accent)] hover:underline">
                  Debloquer
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
