'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { trackConversion } from '@/lib/analytics'
import { validateDiagnosticInput, type ValidationAlert, type AlertId } from '@/lib/validation/coherence'
import { StepPappersRecap } from './steps/StepPappersRecap'
import { StepConfirmOrCorrect } from './steps/StepConfirmOrCorrect'
import { StepQuickChoices, type Choice } from './steps/StepQuickChoices'
import { StepMRR } from './steps/StepMRR'
import { StepFinalRecap } from './steps/StepFinalRecap'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiagnosticFormData {
  siren: string
  companyName: string
  nafCode: string
  sector: string
  activityType: string
  revenue: number | null
  ebitda: number | null
  growth: number
  recurring: number
  masseSalariale: number
  effectif: string
  hasPatrimoine: boolean | null
  loyersNets: number | null
  remunerationDirigeant: number | null
  dettesFinancieres: number | null
  tresorerieActuelle: number | null
  concentrationClient: number
  mrrMensuel: number | null
  // Données Pappers de référence (cross-validation)
  pappersCA: number | null
  pappersEBITDA: number | null
  pappersTresorerie: number | null
  pappersDettes: number | null
}

const INITIAL_DATA: DiagnosticFormData = {
  siren: '',
  companyName: '',
  nafCode: '',
  sector: '',
  activityType: '',
  revenue: null,
  ebitda: null,
  growth: 15,
  recurring: 20,
  masseSalariale: 35,
  effectif: '',
  hasPatrimoine: null,
  loyersNets: null,
  remunerationDirigeant: null,
  dettesFinancieres: null,
  tresorerieActuelle: null,
  concentrationClient: 15,
  mrrMensuel: null,
  pappersCA: null,
  pappersEBITDA: null,
  pappersTresorerie: null,
  pappersDettes: null,
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTIVITY_TYPES = [
  { id: 'saas', label: 'SaaS / Logiciel', icon: '\u{1F680}' },
  { id: 'marketplace', label: 'Marketplace', icon: '\u{1F6D2}' },
  { id: 'ecommerce', label: 'E-commerce', icon: '\u{1F6CD}\uFE0F' },
  { id: 'conseil', label: 'Conseil / Services', icon: '\u{1F4BC}' },
  { id: 'services', label: 'Services récurrents', icon: '\u{1F527}' },
  { id: 'commerce', label: 'Commerce / Retail', icon: '\u{1F3EA}' },
  { id: 'industrie', label: 'Industrie / BTP', icon: '\u{1F3ED}' },
  { id: 'immobilier', label: 'Immobilier', icon: '\u{1F3E0}' },
]

const EFFECTIF_OPTIONS = [
  { id: '1', label: '1 (solo)' },
  { id: '2-5', label: '2-5' },
  { id: '6-20', label: '6-20' },
  { id: '21-50', label: '21-50' },
  { id: '50+', label: '50+' },
]

const SKIP_PATRIMOINE_TYPES = ['saas', 'marketplace', 'ecommerce']

const STEP_NAMES: Record<number, string> = {
  0: 'siren',
  1: 'activity_type',
  2: 'revenue',
  3: 'ebitda',
  4: 'growth',
  5: 'recurring',
  6: 'masse_salariale',
  7: 'effectif',
  8: 'patrimoine',
  9: 'loyers',
  10: 'remuneration_dirigeant',
  11: 'dettes_financieres',
  12: 'tresorerie',
  13: 'concentration_client',
  14: 'mrr_mensuel',
  15: 'pappers_recap',
  16: 'final_recap',
}

type DataSource = 'pappers' | 'corrected' | 'declaratif'

const REMUNERATION_CHOICES: Choice[] = [
  { id: 'aucune', label: 'Aucune', sub: 'Non remunere', value: 0 },
  { id: 'low', label: '< 30k €', sub: 'Micro/solo', value: 15000 },
  { id: 'mid', label: '30k - 60k €', sub: 'PME standard', value: 45000 },
  { id: 'high', label: '60k - 100k €', sub: 'Cadre dirigeant', value: 80000 },
  { id: 'top', label: '> 100k €', sub: 'Grande entreprise', value: 150000 },
]

const CONCENTRATION_CHOICES: Choice[] = [
  { id: 'low', label: '< 10%', sub: 'Tres diversifie', value: 5 },
  { id: 'mid', label: '10 - 30%', sub: 'Diversifie', value: 20 },
  { id: 'high', label: '30 - 50%', sub: 'Concentre', value: 40 },
  { id: 'critical', label: '> 50%', sub: 'Dependance forte', value: 65 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSiren(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)]
  return parts.filter(Boolean).join(' ')
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

// ---------------------------------------------------------------------------
// Slider sub-component
// ---------------------------------------------------------------------------

function DiagnosticSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '%',
}: {
  label?: string
  hint?: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ maxWidth: 440, margin: '0 auto' }}>
      <div style={{
        textAlign: 'center', marginBottom: 24,
        fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)',
        color: 'var(--dg-text)',
      }}>
        {value > 0 ? '+' : ''}{value}{suffix}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%', height: 4, borderRadius: 2, appearance: 'none', cursor: 'pointer',
          background: `linear-gradient(to right, var(--dg-accent) 0%, var(--dg-accent) ${pct}%, rgba(255,255,255,0.06) ${pct}%, rgba(255,255,255,0.06) 100%)`,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--dg-text-faint)' }}>
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cross-validation warning
// ---------------------------------------------------------------------------

function CrossValidationWarning({ userValue, pappersValue }: {
  userValue: number | null
  pappersValue: number | null
  label?: string
}) {
  if (userValue == null || pappersValue == null || pappersValue === 0) return null
  const divergence = Math.abs((userValue - pappersValue) / pappersValue)
  if (divergence <= 0.5) return null
  const pct = Math.round(divergence * 100)
  const isDanger = divergence > 5
  return (
    <div style={{
      marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12, textAlign: 'center',
      background: isDanger ? 'var(--dg-danger-bg)' : 'var(--dg-warn-bg)',
      border: `1px solid ${isDanger ? 'var(--dg-danger-border)' : 'var(--dg-warn-border)'}`,
      color: isDanger ? 'var(--dg-danger)' : 'var(--dg-warn)',
      maxWidth: 400, margin: '8px auto 0',
    }}>
      ↕ Pappers : {formatNumber(pappersValue)} € — écart {pct}%
    </div>
  )
}

// ---------------------------------------------------------------------------
// Alert banner (Gate 1 coherence)
// ---------------------------------------------------------------------------

function AlertBanner({
  alert,
  confirmed,
  onConfirm,
}: {
  alert: ValidationAlert
  confirmed: boolean
  onConfirm?: () => void
}) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10, fontSize: 12,
      background: alert.severity === 'error' ? 'var(--dg-danger-bg)' : 'var(--dg-warn-bg)',
      border: `1px solid ${alert.severity === 'error' ? 'var(--dg-danger-border)' : 'var(--dg-warn-border)'}`,
      color: alert.severity === 'error' ? 'var(--dg-danger)' : 'var(--dg-warn)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    }}>
      <span>{alert.message}</span>
      {alert.severity === 'warning' && !confirmed && onConfirm && (
        <button onClick={onConfirm} style={{
          padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600,
          background: 'rgba(200,150,60,0.15)', color: 'var(--dg-warn)', cursor: 'pointer',
        }}>
          Je confirme
        </button>
      )}
      {confirmed && <span style={{ fontSize: 11, color: '#44aa66' }}>✓</span>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Progress dots
// ---------------------------------------------------------------------------

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 40 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 6,
          height: 6,
          borderRadius: 3,
          background: i < current
            ? 'var(--dg-accent)'
            : i === current
              ? '#7799ff'
              : 'rgba(255,255,255,0.06)',
          transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
        }} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DiagnosticFormProps {
  className?: string
  /** If true, renders progress bar as relative instead of fixed (for embedded use) */
  embedded?: boolean
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DiagnosticForm({ className, embedded: _embedded = false }: DiagnosticFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<DiagnosticFormData>(INITIAL_DATA)
  const [sirenLoading, setSirenLoading] = useState(false)
  const [sirenError, setSirenError] = useState<string | null>(null)
  const [sirenFound, setSirenFound] = useState(false)
  const [sirenManualMode, setSirenManualMode] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [confirmedAlerts, setConfirmedAlerts] = useState<AlertId[]>([])
  const [dataSources, setDataSources] = useState<Record<string, DataSource>>({})
  const [pappersHandled, setPappersHandled] = useState(false)
  const [bilanAnnee, setBilanAnnee] = useState<number | null>(null)
  const [pappersGrowth, setPappersGrowth] = useState<number | null>(null)
  const [remunerationSelectedId, setRemunerationSelectedId] = useState<string | null>(null)
  const [concentrationSelectedId, setConcentrationSelectedId] = useState<string | null>(null)
  const [companyVille, setCompanyVille] = useState<string | null>(null)
  const [companyDateCreation, setCompanyDateCreation] = useState<string | null>(null)
  const [pappersResultatNet, setPappersResultatNet] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on step change
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [step])

  // Gate 1: validation alerts (recomputed when form data changes)
  const validationAlerts = useMemo(() => validateDiagnosticInput(data), [data])
  const alertsForStep = useCallback(
    (s: number) => validationAlerts.filter((a) => a.step === s),
    [validationAlerts]
  )

  // Track diagnostic_start on mount
  useEffect(() => {
    const source = document.referrer.includes('/tarifs') ? 'tarifs'
      : document.referrer.includes(window.location.origin) ? 'landing'
      : 'direct'
    trackConversion('diagnostic_start', { source })
  }, [])

  // Determine which steps are active based on conditional logic
  const getActiveSteps = useCallback(() => {
    const steps: number[] = [0]

    // Step 15: Pappers recap (if Pappers data available)
    const hasPappersData = data.pappersCA != null || data.pappersEBITDA != null
    if (hasPappersData && sirenFound) steps.push(15)

    // Step 1: Activity type (always)
    steps.push(1)

    // Steps 2, 3: CA and EBITDA (only if Pappers not handled at recap)
    if (!pappersHandled) {
      steps.push(2, 3)
    }

    // Steps 4-7: Growth, Recurring, Masse salariale, Effectif (always)
    steps.push(4, 5, 6, 7)

    // Steps 8-9: Patrimoine/Loyers (conditional, unchanged)
    const skipPatrimoine = SKIP_PATRIMOINE_TYPES.includes(data.activityType)
    if (!skipPatrimoine) steps.push(8)
    const showLoyers = data.hasPatrimoine === true || data.activityType === 'immobilier'
    if (showLoyers) steps.push(9)

    // Step 10: Remuneration dirigeant (always)
    steps.push(10)

    // Steps 11, 12: Dettes and Tresorerie (only if Pappers not handled at recap)
    if (!pappersHandled) {
      steps.push(11, 12)
    }

    // Step 13: Concentration client (always)
    steps.push(13)

    // Step 14: MRR (conditional SaaS/Marketplace)
    if (['saas', 'marketplace'].includes(data.activityType)) steps.push(14)

    // Step 16: Final recap (always last)
    steps.push(16)

    return steps
  }, [data.activityType, data.hasPatrimoine, data.pappersCA, data.pappersEBITDA, sirenFound, pappersHandled])

  const activeSteps = getActiveSteps()
  const currentActiveIndex = activeSteps.indexOf(step)
  const totalSteps = activeSteps.length

  // SIREN lookup
  const lookupSiren = async () => {
    if (sirenLoading) return
    const digits = data.siren.replace(/\D/g, '')
    if (digits.length !== 9) {
      setSirenError('Le SIREN doit contenir 9 chiffres')
      return
    }
    setSirenLoading(true)
    setSirenError(null)
    try {
      const res = await fetch(`/api/entreprise/${digits}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const err = new Error(body.error || 'Entreprise non trouvée')
        ;(err as Error & { code?: string }).code = body.code || (res.status >= 500 ? 'SEARCH_ERROR' : 'NOT_FOUND')
        throw err
      }
      const json = await res.json()
      const bilans = json.initialContext?.financials?.bilans
      const dernierBilan = bilans?.[0]
      setData((d) => ({
        ...d,
        companyName: json.entreprise?.nom || '',
        nafCode: json.entreprise?.codeNaf || '',
        sector: json.entreprise?.secteur || '',
        pappersCA: dernierBilan?.chiffre_affaires ?? null,
        pappersEBITDA: dernierBilan ? (dernierBilan.resultat_exploitation + dernierBilan.dotations_amortissements) : null,
        pappersTresorerie: dernierBilan?.tresorerie ?? null,
        pappersDettes: dernierBilan?.dettes_financieres ?? null,
      }))
      setCompanyVille(json.entreprise?.ville || null)
      setCompanyDateCreation(json.entreprise?.dateCreation || null)
      setPappersResultatNet(dernierBilan?.resultat_net ?? null)
      // Store bilan year + calculate growth from bilans
      setBilanAnnee(dernierBilan?.annee ?? null)
      if (bilans?.length >= 2) {
        const caN = bilans[0]?.chiffre_affaires ?? 0
        const caN1 = bilans[1]?.chiffre_affaires ?? 0
        if (caN1 > 0) {
          setPappersGrowth(Math.round(((caN - caN1) / caN1) * 100))
        }
      }
      setSirenFound(true)
      trackConversion('sirene_entered', { siren: digits, sector_naf: json.entreprise?.codeNaf || '' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de recherche'
      const code = (err as { code?: string })?.code || ''
      // Client errors (not found, invalid SIREN) → show error message
      const isClientError = code === 'NOT_FOUND' || code === 'INVALID_SIREN' || code === 'INVALID_FORMAT'
      if (isClientError) {
        setSirenError(msg)
        setSirenFound(false)
      } else {
        // API unavailable (no credits, server down, network error) → manual mode
        setSirenManualMode(true)
        setSirenError(null)
      }
    } finally {
      setSirenLoading(false)
    }
  }

  // Navigation
  const goNext = () => {
    trackConversion('form_step_completed', {
      step_number: currentActiveIndex + 1,
      step_name: STEP_NAMES[step] || `step_${step}`,
    })
    const idx = activeSteps.indexOf(step)
    if (idx < activeSteps.length - 1) {
      setDirection('forward')
      setStep(activeSteps[idx + 1])
    } else {
      handleSubmit()
    }
  }

  // Stable ref so that setTimeout always calls the latest goNext
  const goNextRef = useRef(goNext)
  goNextRef.current = goNext
  const goNextDeferred = (delay: number) => setTimeout(() => goNextRef.current(), delay)

  const goBack = () => {
    const idx = activeSteps.indexOf(step)
    if (idx > 0) {
      setDirection('backward')
      setStep(activeSteps[idx - 1])
    }
  }

  // Navigate to a specific step (for recap edit)
  const goToStep = (targetStep: number) => {
    setDirection('backward')
    setStep(targetStep)
  }

  // Callback StepPappersRecap: confirm
  const handlePappersConfirm = () => {
    setData((d) => ({
      ...d,
      revenue: d.pappersCA,
      ebitda: d.pappersEBITDA,
      tresorerieActuelle: d.pappersTresorerie,
      dettesFinancieres: d.pappersDettes,
    }))
    setDataSources((s) => ({
      ...s,
      revenue: 'pappers',
      ebitda: 'pappers',
      tresorerieActuelle: 'pappers',
      dettesFinancieres: 'pappers',
    }))
    setPappersHandled(true)
    goNext()
  }

  // Callback StepPappersRecap: update
  const handlePappersUpdate = (updated: {
    revenue: number
    ebitda: number
    tresorerieActuelle: number | null
    dettesFinancieres: number | null
  }) => {
    setData((d) => ({ ...d, ...updated }))
    setDataSources((s) => ({
      ...s,
      revenue: 'corrected',
      ebitda: 'corrected',
      tresorerieActuelle: updated.tresorerieActuelle != null ? 'corrected' : s.tresorerieActuelle,
      dettesFinancieres: updated.dettesFinancieres != null ? 'corrected' : s.dettesFinancieres,
    }))
    setPappersHandled(true)
    goNext()
  }

  // When activity type changes, handle auto-skip logic
  useEffect(() => {
    if (SKIP_PATRIMOINE_TYPES.includes(data.activityType)) {
      setData((d) => ({ ...d, hasPatrimoine: false }))
    }
  }, [data.activityType])

  // Check if current step can proceed
  const canProceed = (): boolean => {
    let stepOk: boolean
    switch (step) {
      case 0: stepOk = sirenFound || (sirenManualMode && data.companyName.trim().length >= 2); break
      case 1: stepOk = data.activityType !== ''; break
      case 2: stepOk = data.revenue !== null && data.revenue > 0; break
      case 3: stepOk = data.ebitda !== null; break
      case 4: stepOk = true; break
      case 5: stepOk = true; break
      case 6: stepOk = true; break
      case 7: stepOk = data.effectif !== ''; break
      case 8: stepOk = data.hasPatrimoine !== null; break
      case 9: stepOk = data.loyersNets !== null && data.loyersNets >= 0; break
      case 10: stepOk = true; break // optionnel
      case 11: stepOk = true; break // optionnel
      case 12: stepOk = true; break // optionnel
      case 13: stepOk = true; break // slider toujours valide
      case 14: stepOk = data.mrrMensuel !== null && data.mrrMensuel > 0; break
      case 15: stepOk = true; break // handled by component callbacks
      case 16: stepOk = true; break // recap always valid
      default: stepOk = false
    }
    if (!stepOk) return false

    // Gate 1: block on current step if it has errors, or unconfirmed warnings
    const stepAlerts = alertsForStep(step)
    if (stepAlerts.some((a) => a.severity === 'error')) return false
    if (stepAlerts.some((a) => a.severity === 'warning' && !confirmedAlerts.includes(a.id))) return false

    return true
  }

  const isLastStep = currentActiveIndex === totalSteps - 1

  // Submit
  const handleSubmit = () => {
    const payload = JSON.stringify({
      ...data,
      confirmedAlerts: confirmedAlerts.length > 0 ? confirmedAlerts : undefined,
      dataSources: Object.keys(dataSources).length > 0 ? dataSources : undefined,
    })
    sessionStorage.setItem('diagnostic_data', payload)
    // Backup dans localStorage en cas de perte de sessionStorage (redirect Stripe, OAuth, etc.)
    try { localStorage.setItem('diagnostic_data_backup', payload) } catch { /* quota exceeded — non-bloquant */ }
    router.push('/diagnostic/loading')
  }

  // Animation key for step transitions
  const animKey = `step-${step}-${direction}`

  return (
    <div className={`diag-dark ${className ?? "min-h-[calc(100vh-var(--nav-height))] flex flex-col items-center justify-center px-6 py-8"}`}
         style={{ background: 'var(--dg-bg)' }}>
      {/* Progress dots */}
      <ProgressDots total={totalSteps} current={currentActiveIndex} />

      {/* Centered content block */}
      <div className="w-full max-w-lg">

        <div
          key={animKey}
          className="animate-fade-up"
        >
          {/* Step 0: SIREN */}
          {step === 0 && !sirenFound && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  {sirenManualMode ? 'Nom de votre entreprise' : 'SIREN'}
                </h1>
                {sirenManualMode && (
                  <p style={{ fontSize: 12, color: 'var(--dg-text-muted)', marginTop: 8 }}>
                    SIREN {data.siren}
                  </p>
                )}
              </div>

              {!sirenManualMode ? (
                <>
                  <div style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto' }}>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center',
                      background: 'var(--dg-input-bg)',
                      border: `1px solid ${sirenError ? 'var(--dg-danger-border)' : 'var(--dg-input-border)'}`,
                      borderRadius: 12, padding: '0 16px',
                    }}>
                      <input
                        ref={inputRef}
                        type="text"
                        value={data.siren}
                        onChange={(e) => {
                          const formatted = formatSiren(e.target.value)
                          setData((d) => ({ ...d, siren: formatted }))
                          setSirenError(null)
                          setSirenFound(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            lookupSiren()
                          }
                        }}
                        placeholder="XXX XXX XXX"
                        style={{
                          flex: 1, padding: '16px 0', border: 'none', background: 'transparent',
                          outline: 'none', color: 'var(--dg-input-text)', fontSize: 20, fontWeight: 600,
                          fontFamily: 'var(--font-mono)', letterSpacing: 2,
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={lookupSiren}
                      disabled={data.siren.replace(/\D/g, '').length !== 9 || sirenLoading}
                      style={{
                        padding: '0 24px', borderRadius: 12, border: 'none',
                        fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
                        cursor: data.siren.replace(/\D/g, '').length === 9 && !sirenLoading ? 'pointer' : 'default',
                        ...(data.siren.replace(/\D/g, '').length === 9 && !sirenLoading
                          ? { background: 'linear-gradient(135deg, #3355cc, #4466ee)', color: '#fff', boxShadow: '0 4px 20px rgba(51,85,204,0.2)' }
                          : { background: 'rgba(255,255,255,0.03)', color: '#2a2e44' }),
                      }}
                    >
                      {sirenLoading ? '...' : 'Rechercher'}
                    </button>
                  </div>

                  {sirenError && (
                    <p style={{ fontSize: 12, color: 'var(--dg-danger)', textAlign: 'center' }}>{sirenError}</p>
                  )}
                </>
              ) : (
                /* Manual mode: Pappers unavailable, ask company name */
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: 'var(--dg-input-bg)',
                    border: '1px solid var(--dg-input-border)',
                    borderRadius: 12, padding: '0 16px',
                    maxWidth: 440, margin: '0 auto',
                  }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={data.companyName}
                      onChange={(e) => setData((d) => ({ ...d, companyName: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && data.companyName.trim().length >= 2) {
                          e.preventDefault()
                          setSirenFound(true)
                          trackConversion('sirene_entered', { siren: data.siren.replace(/\D/g, ''), manual: 'true' })
                          goNextDeferred(100)
                        }
                      }}
                      style={{
                        flex: 1, padding: '16px 0', border: 'none', background: 'transparent',
                        outline: 'none', color: 'var(--dg-input-text)', fontSize: 20, fontWeight: 600,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (data.companyName.trim().length >= 2) {
                          setSirenFound(true)
                          trackConversion('sirene_entered', { siren: data.siren.replace(/\D/g, ''), manual: 'true' })
                          goNextDeferred(100)
                        }
                      }}
                      disabled={data.companyName.trim().length < 2}
                      style={{
                        padding: '12px 32px', borderRadius: 12, border: 'none',
                        fontSize: 14, fontWeight: 700, cursor: data.companyName.trim().length >= 2 ? 'pointer' : 'default',
                        ...(data.companyName.trim().length >= 2
                          ? { background: 'linear-gradient(135deg, #3355cc, #4466ee)', color: '#fff', boxShadow: '0 4px 20px rgba(51,85,204,0.2)' }
                          : { background: 'rgba(255,255,255,0.03)', color: '#2a2e44' }),
                      }}
                    >
                      Continuer
                    </button>
                  </div>
                  <p style={{ textAlign: 'center', fontSize: 11, color: '#2a2e44', marginTop: 8 }}>Entrée ↵</p>
                </>
              )}
            </div>
          )}

          {/* Step 0: SIREN confirmation (Pappers success only, not manual mode) */}
          {step === 0 && sirenFound && !sirenManualMode && data.companyName && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  C&apos;est bien votre entreprise ?
                </h1>
              </div>

              <div style={{
                background: 'var(--dg-card)', border: '1px solid var(--dg-card-border)',
                borderRadius: 16, padding: '24px 28px',
              }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--dg-text)', marginBottom: 20 }}>
                  {data.companyName}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--dg-accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>SIREN</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--dg-text)', fontFamily: 'var(--font-mono)' }}>{data.siren}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--dg-accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>NAF</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--dg-text)', fontFamily: 'var(--font-mono)' }}>{data.nafCode || '—'}</p>
                  </div>
                  {companyVille && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--dg-accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Ville</p>
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--dg-text)', fontFamily: 'var(--font-mono)' }}>{companyVille.toUpperCase()}</p>
                    </div>
                  )}
                  {companyDateCreation && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--dg-accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Création</p>
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--dg-text)', fontFamily: 'var(--font-mono)' }}>{companyDateCreation}</p>
                    </div>
                  )}
                  {data.pappersCA != null && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--dg-accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        CA {bilanAnnee || ''}
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--dg-text)', fontFamily: 'var(--font-mono)' }}>{formatNumber(data.pappersCA)}€</p>
                    </div>
                  )}
                  {pappersResultatNet != null && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--dg-accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Résultat net</p>
                      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--dg-text)', fontFamily: 'var(--font-mono)' }}>{formatNumber(pappersResultatNet)}€</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={goNext}
                  style={{
                    flex: 1, padding: '16px 0', borderRadius: 14, border: 'none',
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    background: 'linear-gradient(135deg, #3355cc, #4466ee)', color: '#fff',
                    boxShadow: '0 4px 24px rgba(51,85,204,0.25)',
                  }}
                >
                  Oui, c&apos;est correct
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSirenFound(false)
                    setSirenManualMode(false)
                    setSirenError(null)
                    setData((d) => ({ ...d, siren: '', companyName: '', nafCode: '', sector: '', pappersCA: null, pappersEBITDA: null, pappersTresorerie: null, pappersDettes: null }))
                    setCompanyVille(null)
                    setCompanyDateCreation(null)
                    setPappersResultatNet(null)
                    setBilanAnnee(null)
                    setPappersGrowth(null)
                  }}
                  style={{
                    padding: '16px 28px', borderRadius: 14, cursor: 'pointer',
                    fontSize: 15, fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)', color: 'var(--dg-text-dim)',
                  }}
                >
                  Non
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Activity type */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  Type d&apos;activité
                </h1>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setData((d) => ({ ...d, activityType: type.id }))
                      goNextDeferred(300)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                      fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                      border: data.activityType === type.id
                        ? '1px solid rgba(68,102,238,0.4)'
                        : '1px solid rgba(255,255,255,0.04)',
                      background: data.activityType === type.id
                        ? 'rgba(68,102,238,0.08)'
                        : 'rgba(255,255,255,0.02)',
                      color: data.activityType === type.id
                        ? '#b0b8dd'
                        : 'var(--dg-text-dim)',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Revenue */}
          {step === 2 && (
            <div>
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  Chiffre d&apos;affaires annuel
                </h1>
                {data.pappersCA != null && bilanAnnee && (
                  <p style={{ fontSize: 12, color: 'var(--dg-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
                    Pappers {bilanAnnee} : {formatNumber(data.pappersCA)} €
                  </p>
                )}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--dg-input-bg)',
                border: '1px solid var(--dg-input-border)',
                borderRadius: 12, padding: '0 16px',
                maxWidth: 400, margin: '24px auto 0',
              }}>
                <input
                  ref={inputRef}
                  type="number"
                  value={data.revenue !== null ? data.revenue : ''}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      revenue: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  onKeyDown={(e) => { if (e.key === 'Enter' && canProceed()) goNext() }}
                  style={{
                    flex: 1, padding: '16px 0', border: 'none', background: 'transparent',
                    outline: 'none', color: 'var(--dg-input-text)', fontSize: 20, fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--dg-text-muted)', fontWeight: 500, marginLeft: 8 }}>€/an</span>
              </div>
              <CrossValidationWarning
                userValue={data.revenue}
                pappersValue={data.pappersCA}
                label="chiffre d'affaires"
              />
            </div>
          )}

          {/* Step 3: EBITDA */}
          {step === 3 && (
            <div>
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  EBITDA annuel
                </h1>
                {data.pappersEBITDA != null && bilanAnnee && (
                  <p style={{ fontSize: 12, color: 'var(--dg-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
                    Pappers {bilanAnnee} : {formatNumber(data.pappersEBITDA)} €
                  </p>
                )}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--dg-input-bg)',
                border: '1px solid var(--dg-input-border)',
                borderRadius: 12, padding: '0 16px',
                maxWidth: 400, margin: '24px auto 0',
              }}>
                <input
                  ref={inputRef}
                  type="number"
                  value={data.ebitda !== null ? data.ebitda : ''}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      ebitda: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  onKeyDown={(e) => { if (e.key === 'Enter' && canProceed()) goNext() }}
                  style={{
                    flex: 1, padding: '16px 0', border: 'none', background: 'transparent',
                    outline: 'none', color: 'var(--dg-input-text)', fontSize: 20, fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--dg-text-muted)', fontWeight: 500, marginLeft: 8 }}>€/an</span>
              </div>
              <CrossValidationWarning
                userValue={data.ebitda}
                pappersValue={data.pappersEBITDA}
                label="EBITDA"
              />
            </div>
          )}

          {/* Step 4: Growth */}
          {step === 4 && (
            pappersGrowth != null ? (
              <StepConfirmOrCorrect
                title="Croissance annuelle"
                description=""
                label="Croissance"
                pappersValue={pappersGrowth}
                pappersLabel={bilanAnnee ? `Bilans ${bilanAnnee - 1}/${bilanAnnee}` : undefined}
                unit="%"
                allowNegative
                onValidate={(value, source) => {
                  setData((d) => ({ ...d, growth: value }))
                  setDataSources((s) => ({ ...s, growth: source }))
                  goNext()
                }}
              />
            ) : (
              <div>
                <div className="text-center">
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                    Croissance annuelle
                  </h1>
                </div>
                <div style={{ marginTop: 32 }}>
                  <DiagnosticSlider
                    label="Croissance"
                    hint="Mediane PME : +5%"
                    value={data.growth}
                    onChange={(v) => setData((d) => ({ ...d, growth: v }))}
                    min={-30}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            )
          )}

          {/* Step 5: Recurring */}
          {step === 5 && (
            <div>
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  Part de revenus récurrents
                </h1>
              </div>
              <div style={{ marginTop: 32 }}>
                <DiagnosticSlider
                  label="Récurrence"
                  hint="Médiane PME : 20%"
                  value={data.recurring}
                  onChange={(v) => setData((d) => ({ ...d, recurring: v }))}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            </div>
          )}

          {/* Step 6: Masse salariale */}
          {step === 6 && (
            <div>
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  Poids de la masse salariale
                </h1>
              </div>
              <div style={{ marginTop: 32 }}>
                <DiagnosticSlider
                  label="Masse salariale / CA"
                  hint="Médiane PME : 35%"
                  value={data.masseSalariale}
                  onChange={(v) => setData((d) => ({ ...d, masseSalariale: v }))}
                  min={0}
                  max={90}
                  step={5}
                />
              </div>
            </div>
          )}

          {/* Step 7: Effectif */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  Effectif
                </h1>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {EFFECTIF_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setData((d) => ({ ...d, effectif: opt.id }))
                      goNextDeferred(200)
                    }}
                    style={{
                      padding: '12px 24px', borderRadius: 999, cursor: 'pointer',
                      fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                      border: data.effectif === opt.id
                        ? '1px solid rgba(68,102,238,0.4)'
                        : '1px solid rgba(255,255,255,0.04)',
                      background: data.effectif === opt.id
                        ? 'rgba(68,102,238,0.08)'
                        : 'rgba(255,255,255,0.02)',
                      color: data.effectif === opt.id
                        ? '#b0b8dd'
                        : 'var(--dg-text-dim)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 8: Patrimoine (conditional) */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  Patrimoine immobilier
                </h1>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                {[
                  { value: true, label: 'Oui' },
                  { value: false, label: 'Non' },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => {
                      setData((d) => ({ ...d, hasPatrimoine: opt.value }))
                      goNextDeferred(200)
                    }}
                    style={{
                      padding: '14px 40px', borderRadius: 12, cursor: 'pointer',
                      fontSize: 16, fontWeight: 700, transition: 'all 0.15s',
                      border: data.hasPatrimoine === opt.value
                        ? '1px solid rgba(68,102,238,0.4)'
                        : '1px solid rgba(255,255,255,0.04)',
                      background: data.hasPatrimoine === opt.value
                        ? 'rgba(68,102,238,0.08)'
                        : 'rgba(255,255,255,0.02)',
                      color: data.hasPatrimoine === opt.value
                        ? '#b0b8dd'
                        : 'var(--dg-text-dim)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 9: Loyers (conditional) */}
          {step === 9 && (
            <div>
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  Revenus locatifs nets
                </h1>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--dg-input-bg)',
                border: '1px solid var(--dg-input-border)',
                borderRadius: 12, padding: '0 16px',
                maxWidth: 400, margin: '24px auto 0',
              }}>
                <input
                  ref={inputRef}
                  type="number"
                  value={data.loyersNets !== null ? data.loyersNets : ''}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      loyersNets: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  onKeyDown={(e) => { if (e.key === 'Enter' && canProceed()) goNext() }}
                  style={{
                    flex: 1, padding: '16px 0', border: 'none', background: 'transparent',
                    outline: 'none', color: 'var(--dg-input-text)', fontSize: 20, fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--dg-text-muted)', fontWeight: 500, marginLeft: 8 }}>€/an</span>
              </div>
            </div>
          )}

          {/* Step 10: Rémunération dirigeant */}
          {step === 10 && (
            <StepQuickChoices
              title="Rémunération annuelle"
              description=""
              choices={REMUNERATION_CHOICES}
              selectedId={remunerationSelectedId}
              onSelect={(choice) => {
                setRemunerationSelectedId(choice.id)
                setData((d) => ({ ...d, remunerationDirigeant: choice.value }))
                setDataSources((s) => ({ ...s, remunerationDirigeant: 'declaratif' }))
                goNextDeferred(200)
              }}
              showExactInput
              exactValue={remunerationSelectedId === 'exact' ? data.remunerationDirigeant : null}
              onExactChange={(value) => {
                setRemunerationSelectedId('exact')
                setData((d) => ({ ...d, remunerationDirigeant: value }))
                setDataSources((s) => ({ ...s, remunerationDirigeant: 'declaratif' }))
              }}
              unit="€/an"
            />
          )}

          {/* Step 11: Dettes financières */}
          {step === 11 && (
            <div>
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  Dettes financières
                </h1>
                {data.pappersDettes != null && bilanAnnee && (
                  <p style={{ fontSize: 12, color: 'var(--dg-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
                    Pappers {bilanAnnee} : {formatNumber(data.pappersDettes)} €
                  </p>
                )}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--dg-input-bg)',
                border: '1px solid var(--dg-input-border)',
                borderRadius: 12, padding: '0 16px',
                maxWidth: 400, margin: '24px auto 0',
              }}>
                <input
                  ref={inputRef}
                  type="number"
                  value={data.dettesFinancieres !== null ? data.dettesFinancieres : ''}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      dettesFinancieres: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  onKeyDown={(e) => { if (e.key === 'Enter' && canProceed()) goNext() }}
                  style={{
                    flex: 1, padding: '16px 0', border: 'none', background: 'transparent',
                    outline: 'none', color: 'var(--dg-input-text)', fontSize: 20, fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--dg-text-muted)', fontWeight: 500, marginLeft: 8 }}>€</span>
              </div>
              <CrossValidationWarning
                userValue={data.dettesFinancieres}
                pappersValue={data.pappersDettes}
                label="dette financière"
              />
            </div>
          )}

          {/* Step 12: Trésorerie */}
          {step === 12 && (
            <div>
              <div className="text-center">
                <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
                  Trésorerie disponible
                </h1>
                {data.pappersTresorerie != null && bilanAnnee && (
                  <p style={{ fontSize: 12, color: 'var(--dg-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
                    Pappers {bilanAnnee} : {formatNumber(data.pappersTresorerie)} €
                  </p>
                )}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--dg-input-bg)',
                border: '1px solid var(--dg-input-border)',
                borderRadius: 12, padding: '0 16px',
                maxWidth: 400, margin: '24px auto 0',
              }}>
                <input
                  ref={inputRef}
                  type="number"
                  value={data.tresorerieActuelle !== null ? data.tresorerieActuelle : ''}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      tresorerieActuelle: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  onKeyDown={(e) => { if (e.key === 'Enter' && canProceed()) goNext() }}
                  style={{
                    flex: 1, padding: '16px 0', border: 'none', background: 'transparent',
                    outline: 'none', color: 'var(--dg-input-text)', fontSize: 20, fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--dg-text-muted)', fontWeight: 500, marginLeft: 8 }}>€</span>
              </div>
              <CrossValidationWarning
                userValue={data.tresorerieActuelle}
                pappersValue={data.pappersTresorerie}
                label="trésorerie"
              />
            </div>
          )}

          {/* Step 13: Concentration client */}
          {step === 13 && (
            <StepQuickChoices
              title="Concentration clients"
              description=""
              choices={CONCENTRATION_CHOICES}
              selectedId={concentrationSelectedId}
              onSelect={(choice) => {
                setConcentrationSelectedId(choice.id)
                setData((d) => ({ ...d, concentrationClient: choice.value }))
                setDataSources((s) => ({ ...s, concentrationClient: 'declaratif' }))
                goNextDeferred(200)
              }}
            />
          )}

          {/* Step 15: MRR (SaaS only) */}
          {step === 14 && (
            <StepMRR
              mrrMensuel={data.mrrMensuel}
              pappersCA={data.pappersCA}
              onChange={(mrr) => setData((d) => ({ ...d, mrrMensuel: mrr }))}
            />
          )}

          {/* Step 15: Pappers recap */}
          {step === 15 && (
            <StepPappersRecap
              companyName={data.companyName}
              pappersCA={data.pappersCA}
              pappersEBITDA={data.pappersEBITDA}
              pappersTresorerie={data.pappersTresorerie}
              pappersDettes={data.pappersDettes}
              pappersEffectif={data.effectif}
              bilanAnnee={bilanAnnee}
              onConfirm={handlePappersConfirm}
              onUpdate={handlePappersUpdate}
            />
          )}

          {/* Step 16: Final recap */}
          {step === 16 && (
            <StepFinalRecap
              data={data}
              dataSources={dataSources}
              companyName={data.companyName}
              onSubmit={handleSubmit}
              onEdit={goToStep}
            />
          )}
        </div>

        {/* Gate 1: Coherence alerts for current step */}
        {alertsForStep(step).length > 0 && (
          <div className="mt-4 space-y-2">
            {alertsForStep(step).map((alert) => (
              <AlertBanner
                key={alert.id}
                alert={alert}
                confirmed={confirmedAlerts.includes(alert.id)}
                onConfirm={() => setConfirmedAlerts((prev) => [...prev, alert.id])}
              />
            ))}
          </div>
        )}

        {/* Navigation */}
        {step !== 0 && step !== 15 && step !== 16 && !(step === 4 && pappersGrowth != null) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, maxWidth: 440, margin: '32px auto 0' }}>
            {currentActiveIndex > 0 ? (
              <button type="button" onClick={goBack} style={{ background: 'none', border: 'none', color: 'var(--dg-text-muted)', fontSize: 13, cursor: 'pointer' }}>
                ← Retour
              </button>
            ) : <div />}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {[10, 11, 12].includes(step) && (
                <button type="button" onClick={goNext} style={{ background: 'none', border: 'none', color: 'var(--dg-text-muted)', fontSize: 13, cursor: 'pointer' }}>
                  Passer
                </button>
              )}
              {![1, 7, 8, 13].includes(step) && (
                <button
                  type="button"
                  onClick={() => canProceed() && goNext()}
                  disabled={!canProceed()}
                  style={{
                    padding: '12px 32px', borderRadius: 12, border: 'none',
                    fontSize: 14, fontWeight: 700, cursor: canProceed() ? 'pointer' : 'default',
                    ...(canProceed()
                      ? { background: 'linear-gradient(135deg, #3355cc, #4466ee)', color: '#fff', boxShadow: '0 4px 20px rgba(51,85,204,0.2)' }
                      : { background: 'rgba(255,255,255,0.03)', color: '#2a2e44' }),
                  }}
                >
                  {isLastStep ? 'Voir mon diagnostic' : 'Continuer'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hint Enter */}
        {[0, 2, 3, 9, 11, 12, 14].includes(step) && (
          <p style={{ textAlign: 'center', fontSize: 11, color: '#2a2e44', marginTop: 12 }}>Entrée ↵</p>
        )}
      </div>
    </div>
  )
}
