'use client'

import { useState, useEffect } from 'react'

interface QuickValuationData {
  entreprise: {
    siren: string
    nom: string
    secteur: string
    codeNaf: string
    dateCreation: string
    effectif: string
    adresse: string
    ville: string
  }
  hasValuation: boolean
  message?: string
  financier?: {
    chiffreAffaires: number
    resultatNet: number
    ebitdaComptable: number
    tresorerie: number
    dettes: number
    capitauxPropres: number
    anneeDernierBilan: number
  }
  valorisation?: {
    valeurEntreprise: { basse: number; moyenne: number; haute: number }
    prixCession: { basse: number; moyenne: number; haute: number }
    detteNette: number
    multipleSectoriel: { min: number; max: number }
    methodePrincipale: string
  }
  ratios?: {
    margeEbitda: number
    margeNette: number
    ratioEndettement: number
    roe: number
  }
  diagnostic?: {
    noteGlobale: 'A' | 'B' | 'C' | 'D' | 'E'
    score: number
    pointsForts: string[]
    pointsVigilance: string[]
  }
  avertissement?: string
}

interface InstantValuationProps {
  data: QuickValuationData
  onContinue: () => void
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace('.', ',')} M€`
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} k€`
  }
  return `${Math.round(value).toLocaleString('fr-FR')} €`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1).replace('.', ',')}%`
}

function getNoteColor(note: string): string {
  switch (note) {
    case 'A': return 'bg-emerald-500'
    case 'B': return 'bg-green-500'
    case 'C': return 'bg-yellow-500'
    case 'D': return 'bg-orange-500'
    case 'E': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

export function InstantValuation({ data, onContinue }: InstantValuationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Afficher les détails après l'animation principale
    if (isVisible) {
      const timer = setTimeout(() => setShowDetails(true), 600)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!data.hasValuation) {
    return (
      <div className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{data.entreprise.nom}</h3>
          <p className="text-white/60 mb-4">{data.message || 'Pas de données financières disponibles'}</p>
          <button
            onClick={onContinue}
            className="px-6 py-3 bg-[#c9a227] text-[#1a1a2e] font-semibold rounded-xl hover:bg-[#e8c547] transition-colors"
          >
            Saisir les données manuellement
          </button>
        </div>
      </div>
    )
  }

  const { entreprise, financier, valorisation, ratios, diagnostic } = data

  return (
    <div className={`space-y-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Header avec nom entreprise et note */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{entreprise.nom}</h2>
          <p className="text-white/60 text-sm">{entreprise.secteur} - {entreprise.ville}</p>
        </div>
        {diagnostic && (
          <div className={`w-14 h-14 ${getNoteColor(diagnostic.noteGlobale)} rounded-full flex items-center justify-center shadow-lg transform transition-all duration-500 ${isVisible ? 'scale-100' : 'scale-0'}`}>
            <span className="text-2xl font-bold text-white">{diagnostic.noteGlobale}</span>
          </div>
        )}
      </div>

      {/* Carte principale - Valorisation avec effet wow */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#c9a227]/20 via-[#c9a227]/10 to-transparent border border-[#c9a227]/30 rounded-2xl p-6">
        {/* Effet de brillance */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] animate-shimmer" />

        <div className="relative">
          <p className="text-[#c9a227] text-sm font-medium mb-1">Estimation du prix de cession</p>

          {/* Prix principal avec animation */}
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <p className="text-4xl sm:text-5xl font-bold text-white mb-2">
              {formatCurrency(valorisation!.prixCession.moyenne)}
            </p>
            <p className="text-white/60 text-sm">
              Fourchette : {formatCurrency(valorisation!.prixCession.basse)} - {formatCurrency(valorisation!.prixCession.haute)}
            </p>
          </div>

          {/* Bridge VE → Prix */}
          <div className={`mt-4 pt-4 border-t border-white/10 transition-all duration-500 delay-500 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Valeur d'entreprise (VE)</span>
              <span className="text-white font-medium">{formatCurrency(valorisation!.valeurEntreprise.moyenne)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-white/60">
                {valorisation!.detteNette >= 0 ? '- Dette nette' : '+ Trésorerie nette'}
              </span>
              <span className={valorisation!.detteNette >= 0 ? 'text-red-400' : 'text-emerald-400'}>
                {valorisation!.detteNette >= 0 ? '-' : '+'}{formatCurrency(Math.abs(valorisation!.detteNette))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grille de ratios */}
      <div className={`grid grid-cols-2 gap-3 transition-all duration-500 delay-700 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* CA */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/50 text-xs mb-1">Chiffre d'affaires {financier?.anneeDernierBilan}</p>
          <p className="text-white font-semibold text-lg">{formatCurrency(financier!.chiffreAffaires)}</p>
        </div>

        {/* EBITDA */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/50 text-xs mb-1">EBITDA</p>
          <p className="text-white font-semibold text-lg">{formatCurrency(financier!.ebitdaComptable)}</p>
        </div>

        {/* Marge EBITDA */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/50 text-xs mb-1">Marge EBITDA</p>
          <p className={`font-semibold text-lg ${ratios!.margeEbitda >= 0.08 ? 'text-emerald-400' : ratios!.margeEbitda >= 0.05 ? 'text-yellow-400' : 'text-red-400'}`}>
            {formatPercent(ratios!.margeEbitda)}
          </p>
        </div>

        {/* ROE */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/50 text-xs mb-1">Rentabilité (ROE)</p>
          <p className={`font-semibold text-lg ${ratios!.roe >= 0.15 ? 'text-emerald-400' : ratios!.roe >= 0.08 ? 'text-yellow-400' : 'text-red-400'}`}>
            {formatPercent(ratios!.roe)}
          </p>
        </div>
      </div>

      {/* Points forts / vigilance */}
      {diagnostic && (diagnostic.pointsForts.length > 0 || diagnostic.pointsVigilance.length > 0) && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all duration-500 delay-900 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {diagnostic.pointsForts.length > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-emerald-400 text-xs font-medium mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Points forts
              </p>
              <ul className="space-y-1">
                {diagnostic.pointsForts.slice(0, 2).map((point, i) => (
                  <li key={i} className="text-white/80 text-sm truncate">{point}</li>
                ))}
              </ul>
            </div>
          )}
          {diagnostic.pointsVigilance.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <p className="text-orange-400 text-xs font-medium mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Points de vigilance
              </p>
              <ul className="space-y-1">
                {diagnostic.pointsVigilance.slice(0, 2).map((point, i) => (
                  <li key={i} className="text-white/80 text-sm truncate">{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Avertissement */}
      <div className={`bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 transition-all duration-500 delay-1000 ${showDetails ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-blue-400 text-xs flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Cette estimation est basee sur les donnees publiques. Pour une valorisation precise,
            continuez l'evaluation pour affiner avec vos donnees reelles.
          </span>
        </p>
      </div>

      {/* Bouton Continuer */}
      <button
        onClick={onContinue}
        className={`w-full py-4 bg-[#c9a227] text-[#1a1a2e] font-semibold rounded-xl hover:bg-[#e8c547] transition-all duration-300 flex items-center justify-center gap-2 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <span>Affiner l'evaluation</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  )
}
