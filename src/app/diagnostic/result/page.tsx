'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ARCHETYPES } from '@/lib/valuation/archetypes'
import type { Archetype } from '@/lib/valuation/archetypes'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { trackConversion } from '@/lib/analytics'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompanyInfo {
  siren: string
  companyName: string
  sector: string
  nafCode: string
}

// ---------------------------------------------------------------------------
// Inner component (useSearchParams needs Suspense)
// ---------------------------------------------------------------------------

function DiagnosticResult() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()

  const [archetype, setArchetype] = useState<Archetype | null>(null)
  const [archetypeId, setArchetypeId] = useState('')
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Auth gate: redirect unauthenticated users ────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      const id = searchParams.get('archetype') || ''
      router.replace(`/diagnostic/signup?archetype=${encodeURIComponent(id)}`)
    }
  }, [authLoading, user, router, searchParams])

  // ── Load archetype + company from sessionStorage / query params ──────────
  useEffect(() => {
    // Company info from the original form data
    const formRaw = sessionStorage.getItem('diagnostic_data')
    if (formRaw) {
      try {
        const form = JSON.parse(formRaw)
        if (form.companyName) {
          setCompany({
            siren: (form.siren || '').replace(/\D/g, ''),
            companyName: form.companyName,
            sector: form.sector || '',
            nafCode: form.nafCode || '',
          })
        }
      } catch { /* ignore */ }
    }

    // 1) Try API result in sessionStorage (set by loading page)
    const resultRaw = sessionStorage.getItem('diagnostic_result')
    if (resultRaw) {
      try {
        const data = JSON.parse(resultRaw)
        const id = data.archetypeId as string
        const arch = (data.archetype as Archetype) || ARCHETYPES[id]
        if (arch && id) {
          setArchetype(arch)
          setArchetypeId(id)
          trackConversion('diagnostic_viewed', { archetype_id: id })
          return
        }
      } catch { /* fall through */ }
    }

    // 2) Fallback: query param
    const paramId = searchParams.get('archetype') || ''
    if (paramId && ARCHETYPES[paramId]) {
      setArchetype(ARCHETYPES[paramId])
      setArchetypeId(paramId)
      trackConversion('diagnostic_viewed', { archetype_id: paramId })
      return
    }

    setError('Diagnostic introuvable. Veuillez recommencer.')
  }, [searchParams])

  // ── Guards ───────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null // useEffect above will redirect

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-[var(--text-primary)] font-medium">{error}</p>
          <button
            onClick={() => router.push('/diagnostic')}
            className="text-[var(--accent)] hover:underline text-[14px]"
          >
            Recommencer le diagnostic
          </button>
        </div>
      </div>
    )
  }

  if (!archetype) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Checkout URL ─────────────────────────────────────────────────────────

  const siren = company?.siren || ''
  const checkoutParams = new URLSearchParams({ plan: 'eval_complete', archetype: archetypeId })
  if (siren) checkoutParams.set('siren', siren)
  const checkoutUrl = `/checkout?${checkoutParams.toString()}`

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-0">

        {/* ─── 1. Header ────────────────────────────────────────────── */}
        <header className="pb-10 animate-fade-up">
          <p className="text-[14px] font-medium text-[var(--accent)] uppercase tracking-wide">
            Diagnostic EvalUp
          </p>
          {company?.companyName && (
            <div className="flex items-center gap-3 mt-3">
              <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] flex items-center justify-center text-[var(--text-primary)] font-bold text-[14px]">
                {company.companyName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] text-[15px]">
                  {company.companyName}
                </p>
                <p className="text-[12px] text-[var(--text-muted)]">
                  {company.sector}{company.nafCode ? ` \u00B7 NAF ${company.nafCode}` : ''}
                  {siren ? ` \u00B7 SIREN ${siren}` : ''}
                </p>
              </div>
            </div>
          )}
        </header>

        {/* ─── 2. Hero archetype card ───────────────────────────────── */}
        <section
          className="rounded-[var(--radius-2xl)] p-8 mb-10 animate-fade-up delay-1"
          style={{ backgroundColor: `${archetype.color}08`, border: `1px solid ${archetype.color}25` }}
        >
          <div className="flex items-center gap-5">
            <div
              className="w-[72px] h-[72px] rounded-[var(--radius-xl)] flex items-center justify-center text-[36px] shrink-0"
              style={{ backgroundColor: `${archetype.color}18` }}
            >
              {archetype.icon}
            </div>
            <div>
              <p className="text-[13px] font-medium uppercase tracking-wide" style={{ color: archetype.color }}>
                Votre profil
              </p>
              <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
                {archetype.name}
              </h1>
              <p className="text-[14px] text-[var(--text-secondary)] mt-1">
                M\u00E9thode recommand\u00E9e : <strong style={{ color: archetype.color }}>{archetype.primaryMethod}</strong>
              </p>
            </div>
          </div>
        </section>

        {/* ─── 3. Pourquoi cette méthode ? ──────────────────────────── */}
        <section className="pb-10 animate-fade-up delay-2">
          <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-4">
            Pourquoi cette m\u00E9thode ?
          </h2>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 space-y-4">
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
              {archetype.whyThisMethod}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${archetype.color}15` }}
                >
                  <span className="font-bold text-[11px]" style={{ color: archetype.color }}>1</span>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{archetype.primaryMethod}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{archetype.metricBase}</p>
                </div>
              </div>
              <span className="text-[var(--text-muted)]">+</span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[var(--bg-tertiary)] rounded-[var(--radius-sm)] flex items-center justify-center shrink-0">
                  <span className="text-[var(--text-muted)] font-bold text-[11px]">2</span>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">{archetype.secondaryMethod}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Validation crois\u00E9e</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. Les 3 erreurs ─────────────────────────────────────── */}
        <section className="pb-10 animate-fade-up delay-3">
          <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-4">
            Les 3 erreurs qui faussent votre valorisation
          </h2>
          <div className="space-y-3">
            {archetype.commonMistakes.map((m, i) => (
              <div
                key={i}
                className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 flex gap-4 hover-lift"
              >
                <div className="w-10 h-10 bg-[var(--danger-light)] rounded-[var(--radius-md)] flex items-center justify-center shrink-0 text-[20px]">
                  {m.icon}
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-[15px]">{m.mistake}</p>
                  <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                    <span className="text-[var(--danger)] font-medium">Impact :</span> {m.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 5. Les facteurs qui changent tout ────────────────────── */}
        <section className="pb-10 animate-fade-up delay-4">
          <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-4">
            Les facteurs qui changent tout
          </h2>
          <div className="space-y-1">
            {archetype.keyFactors.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3 px-4 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <span
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[14px] font-bold
                    ${f.direction === 'up'
                      ? 'bg-[var(--success-light)] text-[var(--success)]'
                      : 'bg-[var(--danger-light)] text-[var(--danger)]'
                    }
                  `}
                >
                  {f.direction === 'up' ? '\u2197' : '\u2198'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[var(--text-primary)]">{f.factor}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{f.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 6. CTA — Rapport complet par IA ──────────────────────── */}
        <section className="animate-fade-up delay-5">
          <div
            className="rounded-[var(--radius-2xl)] p-8 space-y-6"
            style={{ backgroundColor: `${archetype.color}06`, border: `1px solid ${archetype.color}20` }}
          >
            <div className="space-y-2">
              <h2 className="text-[20px] font-bold text-[var(--text-primary)]">
                Rapport complet par IA
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)]">
                Notre IA applique la m\u00E9thode{' '}
                <strong style={{ color: archetype.color }}>{archetype.primaryMethod}</strong>{' '}
                avec les multiples Damodaran 2026 pour g\u00E9n\u00E9rer votre rapport personnalis\u00E9.
              </p>
            </div>

            <ul className="space-y-2.5">
              {archetype.reportIncludes.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[14px]">
                  <svg className="w-5 h-5 shrink-0" style={{ color: archetype.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[var(--text-primary)]">{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Button variant="primary" size="lg" className="w-full" asChild>
                <Link
                  href={checkoutUrl}
                  onClick={() => {
                    trackConversion('report_cta_clicked', { archetype_id: archetypeId, siren })
                    trackConversion('checkout_started', { archetype_id: archetypeId, plan: 'eval_complete' })
                  }}
                >
                  G\u00E9n\u00E9rer mon rapport &mdash; 79\u20AC &rarr;
                </Link>
              </Button>
              <p className="text-center text-[12px] text-[var(--text-muted)] mt-3">
                Analyse approfondie + rapport PDF de 30 pages
              </p>
            </div>
          </div>
        </section>

        {/* ─── Footer ───────────────────────────────────────────────── */}
        <div className="text-center pt-8 pb-4">
          <button
            onClick={() => router.push('/diagnostic')}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] text-[13px] transition-colors"
          >
            Recommencer le diagnostic
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page wrapper (Suspense for useSearchParams)
// ---------------------------------------------------------------------------

export default function DiagnosticResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DiagnosticResult />
    </Suspense>
  )
}
