'use client'

// Composant pour afficher le rapport des données publiques Pappers
// Affiché au début de l'évaluation IA

import type { ConversationContext, BilanAnnuel } from '@/lib/anthropic'

interface PappersReportProps {
  context: ConversationContext
  onContinue: () => void
}

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '-'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(num)
}

function formatPercent(num: number | undefined | null): string {
  if (num === undefined || num === null) return '-'
  return `${num.toFixed(1)}%`
}

function getDataYear(bilans: BilanAnnuel[]): number | null {
  if (!bilans || bilans.length === 0) return null
  return bilans[0].annee
}

function getYearRange(bilans: BilanAnnuel[]): string {
  if (!bilans || bilans.length === 0) return ''
  const years = bilans.map(b => b.annee).sort((a, b) => b - a)
  if (years.length === 1) return `${years[0]}`
  return `${years[years.length - 1]}-${years[0]}`
}

export function PappersReport({ context, onContinue }: PappersReportProps) {
  const { entreprise, financials } = context
  const bilans = financials?.bilans || []
  const ratios = financials?.ratios
  const anomalies = financials?.anomaliesDetectees || []
  const dernierBilan = bilans[0]
  const dataYear = getDataYear(bilans)

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header avec badge données publiques */}
      <div className="bg-gradient-to-r from-[#1e3a5f]/30 to-[#2d5a8f]/30 px-4 sm:px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c9a227]/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{entreprise.nom}</h2>
              <p className="text-white/60 text-sm">SIREN {entreprise.siren}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#1e3a5f]/50 text-white/80 text-xs rounded-full border border-white/20">
              Données publiques
            </span>
            {dataYear && (
              <span className="px-3 py-1 bg-[#c9a227]/20 text-[#e8c547] text-xs rounded-full border border-[#c9a227]/30">
                {dataYear}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Informations générales */}
      <div className="px-4 sm:px-6 py-4 border-b border-white/10">
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">Informations générales</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-white/60 text-xs mb-1">Secteur</p>
            <p className="text-white font-medium text-sm">{entreprise.secteur}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">Création</p>
            <p className="text-white font-medium text-sm">{entreprise.dateCreation || '-'}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">Effectif</p>
            <p className="text-white font-medium text-sm">{entreprise.effectif || '-'}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">Localisation</p>
            <p className="text-white font-medium text-sm">{entreprise.ville || '-'}</p>
          </div>
        </div>
      </div>

      {/* Données financières */}
      {dernierBilan && (
        <div className="px-4 sm:px-6 py-4 border-b border-white/10">
          <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">
            Données financières {dataYear && `(${dataYear})`}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs mb-1">Chiffre d'affaires</p>
              <p className="text-white font-semibold text-lg">{formatNumber(dernierBilan.chiffre_affaires)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs mb-1">Résultat net</p>
              <p className={`font-semibold text-lg ${dernierBilan.resultat_net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatNumber(dernierBilan.resultat_net)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs mb-1">EBITDA</p>
              <p className={`font-semibold text-lg ${(ratios?.ebitda || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatNumber(ratios?.ebitda)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs mb-1">Trésorerie</p>
              <p className="text-white font-semibold text-lg">{formatNumber(dernierBilan.tresorerie)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs mb-1">Capitaux propres</p>
              <p className="text-white font-semibold text-lg">{formatNumber(dernierBilan.capitaux_propres)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs mb-1">Dettes financières</p>
              <p className="text-white font-semibold text-lg">{formatNumber(dernierBilan.dettes_financieres)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Ratios clés */}
      {ratios && (
        <div className="px-4 sm:px-6 py-4 border-b border-white/10">
          <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">Ratios clés</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-white/60 text-xs mb-1">Marge nette</p>
              <p className={`font-semibold ${ratios.margeNette >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(ratios.margeNette)}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">Marge EBITDA</p>
              <p className={`font-semibold ${ratios.margeEbitda >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(ratios.margeEbitda)}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">DSO (jours)</p>
              <p className="text-white font-semibold">{ratios.dso?.toFixed(0) || '-'} j</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">Ratio endettement</p>
              <p className="text-white font-semibold">{ratios.ratioEndettement?.toFixed(2) || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Évolution si plusieurs années */}
      {bilans.length > 1 && (
        <div className="px-4 sm:px-6 py-4 border-b border-white/10">
          <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">
            Évolution du CA ({getYearRange(bilans)})
          </h3>
          <div className="flex items-end gap-2 h-20">
            {bilans.slice().reverse().map((bilan, index) => {
              const maxCA = Math.max(...bilans.map(b => b.chiffre_affaires))
              const height = maxCA > 0 ? (bilan.chiffre_affaires / maxCA) * 100 : 0
              return (
                <div key={bilan.annee} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-[#c9a227]/60 rounded-t transition-all"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <span className="text-white/60 text-xs">{bilan.annee}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Anomalies détectées */}
      {anomalies.length > 0 && (
        <div className="px-4 sm:px-6 py-4 border-b border-white/10">
          <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">
            Points d'attention ({anomalies.length})
          </h3>
          <div className="space-y-2">
            {anomalies.slice(0, 3).map((anomalie, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-2 rounded-lg ${
                  anomalie.severity === 'high'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : anomalie.severity === 'medium'
                    ? 'bg-yellow-500/10 border border-yellow-500/20'
                    : 'bg-blue-500/10 border border-blue-500/20'
                }`}
              >
                <span className="text-lg">
                  {anomalie.severity === 'high' ? '🔴' : anomalie.severity === 'medium' ? '🟡' : '🔵'}
                </span>
                <div>
                  <p className="text-white/80 text-sm">{anomalie.message}</p>
                  <p className="text-white/40 text-xs mt-0.5">{anomalie.categorie}</p>
                </div>
              </div>
            ))}
            {anomalies.length > 3 && (
              <p className="text-white/40 text-xs text-center">
                +{anomalies.length - 3} autre{anomalies.length - 3 > 1 ? 's' : ''} point{anomalies.length - 3 > 1 ? 's' : ''} à analyser
              </p>
            )}
          </div>
        </div>
      )}

      {/* Message et CTA */}
      <div className="px-4 sm:px-6 py-5 bg-gradient-to-r from-[#c9a227]/10 to-[#e8c547]/10">
        <p className="text-white/80 text-sm mb-4">
          {dataYear ? (
            <>
              Ces données publiques datent de <strong className="text-[#e8c547]">{dataYear}</strong>.
              Pour une évaluation plus précise, tu peux partager des documents plus récents.
            </>
          ) : (
            <>
              Je n'ai pas trouvé de données financières publiques pour cette entreprise.
              Tu peux partager tes documents pour démarrer l'évaluation.
            </>
          )}
        </p>
        <button
          onClick={onContinue}
          className="w-full py-3 px-4 bg-[#c9a227] hover:bg-[#e8c547] text-[#1a1a2e] font-semibold rounded-xl transition-colors"
        >
          Continuer vers l'évaluation
        </button>
      </div>
    </div>
  )
}
