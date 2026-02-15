'use client'

import { useState, useCallback } from 'react'
import type { ConversationContext } from '@/lib/anthropic'
import { useAuth } from '@/contexts/AuthContext'
import { trackConversion } from '@/lib/analytics'

interface GenerateButtonProps {
  context: ConversationContext
  completeness: number
}

export function GenerateButton({ context, completeness }: GenerateButtonProps) {
  const { isPremium } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDownload = isPremium || context.isPaid
  const isDisabled = completeness < 40 || !canDownload
  const isPartial = completeness >= 40 && completeness < 70

  const handleGenerate = useCallback(async () => {
    if (isDisabled || isGenerating) return
    setIsGenerating(true)
    setError(null)
    try {
      const response = await fetch('/api/evaluation/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Erreur generation' }))
        throw new Error(errData.error || `Erreur ${response.status}`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `evaluation-${context.entreprise.nom.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      trackConversion('pdf_download', { siren: context.entreprise.siren })
    } catch (err) {
      console.error('Erreur generation PDF:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la generation')
    } finally {
      setIsGenerating(false)
    }
  }, [context, isDisabled, isGenerating])

  const label = isGenerating
    ? 'Generation...'
    : completeness < 40
      ? `${completeness}% \u2014 completez les donnees`
      : isPartial
        ? `Estimation disponible \u2014 ${completeness}%`
        : "Generer l'evaluation"

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: 'none',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.2,
    transition: 'all 0.3s',
    cursor: isDisabled ? 'default' : 'pointer',
    ...(completeness < 40
      ? { background: 'rgba(255,255,255,0.015)', color: '#2a2e44' }
      : isPartial
        ? { background: 'rgba(68,102,238,0.08)', color: '#5577cc' }
        : {
            background: 'linear-gradient(135deg, #3355cc, #4466ee)',
            color: '#fff',
            boxShadow: '0 4px 24px rgba(51,85,204,0.25), 0 0 0 1px rgba(68,102,238,0.3)',
          }),
  }

  return (
    <div style={{ flexShrink: 0, padding: '10px 12px', borderTop: '1px solid var(--dp-line)' }}>
      {error && (
        <p style={{ fontSize: 11, color: 'var(--dp-red)', marginBottom: 6 }}>{error}</p>
      )}
      <button
        onClick={handleGenerate}
        disabled={isDisabled || isGenerating}
        style={buttonStyle}
      >
        {isGenerating && (
          <svg style={{ width: 14, height: 14, display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} className="animate-spin" fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {label}
      </button>
    </div>
  )
}
