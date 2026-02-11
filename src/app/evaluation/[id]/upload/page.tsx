'use client'

import { use, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
  analysis?: Record<string, unknown>
}

interface EvaluationInfo {
  id: string
  siren: string
  entreprise_nom?: string
  type: string
  status: string
  archetype?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 Mo
const MAX_FILES = 5
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
]
const ACCEPTED_EXTENSIONS = '.pdf,.xlsx,.xls,.jpg,.jpeg,.png'

const SUGGESTED_DOCS = [
  { id: 'bilan_n', label: 'Bilan comptable 2024 (ou dernier exercice)', tag: 'RECOMMANDE', keywords: ['bilan', '2024', '2025'] },
  { id: 'bilan_n1', label: 'Bilan comptable 2023 (N-1)', tag: 'RECOMMANDE', keywords: ['bilan', '2023', 'n-1'] },
  { id: 'compte_resultat', label: 'Compte de resultat detaille', tag: 'OPTIONNEL', keywords: ['resultat', 'compte', 'p&l'] },
  { id: 'balance', label: 'Balance generale', tag: 'OPTIONNEL', keywords: ['balance', 'generale'] },
  { id: 'bp', label: 'Business plan / previsionnel', tag: 'OPTIONNEL', keywords: ['business', 'plan', 'previsionnel', 'bp'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function getFileIcon(file: File): string {
  if (file.type === 'application/pdf') return '📄'
  if (file.type.includes('spreadsheet') || file.type.includes('excel')) return '📊'
  if (file.type.startsWith('image/')) return '🖼️'
  return '📎'
}

function matchesSuggestedDoc(fileName: string, keywords: string[]): boolean {
  const lower = fileName.toLowerCase()
  return keywords.some(kw => lower.includes(kw))
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function UploadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: evaluationId } = use(params)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [evaluation, setEvaluation] = useState<EvaluationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  // ── Fetch evaluation info + auth check ──
  useEffect(() => {
    async function fetchEvaluation() {
      try {
        const res = await fetch(`/api/evaluations/${evaluationId}`)
        if (res.status === 401) {
          setAuthError('Connectez-vous pour acceder a cette page.')
          setLoading(false)
          return
        }
        if (res.status === 403) {
          setAuthError('Vous n\'avez pas acces a cette evaluation.')
          setLoading(false)
          return
        }
        if (res.status === 402) {
          // Not paid — redirect to checkout
          router.replace(`/checkout?eval=${evaluationId}`)
          return
        }
        if (!res.ok) {
          setAuthError('Evaluation introuvable.')
          setLoading(false)
          return
        }
        const data = await res.json()
        setEvaluation(data)
      } catch {
        setAuthError('Erreur de connexion. Reessayez.')
      } finally {
        setLoading(false)
      }
    }
    fetchEvaluation()
  }, [evaluationId, router])

  // ── File validation ──
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} depasse la taille max (${formatFileSize(MAX_FILE_SIZE)})`
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name} : format non accepte. Utilisez PDF, Excel ou image.`
    }
    return null
  }, [])

  // ── Add files ──
  const addFiles = useCallback((newFiles: File[]) => {
    setAnalyzeError(null)

    const currentCount = files.length
    const remaining = MAX_FILES - currentCount
    if (remaining <= 0) {
      setAnalyzeError(`Maximum ${MAX_FILES} fichiers atteint.`)
      return
    }

    const toAdd = newFiles.slice(0, remaining)
    const errors: string[] = []

    const validFiles: UploadedFile[] = []
    for (const file of toAdd) {
      const err = validateFile(file)
      if (err) {
        errors.push(err)
        continue
      }
      // Avoid duplicates
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        continue
      }
      validFiles.push({
        file,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'pending',
        progress: 0,
      })
    }

    if (errors.length > 0) {
      setAnalyzeError(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }
  }, [files, validateFile])

  // ── Remove file ──
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setAnalyzeError(null)
  }, [])

  // ── Drag & drop handlers ──
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set false if leaving the drop zone (not entering a child)
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [addFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    addFiles(selected)
    e.target.value = ''
  }, [addFiles])

  // ── Analyze all files ──
  const analyzeFiles = useCallback(async () => {
    if (files.length === 0) return

    setIsAnalyzing(true)
    setAnalyzeError(null)

    const updatedFiles = [...files]

    for (let i = 0; i < updatedFiles.length; i++) {
      const f = updatedFiles[i]
      if (f.status === 'done') continue

      // Mark as uploading
      updatedFiles[i] = { ...f, status: 'uploading', progress: 30 }
      setFiles([...updatedFiles])

      try {
        const formData = new FormData()
        formData.append('file', f.file)

        const res = await fetch('/api/documents/analyze', {
          method: 'POST',
          body: formData,
        })

        updatedFiles[i] = { ...updatedFiles[i], progress: 80 }
        setFiles([...updatedFiles])

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
          updatedFiles[i] = {
            ...updatedFiles[i],
            status: 'error',
            progress: 0,
            error: errData.error || `Erreur ${res.status}`,
          }
          setFiles([...updatedFiles])
          continue
        }

        const analysis = await res.json()

        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'done',
          progress: 100,
          analysis,
        }
        setFiles([...updatedFiles])
      } catch {
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'error',
          progress: 0,
          error: 'Erreur reseau. Reessayez.',
        }
        setFiles([...updatedFiles])
      }
    }

    // Check if all files processed
    const allDone = updatedFiles.every(f => f.status === 'done' || f.status === 'error')
    const successFiles = updatedFiles.filter(f => f.status === 'done')

    if (allDone && successFiles.length > 0) {
      // Call extract endpoint for structured financial data
      try {
        const extractForm = new FormData()
        for (const sf of successFiles) {
          extractForm.append('files', sf.file)
        }
        if (evaluation?.siren) extractForm.append('siren', evaluation.siren)
        extractForm.append('evaluationId', evaluationId)

        const extractRes = await fetch('/api/documents/extract', {
          method: 'POST',
          body: extractForm,
        })

        if (extractRes.ok) {
          const extraction = await extractRes.json()
          sessionStorage.setItem(`evalup_extraction_${evaluationId}`, JSON.stringify(extraction))
          router.push(`/evaluation/${evaluationId}/review`)
        } else {
          // Extract failed — go to chat directly with individual analyses
          router.push(`/evaluation/${evaluationId}/chat`)
        }
      } catch {
        // Network error — go to chat directly
        router.push(`/evaluation/${evaluationId}/chat`)
      }
    } else if (allDone && successFiles.length === 0) {
      setAnalyzeError('Aucun fichier n\'a pu etre analyse. Verifiez les formats et reessayez.')
    }

    setIsAnalyzing(false)
  }, [files, evaluationId, evaluation, router])

  // ── Skip upload ──
  const skipUpload = useCallback(() => {
    router.push(`/evaluation/${evaluationId}/chat`)
  }, [evaluationId, router])

  // ── Compute which suggested docs are "matched" ──
  const matchedSuggestions = SUGGESTED_DOCS.map(doc => ({
    ...doc,
    matched: files.some(f => matchesSuggestedDoc(f.file.name, doc.keywords)),
  }))

  // ── Loading state ──
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

  // ── Auth error ──
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

  // ── Analyzing overlay ──
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <Card variant="elevated" padding="lg" className="max-w-md w-full text-center">
          <div className="w-12 h-12 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Extraction des donnees en cours...
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            Analyse de {files.filter(f => f.status !== 'done').length} fichier(s). Cela peut prendre quelques secondes.
          </p>
          <div className="mt-6 space-y-2">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-3 text-sm">
                <span>{getFileIcon(f.file)}</span>
                <span className="flex-1 text-left truncate text-[var(--text-primary)]">{f.file.name}</span>
                {f.status === 'uploading' && (
                  <div className="w-20 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                )}
                {f.status === 'done' && <span className="text-[var(--success)]">&#10003;</span>}
                {f.status === 'error' && <span className="text-[var(--danger)]">&#10007;</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {/* ── Header ── */}
      <header className="bg-[var(--bg-primary)] border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">
            Preparez votre evaluation
          </h1>
          {evaluation && (
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              {evaluation.entreprise_nom || `SIREN ${evaluation.siren}`}
              {evaluation.archetype && (
                <Badge variant="accent" size="sm" className="ml-2 align-middle">
                  {evaluation.archetype.replace(/_/g, ' ')}
                </Badge>
              )}
            </p>
          )}
          {/* Stepper */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)] text-white">
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              Documents
            </span>
            <span className="text-[var(--text-muted)]">&rarr;</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
              <span className="w-4 h-4 rounded-full bg-[var(--border)] flex items-center justify-center text-[10px]">2</span>
              Entretien IA
            </span>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Drop zone */}
        <Card
          variant="outlined"
          padding="none"
          className={`
            relative overflow-hidden transition-all duration-200
            ${isDragging ? 'border-[var(--accent)] bg-[var(--accent-light)] scale-[1.01]' : 'border-dashed'}
          `}
        >
          <div
            className="p-8 text-center"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept={ACCEPTED_EXTENSIONS}
              multiple
              className="hidden"
            />

            <div className="text-4xl mb-3">
              {isDragging ? '📥' : '📁'}
            </div>
            <p className="text-[var(--text-primary)] font-medium mb-1">
              {isDragging ? 'Deposez vos fichiers ici' : 'Glissez-deposez vos documents'}
            </p>
            <p className="text-[var(--text-tertiary)] text-sm mb-4">
              PDF, Excel (.xlsx, .xls), Images (scan) &mdash; {formatFileSize(MAX_FILE_SIZE)} max par fichier, {MAX_FILES} fichiers max
            </p>
            <Button
              variant="outline"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
            >
              Parcourir
            </Button>

            {files.length === 0 && (
              <p className="mt-6 text-sm text-[var(--accent)] font-medium">
                Uploadez vos 2-3 derniers bilans comptables pour une analyse plus precise et 2x plus rapide
              </p>
            )}
          </div>
        </Card>

        {/* Uploaded files preview */}
        {files.length > 0 && (
          <Card variant="default" padding="none">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Fichiers ({files.length}/{MAX_FILES})
              </span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {files.map(f => (
                <div key={f.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-lg flex-shrink-0">{getFileIcon(f.file)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {f.file.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {formatFileSize(f.file.size)}
                      {f.status === 'done' && (
                        <span className="text-[var(--success)] ml-2">Analyse terminee</span>
                      )}
                      {f.status === 'error' && (
                        <span className="text-[var(--danger)] ml-2">{f.error}</span>
                      )}
                    </p>
                    {f.status === 'uploading' && (
                      <div className="mt-1 w-full h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(f.id)}
                    disabled={f.status === 'uploading'}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-light)] rounded-[var(--radius-sm)] transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Suggested documents checklist */}
        <Card variant="ghost" padding="md">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Documents suggeres
          </p>
          <div className="space-y-2.5">
            {matchedSuggestions.map(doc => (
              <div key={doc.id} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-xs ${
                  doc.matched
                    ? 'bg-[var(--success)] text-white'
                    : 'border border-[var(--border)] text-transparent'
                }`}>
                  {doc.matched ? '✓' : '·'}
                </span>
                <span className={`text-sm flex-1 ${
                  doc.matched ? 'text-[var(--text-primary)] line-through opacity-60' : 'text-[var(--text-secondary)]'
                }`}>
                  {doc.label}
                </span>
                <Badge
                  variant={doc.tag === 'RECOMMANDE' ? 'accent' : 'neutral'}
                  size="sm"
                >
                  {doc.tag}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Error display */}
        {analyzeError && (
          <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--danger-light)] text-[var(--danger)] text-sm whitespace-pre-line">
            {analyzeError}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={analyzeFiles}
            disabled={files.length === 0 || isAnalyzing}
            isLoading={isAnalyzing}
            className="w-full sm:w-auto"
            rightIcon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            Analyser mes documents et continuer
          </Button>
          <button
            onClick={skipUpload}
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors underline underline-offset-2"
          >
            Passer cette etape &rarr;
          </button>
        </div>
      </main>
    </div>
  )
}
