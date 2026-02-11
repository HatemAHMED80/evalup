'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { trackConversion } from '@/lib/analytics'

// ---------------------------------------------------------------------------
// Rotating messages
// ---------------------------------------------------------------------------

const MESSAGES = [
  'Analyse du secteur\u2026',
  'D\u00E9tection du profil\u2026',
  'Identification de la m\u00E9thode\u2026',
  'Benchmark sectoriel\u2026',
  'G\u00E9n\u00E9ration du diagnostic\u2026',
]

const MESSAGE_INTERVAL = 1800 // ms between each message rotation

export default function DiagnosticLoadingPage() {
  const router = useRouter()
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  // Rotate messages
  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length)
    }, MESSAGE_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  // Animate progress bar (visual only, runs independently of API)
  useEffect(() => {
    // Quick ramp to 70%, then slow down waiting for API
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev // stall at 90 until API returns
        if (prev < 60) return prev + 3
        return prev + 0.5
      })
    }, 100)
    return () => clearInterval(timer)
  }, [])

  // Call API
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const raw = sessionStorage.getItem('diagnostic_data')
    if (!raw) {
      setError('Donn\u00E9es manquantes. Veuillez recommencer le diagnostic.')
      return
    }

    let formData: Record<string, unknown>
    try {
      formData = JSON.parse(raw)
    } catch {
      setError('Donn\u00E9es corrompues. Veuillez recommencer.')
      return
    }

    const callApi = async () => {
      try {
        const res = await fetch('/api/diagnostic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Erreur lors du diagnostic')
        }

        const result = await res.json()

        // Store result for the signup/result page
        sessionStorage.setItem('diagnostic_result', JSON.stringify(result))
        trackConversion('archetype_detected', {
          archetype_id: result.archetypeId,
          archetype_name: result.archetype?.name || '',
        })

        // Complete progress bar then redirect
        setProgress(100)
        await new Promise((r) => setTimeout(r, 600))
        router.push(`/diagnostic/signup?archetype=${result.archetypeId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inattendue')
      }
    }

    // Add minimum delay so the loading animation is visible
    const minDelay = new Promise((r) => setTimeout(r, 3000))
    Promise.all([callApi(), minDelay])
  }, [router])

  // ── Error state ──────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 mx-auto bg-[var(--danger-light)] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
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

  // ── Loading state ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-10">
        {/* Spinner */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--border)]" />
          <div className="absolute inset-0 rounded-full border-4 border-[var(--accent)] border-t-transparent animate-spin" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-[24px] font-bold text-[var(--text-primary)]">
            D\u00E9tection de votre profil
          </h1>
          <p
            key={messageIndex}
            className="text-[var(--accent)] font-medium animate-fade-up"
          >
            {MESSAGES[messageIndex]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-[12px] text-[var(--text-muted)]">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Step indicators */}
        <div className="space-y-2">
          {MESSAGES.map((msg, i) => (
            <div
              key={msg}
              className={`
                flex items-center gap-3 text-[14px] transition-all duration-300
                ${i < messageIndex ? 'text-[var(--success)]' : i === messageIndex ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}
              `}
            >
              {i < messageIndex ? (
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : i === messageIndex ? (
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
                </div>
              ) : (
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-[var(--border)] rounded-full" />
                </div>
              )}
              <span>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
