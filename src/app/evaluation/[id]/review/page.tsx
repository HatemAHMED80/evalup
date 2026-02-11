'use client'

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

// ─────────────────────────────────────────────────────────────────────────────
// Types (miroir de la route /api/documents/extract)
// ─────────────────────────────────────────────────────────────────────────────

interface ExerciceData {
  annee: number
  ca: number | null
  resultat_exploitation: number | null
  resultat_net: number | null
  ebitda: number | null
  dotations_amortissements: number | null
  dotations_provisions: number | null
  charges_personnel: number | null
  effectif_moyen: number | null
  remuneration_dirigeant: number | null
  loyers: number | null
  credit_bail: number | null
  capitaux_propres: number | null
  dettes_financieres: number | null
  tresorerie: number | null
  total_actif: number | null
  actif_immobilise: number | null
  stocks: number | null
  creances_clients: number | null
  dettes_fournisseurs: number | null
}

interface ExtractionMetadata {
  source_documents: string[]
  completeness_score: number
  missing_critical: string[]
  warnings: string[]
}

interface ExtractionResult {
  exercices: ExerciceData[]
  metadata: ExtractionMetadata
}

type ExerciceField = keyof Omit<ExerciceData, 'annee'>

// ─────────────────────────────────────────────────────────────────────────────
// Configuration des champs
// ─────────────────────────────────────────────────────────────────────────────

interface FieldDef {
  key: ExerciceField
  label: string
  category: 'resultat' | 'bilan' | 'detail'
  critical: boolean
  unit: 'euro' | 'nombre'
  computed?: boolean
}

const FIELDS: FieldDef[] = [
  // Compte de resultat
  { key: 'ca', label: "Chiffre d'affaires", category: 'resultat', critical: true, unit: 'euro' },
  { key: 'resultat_exploitation', label: "Resultat d'exploitation", category: 'resultat', critical: true, unit: 'euro' },
  { key: 'resultat_net', label: 'Resultat net', category: 'resultat', critical: true, unit: 'euro' },
  { key: 'ebitda', label: 'EBITDA', category: 'resultat', critical: true, unit: 'euro', computed: true },
  { key: 'dotations_amortissements', label: 'Dotations amortissements', category: 'resultat', critical: false, unit: 'euro' },
  { key: 'dotations_provisions', label: 'Dotations provisions', category: 'resultat', critical: false, unit: 'euro' },
  { key: 'charges_personnel', label: 'Charges de personnel', category: 'resultat', critical: true, unit: 'euro' },
  { key: 'effectif_moyen', label: 'Effectif moyen', category: 'resultat', critical: false, unit: 'nombre' },
  { key: 'remuneration_dirigeant', label: 'Remuneration dirigeant', category: 'detail', critical: true, unit: 'euro' },
  { key: 'loyers', label: 'Loyers', category: 'detail', critical: false, unit: 'euro' },
  { key: 'credit_bail', label: 'Credit-bail', category: 'detail', critical: false, unit: 'euro' },
  // Bilan
  { key: 'capitaux_propres', label: 'Capitaux propres', category: 'bilan', critical: true, unit: 'euro' },
  { key: 'dettes_financieres', label: 'Dettes financieres', category: 'bilan', critical: false, unit: 'euro' },
  { key: 'tresorerie', label: 'Tresorerie', category: 'bilan', critical: false, unit: 'euro' },
  { key: 'total_actif', label: 'Total actif', category: 'bilan', critical: false, unit: 'euro' },
  { key: 'actif_immobilise', label: 'Actif immobilise', category: 'bilan', critical: false, unit: 'euro' },
  { key: 'stocks', label: 'Stocks', category: 'bilan', critical: false, unit: 'euro' },
  { key: 'creances_clients', label: 'Creances clients', category: 'bilan', critical: false, unit: 'euro' },
  { key: 'dettes_fournisseurs', label: 'Dettes fournisseurs', category: 'bilan', critical: false, unit: 'euro' },
]

const CATEGORY_LABELS: Record<string, string> = {
  resultat: 'Compte de resultat',
  bilan: 'Bilan',
  detail: 'Donnees complementaires',
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatEuro(value: number): string {
  return value.toLocaleString('fr-FR') + ' \u20AC'
}

function formatValue(value: number | null, unit: 'euro' | 'nombre'): string {
  if (value === null || value === undefined) return ''
  if (unit === 'euro') return formatEuro(value)
  return value.toLocaleString('fr-FR')
}

function parseInputValue(raw: string): number | null {
  if (!raw.trim()) return null
  // Accept various number formats: "1 234 567", "1234567", "1,234,567", "-500"
  const cleaned = raw.replace(/[^0-9,.\-]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : Math.round(num)
}

function getSourceLabel(metadata: ExtractionMetadata, field: FieldDef): string {
  if (field.computed) return 'Calcule (RE + Amort.)'
  if (metadata.source_documents.length === 1) return metadata.source_documents[0]
  return metadata.source_documents.join(', ')
}

// ─────────────────────────────────────────────────────────────────────────────
// Session storage keys
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY_EXTRACTION = (id: string) => `evalup_extraction_${id}`
const STORAGE_KEY_VALIDATED = (id: string) => `evalup_validated_data_${id}`

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: evaluationId } = use(params)
  const router = useRouter()

  // State
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [evaluationName, setEvaluationName] = useState<string>('')
  const [exercices, setExercices] = useState<ExerciceData[]>([])
  const [metadata, setMetadata] = useState<ExtractionMetadata | null>(null)
  const [editingCell, setEditingCell] = useState<{ exIdx: number; field: ExerciceField } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(0) // index of active exercice tab
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Load extraction data ──
  useEffect(() => {
    async function load() {
      try {
        // 1. Auth + evaluation check
        const res = await fetch(`/api/evaluations/${evaluationId}`)
        if (res.status === 401) {
          setAuthError('Connectez-vous pour acceder a cette page.')
          setLoading(false)
          return
        }
        if (res.status === 403) {
          setAuthError("Vous n'avez pas acces a cette evaluation.")
          setLoading(false)
          return
        }
        if (res.status === 402) {
          router.replace(`/checkout?eval=${evaluationId}`)
          return
        }
        if (!res.ok) {
          setAuthError('Evaluation introuvable.')
          setLoading(false)
          return
        }
        const evalData = await res.json()
        setEvaluationName(evalData.entreprise_nom || `SIREN ${evalData.siren}`)

        // 2. Read extraction data from sessionStorage
        const stored = sessionStorage.getItem(STORAGE_KEY_EXTRACTION(evaluationId))
        if (stored) {
          const extraction: ExtractionResult = JSON.parse(stored)
          setExercices(extraction.exercices || [])
          setMetadata(extraction.metadata || null)
        } else {
          // No extraction data — redirect to upload
          router.replace(`/evaluation/${evaluationId}/upload`)
          return
        }
      } catch {
        setAuthError('Erreur de connexion. Reessayez.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [evaluationId, router])

  // ── Focus input when editing starts ──
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // ── Start editing a cell ──
  const startEdit = useCallback((exIdx: number, field: ExerciceField, currentValue: number | null) => {
    setEditingCell({ exIdx, field })
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '')
  }, [])

  // ── Confirm edit ──
  const confirmEdit = useCallback(() => {
    if (!editingCell) return
    const { exIdx, field } = editingCell
    const newValue = parseInputValue(editValue)

    setExercices(prev => {
      const updated = [...prev]
      updated[exIdx] = { ...updated[exIdx], [field]: newValue }

      // Recalculate EBITDA if components changed
      if (['resultat_exploitation', 'dotations_amortissements', 'dotations_provisions'].includes(field)) {
        const ex = updated[exIdx]
        if (ex.resultat_exploitation !== null) {
          const da = ex.dotations_amortissements ?? 0
          const dp = ex.dotations_provisions ?? 0
          updated[exIdx] = { ...updated[exIdx], ebitda: ex.resultat_exploitation + da + dp }
        }
      }

      return updated
    })

    setEditingCell(null)
    setEditValue('')
  }, [editingCell, editValue])

  // ── Cancel edit ──
  const cancelEdit = useCallback(() => {
    setEditingCell(null)
    setEditValue('')
  }, [])

  // ── Handle keyboard in input ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }, [confirmEdit, cancelEdit])

  // ── Compute live completeness ──
  const completenessScore = useMemo(() => {
    if (exercices.length === 0) return 0
    const latest = exercices[activeTab] || exercices[0]
    if (!latest) return 0

    let filled = 0
    const total = FIELDS.length

    for (const f of FIELDS) {
      if (latest[f.key] !== null && latest[f.key] !== undefined) filled++
    }

    let score = Math.round((filled / total) * 100)
    if (exercices.length >= 2) score = Math.min(100, score + 10)
    return score
  }, [exercices, activeTab])

  // ── Missing critical fields ──
  const missingCritical = useMemo(() => {
    if (exercices.length === 0) return []
    const latest = exercices[activeTab] || exercices[0]
    if (!latest) return []

    return FIELDS
      .filter(f => f.critical && (latest[f.key] === null || latest[f.key] === undefined))
      .map(f => f.label)
  }, [exercices, activeTab])

  // ── Group fields by category ──
  const fieldsByCategory = useMemo(() => {
    const groups: Record<string, FieldDef[]> = {}
    for (const f of FIELDS) {
      if (!groups[f.category]) groups[f.category] = []
      groups[f.category].push(f)
    }
    return groups
  }, [])

  // ── Confirm and redirect ──
  const handleConfirm = useCallback(async () => {
    setIsSaving(true)
    try {
      // Store validated data for the chat page
      const validatedData: ExtractionResult = {
        exercices,
        metadata: {
          source_documents: metadata?.source_documents || [],
          completeness_score: completenessScore,
          missing_critical: missingCritical,
          warnings: metadata?.warnings || [],
        },
      }
      sessionStorage.setItem(STORAGE_KEY_VALIDATED(evaluationId), JSON.stringify(validatedData))

      // Navigate to chat
      router.push(`/evaluation/${evaluationId}/chat`)
    } catch {
      setIsSaving(false)
    }
  }, [exercices, metadata, completenessScore, missingCritical, evaluationId, router])

  // ─────────────────────────────────────────────────────────────────────────
  // Render states
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <Card variant="default" padding="lg" className="max-w-md w-full text-center">
          <p className="text-[var(--danger)] font-medium mb-4">{authError}</p>
          <Button variant="primary" onClick={() => router.push('/login')}>
            Se connecter
          </Button>
        </Card>
      </div>
    )
  }

  if (exercices.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <Card variant="default" padding="lg" className="max-w-md w-full text-center">
          <p className="text-[var(--text-secondary)] mb-4">Aucune donnee extraite. Uploadez vos documents d&apos;abord.</p>
          <Button variant="primary" onClick={() => router.push(`/evaluation/${evaluationId}/upload`)}>
            Uploader des documents
          </Button>
        </Card>
      </div>
    )
  }

  const currentExercice = exercices[activeTab]

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {/* ── Header ── */}
      <header className="bg-[var(--bg-primary)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">
            Verifiez les donnees extraites
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-4">
            {evaluationName} &mdash; Nous avons analyse vos documents. Verifiez et corrigez si necessaire.
          </p>

          {/* Stepper */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--success)] text-white">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">&#10003;</span>
              Documents
            </span>
            <span className="text-[var(--text-muted)]">&rarr;</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)] text-white">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
              Verification
            </span>
            <span className="text-[var(--text-muted)]">&rarr;</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
              <span className="w-4 h-4 rounded-full bg-[var(--border)] flex items-center justify-center text-[10px]">3</span>
              Entretien IA
            </span>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ── Completeness score ── */}
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Completude des donnees
            </span>
            <Badge
              variant={completenessScore >= 80 ? 'success' : completenessScore >= 50 ? 'warning' : 'danger'}
              size="md"
            >
              {completenessScore}%
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completenessScore >= 80
                  ? 'bg-[var(--success)]'
                  : completenessScore >= 50
                    ? 'bg-[var(--warning)]'
                    : 'bg-[var(--danger)]'
              }`}
              style={{ width: `${completenessScore}%` }}
            />
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            {completenessScore >= 80
              ? 'Excellent ! Vous avez suffisamment de donnees pour une evaluation precise.'
              : `${completenessScore}% des donnees necessaires extraites.`}
          </p>

          {missingCritical.length > 0 && (
            <div className="mt-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--warning-light)]">
              <p className="text-sm font-medium text-[var(--warning)] mb-1">
                Il manque : {missingCritical.join(', ')}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Ces donnees seront demandees pendant l&apos;entretien IA
              </p>
            </div>
          )}
        </Card>

        {/* ── Source documents ── */}
        {metadata && metadata.source_documents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {metadata.source_documents.map(doc => (
              <Badge key={doc} variant="neutral" size="sm">
                {doc}
              </Badge>
            ))}
          </div>
        )}

        {/* ── Exercice tabs (if multiple years) ── */}
        {exercices.length > 1 && (
          <div className="flex gap-1 p-1 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] w-fit">
            {exercices.map((ex, idx) => (
              <button
                key={ex.annee}
                onClick={() => setActiveTab(idx)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-all
                  ${activeTab === idx
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }
                `}
              >
                Exercice {ex.annee}
              </button>
            ))}
          </div>
        )}

        {/* ── Data tables by category ── */}
        {Object.entries(fieldsByCategory).map(([category, fields]) => (
          <Card key={category} variant="default" padding="none">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {CATEGORY_LABELS[category] || category}
              </span>
            </div>

            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_180px_140px_80px] gap-2 px-5 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide border-b border-[var(--border)]">
              <span>Donnee</span>
              <span className="text-right">Valeur extraite</span>
              <span>Source</span>
              <span>Action</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[var(--border)]">
              {fields.map(field => {
                const value = currentExercice[field.key]
                const isEditing = editingCell?.exIdx === activeTab && editingCell?.field === field.key
                const isMissing = value === null || value === undefined

                return (
                  <div
                    key={field.key}
                    className={`
                      grid grid-cols-1 sm:grid-cols-[1fr_180px_140px_80px] gap-1 sm:gap-2 px-5 py-3 items-center
                      ${isMissing && field.critical ? 'bg-[var(--warning-light)]/30' : ''}
                      hover:bg-[var(--bg-secondary)] transition-colors
                    `}
                  >
                    {/* Label */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--text-primary)]">
                        {field.label}
                      </span>
                      {field.critical && (
                        <span className="text-[10px] text-[var(--accent)] font-medium uppercase">cle</span>
                      )}
                    </div>

                    {/* Value / Edit input */}
                    <div className="text-right">
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={confirmEdit}
                          onKeyDown={handleKeyDown}
                          placeholder={field.unit === 'euro' ? '0' : '0'}
                          className="
                            w-full text-right text-sm px-2 py-1
                            bg-[var(--bg-primary)] border border-[var(--accent)]
                            rounded-[var(--radius-sm)] outline-none
                            text-[var(--text-primary)]
                            focus:ring-2 focus:ring-[var(--accent)]/20
                          "
                        />
                      ) : isMissing ? (
                        <span className="text-sm text-[var(--warning)] font-medium">
                          Non trouve
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-[var(--text-primary)] tabular-nums">
                          {formatValue(value, field.unit)}
                        </span>
                      )}
                    </div>

                    {/* Source */}
                    <div className="text-xs text-[var(--text-tertiary)] truncate">
                      {isMissing ? '\u2014' : getSourceLabel(metadata!, field)}
                    </div>

                    {/* Action button */}
                    <div>
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(activeTab, field.key, value)}
                          className={`
                            text-xs font-medium px-2 py-1 rounded-[var(--radius-sm)] transition-colors
                            ${isMissing
                              ? 'text-[var(--accent)] hover:bg-[var(--accent-light)]'
                              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                            }
                          `}
                        >
                          {isMissing ? 'Ajouter' : 'Modifier'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}

        {/* ── Warnings ── */}
        {metadata && metadata.warnings.length > 0 && (
          <Card variant="ghost" padding="md">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
              Remarques
            </p>
            <div className="space-y-1.5">
              {metadata.warnings.map((w, i) => (
                <p key={i} className="text-sm text-[var(--text-secondary)] flex gap-2">
                  <span className="text-[var(--warning)] flex-shrink-0">&#9888;</span>
                  {w}
                </p>
              ))}
            </div>
          </Card>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col items-center gap-3 pt-4 pb-8">
          <Button
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            disabled={isSaving}
            isLoading={isSaving}
            className="w-full sm:w-auto"
            rightIcon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            Confirmer et lancer l&apos;entretien IA
          </Button>
          <button
            onClick={() => router.push(`/evaluation/${evaluationId}/upload`)}
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors underline underline-offset-2"
          >
            &larr; Retour aux documents
          </button>
        </div>
      </main>
    </div>
  )
}
