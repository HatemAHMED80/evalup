'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { ConversationContext, Message } from '@/lib/anthropic'
import type { FacteursAjustement } from '@/lib/evaluation/types'
import { useAuth } from '@/contexts/AuthContext'
import { trackConversion } from '@/lib/analytics'

interface DownloadReportProps {
  context: ConversationContext
  messages: Message[]
  evaluation?: {
    valeurBasse: number
    valeurHaute: number
    methode: string
    multiple: number
  }
  facteursActifs?: FacteursAjustement
}

export function DownloadReport({ context }: DownloadReportProps) {
  const { isPremium } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showShareOptions, setShowShareOptions] = useState(false)

  const generatePdf = useCallback(async (): Promise<Blob> => {
    // Dynamic import pour ne charger les modules lourds qu'au clic
    const { assembleReportData } = await import('@/lib/pdf/assemble-report-data')
    const reportData = assembleReportData(context)

    // Appeler l'API serveur pour générer le PDF professionnel (32 pages)
    const response = await fetch('/api/evaluation/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
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

  // Affichage pour utilisateurs non-Pro
  if (!isPremium) {
    return (
      <div className="relative">
        <div className="bg-gradient-to-r from-white/5 to-white/10 border border-white/20 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Evaluation terminee</h3>
              <p className="text-white/60 text-sm">Le rapport PDF est reserve aux abonnes Pro</p>
            </div>
          </div>

          <Link
            href="/tarifs"
            className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-[#c9a227] text-[#1a1a2e] rounded-xl font-medium hover:bg-[#e8c547] transition-colors"
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
      <div className="bg-gradient-to-r from-[#c9a227]/10 to-[#e8c547]/10 border border-[#c9a227]/30 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#c9a227] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#1a1a2e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Evaluation terminee</h3>
            <p className="text-white/60 text-sm">Telechargez votre rapport professionnel (32 pages)</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a227] text-[#1a1a2e] rounded-xl font-medium hover:bg-[#e8c547] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Partager
          </button>
        </div>
      </div>

      {/* Options de partage (fallback) */}
      {showShareOptions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#2a2a4e] border border-white/10 rounded-xl p-4 shadow-xl z-10">
          <p className="text-white/70 text-sm mb-3">Partager le rapport :</p>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors"
            >
              Copier le lien
            </button>
            <button
              onClick={() => setShowShareOptions(false)}
              className="px-4 py-2 text-white/50 text-sm hover:text-white transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
