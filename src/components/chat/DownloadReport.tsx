'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { ConversationContext, Message } from '@/lib/anthropic'
import { useAuth } from '@/contexts/AuthContext'
import { trackConversion } from '@/lib/analytics'

interface DownloadReportProps {
  context: ConversationContext
  messages: Message[]
  onOpenDataPanel?: () => void
  onResetEvaluation?: () => void
}

export function DownloadReport({ context, onOpenDataPanel, onResetEvaluation }: DownloadReportProps) {
  const { isPremium } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showShareOptions, setShowShareOptions] = useState(false)

  const generatePdf = useCallback(async (): Promise<Blob> => {
    // Envoyer le contexte brut au serveur — l'assemblage se fait côté API
    const response = await fetch('/api/evaluation/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'Erreur lors de la generation' }))
      throw new Error(errData.error || `Erreur ${response.status}`)
    }

    return response.blob()
  }, [context])

  const handleDownload = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const blob = await generatePdf()
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
      setError(err instanceof Error ? err.message : 'Erreur lors de la generation du rapport')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const blob = await generatePdf()
      const file = new File([blob], `evaluation-${context.entreprise.nom}.pdf`, {
        type: 'application/pdf',
      })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Evaluation de ${context.entreprise.nom}`,
          text: `Rapport d'evaluation genere par EvalUp`,
        })
      } else {
        setShowShareOptions(true)
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Erreur partage:', err)
        setError('Erreur lors du partage')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      const blob = await generatePdf()
      const url = URL.createObjectURL(blob)
      await navigator.clipboard.writeText(url)
      setShowShareOptions(false)
    } catch (err) {
      console.error('Erreur copie:', err)
    }
  }

  // Le PDF est accessible si l'utilisateur a payé l'évaluation OU est abonné Pro
  const canDownload = isPremium || context.isPaid
  if (!canDownload) {
    return (
      <div className="relative">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[var(--text-primary)] font-semibold">Evaluation terminee</h3>
              <p className="text-[var(--text-secondary)] text-sm">Le rapport PDF est reserve aux abonnes Pro</p>
            </div>
          </div>

          <Link
            href="/tarifs"
            className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-[var(--accent)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Passer a Pro pour telecharger le PDF
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="bg-[var(--accent-light)] border border-[var(--accent)]/30 rounded-[var(--radius-xl)] p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] font-semibold">Evaluation terminee</h3>
            <p className="text-[var(--text-secondary)] text-sm">Telechargez votre rapport professionnel (28 pages)</p>
          </div>
        </div>

        {error && (
          <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-[var(--radius-lg)] p-3 mb-3">
            <p className="text-[var(--danger)] text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-[var(--radius-lg)] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generation du rapport...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Telecharger le PDF
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-[var(--radius-lg)] font-medium hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[var(--border)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Partager
          </button>
        </div>

        {/* Actions de suite */}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-tertiary)] mb-3">Vous pouvez ameliorer votre rapport :</p>
          <div className="flex flex-col gap-2">
            {onOpenDataPanel && (
              <button
                onClick={onOpenDataPanel}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Completer les donnees ou ajouter des documents
              </button>
            )}
            {onResetEvaluation && (
              <button
                onClick={onResetEvaluation}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refaire l&apos;evaluation
              </button>
            )}
            <Link
              href="/diagnostic"
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Demarrer une nouvelle evaluation
            </Link>
          </div>
        </div>
      </div>

      {/* Options de partage (fallback) */}
      {showShareOptions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-lg)] z-10">
          <p className="text-[var(--text-secondary)] text-sm mb-3">Partager le rapport :</p>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm rounded-[var(--radius-md)] hover:bg-[var(--accent-light)] transition-colors"
            >
              Copier le lien
            </button>
            <button
              onClick={() => setShowShareOptions(false)}
              className="px-4 py-2 text-[var(--text-tertiary)] text-sm hover:text-[var(--text-primary)] transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
