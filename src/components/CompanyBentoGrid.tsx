'use client'

interface CompanyBentoGridProps {
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
    noteGlobale: string
    score: number
    pointsForts: string[]
    pointsVigilance: string[]
  }
  dataQuality?: {
    dataYear: number
    dataAge: number
    isDataOld: boolean
    confidence: 'faible' | 'moyenne' | 'haute'
  }
}

export function CompanyBentoGrid({
  entreprise,
  financier,
  valorisation,
  ratios,
  diagnostic,
  dataQuality,
}: CompanyBentoGridProps) {
  const formatMontant = (montant: number, compact = false) => {
    if (compact && Math.abs(montant) >= 1000000) {
      return `${(montant / 1000000).toFixed(1)}M€`
    }
    if (compact && Math.abs(montant) >= 1000) {
      return `${(montant / 1000).toFixed(0)}k€`
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(montant)
  }

  const formatPourcentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getConfidenceColor = (confidence: string) => {
    if (confidence === 'haute') return 'bg-green-500/20 text-green-400'
    if (confidence === 'moyenne') return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-red-500/20 text-red-400'
  }

  // Vérifier si on a des données financières
  const hasFinancialData = !!(financier || valorisation)

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header avec nom entreprise */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-1">{entreprise.nom}</h2>
        <p className="text-white/60">{entreprise.secteur}</p>
      </div>

      {/* Message si pas de données financières */}
      {!hasFinancialData && (
        <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-orange-200 font-medium">Aucune donnée financière disponible</p>
              <p className="text-orange-200/70 text-sm mt-1">
                Cette entreprise n&apos;a pas publié de bilans accessibles. Vous pourrez fournir vos documents financiers lors de l&apos;évaluation pour obtenir une valorisation précise.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Card 1: Infos générales - large */}
        <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#c9a227]/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-sm">SIREN</p>
              <p className="text-white font-mono">{entreprise.siren.replace(/(\d{3})(?=\d)/g, '$1 ')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/50">Code NAF</p>
              <p className="text-white">{entreprise.codeNaf}</p>
            </div>
            <div>
              <p className="text-white/50">Creation</p>
              <p className="text-white">{entreprise.dateCreation}</p>
            </div>
            <div>
              <p className="text-white/50">Effectif</p>
              <p className="text-white">{entreprise.effectif || 'N/A'}</p>
            </div>
            <div>
              <p className="text-white/50">Ville</p>
              <p className="text-white">{entreprise.ville}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Valorisation - affiché uniquement quand disponible */}
        {valorisation && (
          <div className="col-span-2 bg-gradient-to-br from-[#c9a227]/20 to-[#c9a227]/5 border border-[#c9a227]/30 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 text-sm font-medium">Estimation de valeur</p>
              {dataQuality && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(dataQuality.confidence)}`}>
                  Confiance {dataQuality.confidence}
                </span>
              )}
            </div>
            <div className="text-center mb-3">
              <p className="text-3xl font-bold text-[#c9a227]">
                {formatMontant(valorisation.valeurEntreprise.moyenne, true)}
              </p>
              <p className="text-white/50 text-sm">
                {formatMontant(valorisation.valeurEntreprise.basse, true)} - {formatMontant(valorisation.valeurEntreprise.haute, true)}
              </p>
            </div>
            <div className="flex justify-between text-xs text-white/50 pt-2 border-t border-white/10">
              <span>Methode: {valorisation.methodePrincipale}</span>
              <span>Multiple: {valorisation.multipleSectoriel.min}x - {valorisation.multipleSectoriel.max}x</span>
            </div>
          </div>
        )}

        {/* Card 3: Chiffre d'affaires */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/50 text-xs mb-1">CA {financier ? `(${financier.anneeDernierBilan})` : ''}</p>
          <p className="text-xl font-bold text-white">
            {financier ? formatMontant(financier.chiffreAffaires, true) : 'N/A'}
          </p>
          {ratios ? (
            <p className="text-white/40 text-xs mt-1">Marge nette: {formatPourcentage(ratios.margeNette)}</p>
          ) : (
            <p className="text-white/30 text-xs mt-1">-</p>
          )}
        </div>

        {/* Card 4: Resultat net */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/50 text-xs mb-1">Resultat net</p>
          <p className={`text-xl font-bold ${financier ? (financier.resultatNet >= 0 ? 'text-green-400' : 'text-red-400') : 'text-white/30'}`}>
            {financier ? formatMontant(financier.resultatNet, true) : 'N/A'}
          </p>
          {ratios ? (
            <p className="text-white/40 text-xs mt-1">ROE: {formatPourcentage(ratios.roe)}</p>
          ) : (
            <p className="text-white/30 text-xs mt-1">-</p>
          )}
        </div>

        {/* Card 5: EBITDA */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/50 text-xs mb-1">EBITDA</p>
          <p className={`text-xl font-bold ${financier ? (financier.ebitdaComptable >= 0 ? 'text-white' : 'text-red-400') : 'text-white/30'}`}>
            {financier ? formatMontant(financier.ebitdaComptable, true) : 'N/A'}
          </p>
          {ratios ? (
            <p className="text-white/40 text-xs mt-1">Marge: {formatPourcentage(ratios.margeEbitda)}</p>
          ) : (
            <p className="text-white/30 text-xs mt-1">-</p>
          )}
        </div>

        {/* Card 6: Tresorerie */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/50 text-xs mb-1">Tresorerie</p>
          <p className={`text-xl font-bold ${financier ? (financier.tresorerie >= 0 ? 'text-blue-400' : 'text-red-400') : 'text-white/30'}`}>
            {financier ? formatMontant(financier.tresorerie, true) : 'N/A'}
          </p>
          {valorisation ? (
            <p className="text-white/40 text-xs mt-1">Dette nette: {formatMontant(valorisation.detteNette, true)}</p>
          ) : (
            <p className="text-white/30 text-xs mt-1">-</p>
          )}
        </div>

        {/* Card 7: Diagnostic - wide */}
        {diagnostic && (
          <div className="col-span-2 md:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/70 text-sm font-medium">Diagnostic rapide</p>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getScoreColor(diagnostic.score)}`}>
                  {diagnostic.score}/100
                </span>
                <span className="text-white/50 text-sm">{diagnostic.noteGlobale}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Points forts */}
              <div>
                <p className="text-green-400/80 text-xs font-medium mb-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Points forts
                </p>
                <ul className="space-y-1">
                  {diagnostic.pointsForts.map((point, i) => (
                    <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Points de vigilance */}
              <div>
                <p className="text-orange-400/80 text-xs font-medium mb-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Points de vigilance
                </p>
                <ul className="space-y-1">
                  {diagnostic.pointsVigilance.map((point, i) => (
                    <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Data quality warning */}
        {dataQuality?.isDataOld && (
          <div className="col-span-2 md:col-span-4 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-orange-200/90 text-sm">
                <strong>Données de {dataQuality.dataYear}</strong> ({dataQuality.dataAge} ans).
                Fournissez vos bilans recents pour une valorisation fiable.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
