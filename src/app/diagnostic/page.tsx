'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { trackConversion } from '@/lib/analytics'

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
}

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
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '%',
}: {
  label: string
  hint: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-medium text-[var(--text-primary)]">{label}</span>
        <span className="text-[20px] font-bold text-[var(--accent)]">
          {value > 0 ? '+' : ''}{value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--border) ${pct}%, var(--border) 100%)`,
          accentColor: 'var(--accent)',
        }}
      />
      <div className="flex justify-between text-[12px] text-[var(--text-muted)]">
        <span>{min}{suffix}</span>
        <span>{hint}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DiagnosticPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<DiagnosticFormData>(INITIAL_DATA)
  const [sirenLoading, setSirenLoading] = useState(false)
  const [sirenError, setSirenError] = useState<string | null>(null)
  const [sirenFound, setSirenFound] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  // Track diagnostic_start on mount
  useEffect(() => {
    const source = document.referrer.includes('/tarifs') ? 'tarifs'
      : document.referrer.includes(window.location.origin) ? 'landing'
      : 'direct'
    trackConversion('diagnostic_start', { source })
  }, [])

  // Determine which steps are active based on conditional logic
  const getActiveSteps = useCallback(() => {
    const steps = [0, 1, 2, 3, 4, 5, 6, 7] // Steps 1-8 always active
    const skipPatrimoine = SKIP_PATRIMOINE_TYPES.includes(data.activityType)
    if (!skipPatrimoine) steps.push(8) // Step 9: patrimoine
    const showLoyers = data.hasPatrimoine === true || data.activityType === 'immobilier'
    if (showLoyers) steps.push(9) // Step 10: loyers
    return steps
  }, [data.activityType, data.hasPatrimoine])

  const activeSteps = getActiveSteps()
  const currentActiveIndex = activeSteps.indexOf(step)
  const totalSteps = activeSteps.length
  const progress = totalSteps > 0 ? ((currentActiveIndex + 1) / totalSteps) * 100 : 0

  // SIREN lookup
  const lookupSiren = async () => {
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
        throw new Error(body.error || 'Entreprise non trouvée')
      }
      const json = await res.json()
      setData((d) => ({
        ...d,
        companyName: json.entreprise?.nom || '',
        nafCode: json.entreprise?.codeNaf || '',
        sector: json.entreprise?.secteur || '',
      }))
      setSirenFound(true)
      trackConversion('sirene_entered', { siren: digits, sector_naf: json.entreprise?.codeNaf || '' })
    } catch (err) {
      setSirenError(err instanceof Error ? err.message : 'Erreur de recherche')
      setSirenFound(false)
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

  const goBack = () => {
    const idx = activeSteps.indexOf(step)
    if (idx > 0) {
      setDirection('backward')
      setStep(activeSteps[idx - 1])
    }
  }

  // When activity type changes, handle auto-skip logic
  useEffect(() => {
    if (SKIP_PATRIMOINE_TYPES.includes(data.activityType)) {
      setData((d) => ({ ...d, hasPatrimoine: false }))
    }
  }, [data.activityType])

  // Check if current step can proceed
  const canProceed = (): boolean => {
    switch (step) {
      case 0: return sirenFound // SIREN is mandatory
      case 1: return data.activityType !== ''
      case 2: return data.revenue !== null && data.revenue >= 0
      case 3: return data.ebitda !== null
      case 4: return true // slider always has value
      case 5: return true
      case 6: return true
      case 7: return data.effectif !== ''
      case 8: return data.hasPatrimoine !== null
      case 9: return data.loyersNets !== null && data.loyersNets >= 0
      default: return false
    }
  }

  const isLastStep = currentActiveIndex === totalSteps - 1

  // Submit
  const handleSubmit = () => {
    sessionStorage.setItem('diagnostic_data', JSON.stringify(data))
    router.push('/diagnostic/loading')
  }

  // Animation key for step transitions
  const animKey = `step-${step}-${direction}`

  return (
    <div className="min-h-[calc(100vh-var(--nav-height))] bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6 py-8">
      {/* Progress bar */}
      <div className="fixed top-[var(--nav-height)] left-0 right-0 z-40 h-1 bg-[var(--border)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Centered content block */}
      <div className="w-full max-w-lg">
        {/* Step counter */}
        <div className="pb-4 text-center">
          <p className="text-[13px] text-[var(--text-muted)]">
            Étape {currentActiveIndex + 1} sur {totalSteps}
          </p>
        </div>

        <div
          key={animKey}
          className="animate-fade-up"
        >
          {/* Step 1: SIREN */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
                  Quel est le SIREN de votre entreprise ?
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Nous pré-remplirons automatiquement vos données.
                </p>
              </div>

              <div className="flex gap-3">
                <Input
                  placeholder="XXX XXX XXX"
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
                  error={sirenError || undefined}
                  containerClassName="flex-1"
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={lookupSiren}
                  isLoading={sirenLoading}
                  disabled={data.siren.replace(/\D/g, '').length !== 9}
                  className="shrink-0"
                >
                  Rechercher
                </Button>
              </div>

              {sirenFound && data.companyName && (
                <div className="bg-[var(--success-light)] border border-[var(--success)]/20 rounded-[var(--radius-lg)] p-4 animate-fade-up">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--success)] rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-[14px]">
                      {data.companyName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{data.companyName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {data.sector && <Badge variant="neutral" size="sm">{data.sector}</Badge>}
                        {data.nafCode && (
                          <span className="text-[12px] text-[var(--text-muted)]">NAF {data.nafCode}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Activity type */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
                  Quel est votre type d'activité ?
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Choisissez la catégorie la plus proche.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ACTIVITY_TYPES.map((type, i) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setData((d) => ({ ...d, activityType: type.id }))
                      setTimeout(goNext, 200)
                    }}
                    className={`
                      flex items-center gap-3 p-4
                      rounded-[var(--radius-lg)]
                      border-2 transition-all duration-200
                      hover-lift cursor-pointer text-left
                      delay-${i + 1}
                      ${
                        data.activityType === type.id
                          ? 'border-[var(--accent)] bg-[var(--accent-light)] shadow-[var(--shadow-sm)]'
                          : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--border-hover)]'
                      }
                    `}
                  >
                    <span className="text-[24px]">{type.icon}</span>
                    <span className={`text-[14px] font-medium ${
                      data.activityType === type.id
                        ? 'text-[var(--accent)]'
                        : 'text-[var(--text-primary)]'
                    }`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Revenue */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
                  Quel est votre chiffre d'affaires annuel ?
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Dernier exercice clos ou estimation pour l'année en cours.
                </p>
              </div>
              <Input
                type="number"
                placeholder="ex : 500000"
                value={data.revenue !== null ? data.revenue : ''}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    revenue: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
                rightIcon={<span className="text-[var(--text-muted)] text-[13px]">€/an</span>}
                min={0}
              />
              {data.revenue !== null && data.revenue > 0 && (
                <p className="text-center text-[var(--text-muted)] text-[14px]">
                  {formatNumber(data.revenue)} €
                </p>
              )}
            </div>
          )}

          {/* Step 4: EBITDA */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
                  Quel est votre EBITDA annuel ?
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Résultat d'exploitation + dotations aux amortissements. Peut être négatif.
                </p>
              </div>
              <Input
                type="number"
                placeholder="ex : 60000"
                value={data.ebitda !== null ? data.ebitda : ''}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    ebitda: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
                rightIcon={<span className="text-[var(--text-muted)] text-[13px]">€/an</span>}
              />
              {data.ebitda !== null && (
                <p className={`text-center text-[14px] ${data.ebitda < 0 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
                  {formatNumber(data.ebitda)} €
                  {data.revenue && data.revenue > 0 && (
                    <span className="ml-2">
                      (marge : {((data.ebitda / data.revenue) * 100).toFixed(1)}%)
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Step 5: Growth */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
                  Quelle est votre croissance annuelle ?
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Évolution du CA sur les 12 derniers mois.
                </p>
              </div>
              <DiagnosticSlider
                label="Croissance"
                hint="Médiane PME : +5%"
                value={data.growth}
                onChange={(v) => setData((d) => ({ ...d, growth: v }))}
                min={-30}
                max={100}
                step={5}
              />
            </div>
          )}

          {/* Step 6: Recurring */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
                  Quelle part de vos revenus est récurrente ?
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Abonnements, contrats, clients réguliers.
                </p>
              </div>
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
          )}

          {/* Step 7: Masse salariale */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
                  Quel est le poids de votre masse salariale ?
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Masse salariale totale (charges incluses) en % du CA.
                </p>
              </div>
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
          )}

          {/* Step 8: Effectif */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
                  Combien de salariés avez-vous ?
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Y compris le dirigeant.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {EFFECTIF_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setData((d) => ({ ...d, effectif: opt.id }))
                      setTimeout(goNext, 200)
                    }}
                    className={`
                      px-6 py-3
                      rounded-[var(--radius-full)]
                      border-2 transition-all duration-200
                      font-medium text-[15px]
                      cursor-pointer
                      ${
                        data.effectif === opt.id
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-[var(--shadow-sm)]'
                          : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 9: Patrimoine (conditional) */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
                  Votre entreprise détient-elle un patrimoine significatif ?
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Immobilier, fonds de commerce, brevets, actifs corporels importants.
                </p>
              </div>
              <div className="flex justify-center gap-4">
                {[
                  { value: true, label: 'Oui' },
                  { value: false, label: 'Non' },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => {
                      setData((d) => ({ ...d, hasPatrimoine: opt.value }))
                      setTimeout(goNext, 200)
                    }}
                    className={`
                      px-10 py-4
                      rounded-[var(--radius-lg)]
                      border-2 transition-all duration-200
                      font-semibold text-[18px]
                      cursor-pointer min-w-[120px]
                      ${
                        data.hasPatrimoine === opt.value
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-[var(--shadow-sm)]'
                          : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--border-hover)]'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 10: Loyers (conditional) */}
          {step === 9 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
                  Quels sont vos revenus locatifs annuels nets ?
                </h1>
                <p className="text-[var(--text-secondary)]">
                  Loyers perçus nets de charges.
                </p>
              </div>
              <Input
                type="number"
                placeholder="ex : 36000"
                value={data.loyersNets !== null ? data.loyersNets : ''}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    loyersNets: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
                rightIcon={<span className="text-[var(--text-muted)] text-[13px]">€/an</span>}
                min={0}
              />
              {data.loyersNets !== null && data.loyersNets > 0 && (
                <p className="text-center text-[var(--text-muted)] text-[14px]">
                  {formatNumber(data.loyersNets)} €/an
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4 mt-8">
          {currentActiveIndex > 0 ? (
            <Button type="button" variant="ghost" onClick={goBack}>
              ← Retour
            </Button>
          ) : (
            <div />
          )}
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={goNext}
            disabled={!canProceed()}
          >
            {isLastStep ? 'Voir mon diagnostic' : 'Continuer'} →
          </Button>
        </div>
      </div>
    </div>
  )
}
