'use client'

// Graphique de visualisation de la valorisation

import { formaterEuros } from '@/lib/evaluation'

interface ValuationChartProps {
  basse: number
  moyenne: number
  haute: number
}

export default function ValuationChart({ basse, moyenne, haute }: ValuationChartProps) {
  // Calcul des pourcentages pour l'affichage
  const total = haute
  const bassePercent = (basse / total) * 100
  const moyennePercent = (moyenne / total) * 100

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Fourchette de valorisation
      </h3>

      {/* Barre de progression avec les 3 valeurs */}
      <div className="relative">
        {/* Barre de fond */}
        <div className="h-8 bg-gray-100 rounded-full overflow-hidden relative">
          {/* Zone basse */}
          <div
            className="absolute h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-l-full"
            style={{ width: `${bassePercent}%` }}
          />
          {/* Zone moyenne */}
          <div
            className="absolute h-full bg-gradient-to-r from-[#10b981] to-emerald-500"
            style={{ left: `${bassePercent}%`, width: `${moyennePercent - bassePercent}%` }}
          />
          {/* Zone haute */}
          <div
            className="absolute h-full bg-gradient-to-r from-[#1e3a5f] to-blue-600 rounded-r-full"
            style={{ left: `${moyennePercent}%`, width: `${100 - moyennePercent}%` }}
          />
        </div>

        {/* Marqueurs */}
        <div className="flex justify-between mt-4">
          <div className="text-center">
            <div className="w-3 h-3 bg-amber-500 rounded-full mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">Estimation basse</p>
            <p className="text-sm font-bold text-amber-600">{formaterEuros(basse)}</p>
          </div>

          <div className="text-center">
            <div className="w-3 h-3 bg-[#10b981] rounded-full mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">Estimation moyenne</p>
            <p className="text-sm font-bold text-[#10b981]">{formaterEuros(moyenne)}</p>
          </div>

          <div className="text-center">
            <div className="w-3 h-3 bg-[#1e3a5f] rounded-full mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">Estimation haute</p>
            <p className="text-sm font-bold text-[#1e3a5f]">{formaterEuros(haute)}</p>
          </div>
        </div>
      </div>

      {/* Explication */}
      <p className="text-sm text-gray-500 mt-6 text-center">
        La valorisation dépend de nombreux facteurs. Cette estimation se base sur les multiples
        du secteur et les caractéristiques de votre entreprise.
      </p>
    </div>
  )
}
