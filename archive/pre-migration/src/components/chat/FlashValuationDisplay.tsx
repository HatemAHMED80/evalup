'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface FlashValuationData {
  entreprise: string
  activite: string
  ca: number
  resultat: number
  anciennete: number
  valuationLow: number
  valuationHigh: number
  pointsForts: string[]
  secteur?: string
}

interface FlashValuationDisplayProps {
  data: FlashValuationData
  onUpgrade?: () => void
  siren?: string
}

export function FlashValuationDisplay({ data, onUpgrade, siren }: FlashValuationDisplayProps) {
  const router = useRouter()

  // Générer une clé unique pour cette évaluation
  const evaluationKey = `flash_shown_${siren || 'unknown'}_${data.valuationLow}_${data.valuationHigh}`

  // Vérifier si le loader a déjà été affiché pour cette évaluation
  const [hasSeenLoader, setHasSeenLoader] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(evaluationKey) === 'true'
  })

  const [isLoading, setIsLoading] = useState(!hasSeenLoader)
  const [showContent, setShowContent] = useState(hasSeenLoader)

  useEffect(() => {
    // Si déjà vu, pas de loader
    if (hasSeenLoader) return

    // Afficher le loader pendant 10 secondes pour créer du suspense
    const timer = setTimeout(() => {
      setIsLoading(false)
      // Marquer comme vu dans localStorage
      localStorage.setItem(evaluationKey, 'true')
      setHasSeenLoader(true)
      // Petit délai avant d'afficher le contenu pour l'animation
      setTimeout(() => setShowContent(true), 300)
    }, 10000)

    return () => clearTimeout(timer)
  }, [hasSeenLoader, evaluationKey])

  const midValue = (data.valuationLow + data.valuationHigh) / 2
  const formatValue = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M€`
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K€`
    return `${v.toFixed(0)}€`
  }

  // Ce qui manque pour une évaluation sérieuse
  const missingElements = [
    { label: 'Analyse des documents comptables (bilans, comptes de résultat)', icon: '📊' },
    { label: 'Retraitements du résultat (salaire dirigeant, charges exceptionnelles)', icon: '🔧' },
    { label: 'Analyse de la récurrence des revenus', icon: '🔄' },
    { label: 'Évaluation des actifs incorporels (clientèle, marque, savoir-faire)', icon: '💎' },
    { label: 'Décotes applicables (minoritaire, illiquidité, dépendance)', icon: '📉' },
    { label: 'Analyse des risques spécifiques', icon: '⚠️' },
    { label: 'Comparaison avec les transactions du secteur', icon: '📈' },
    { label: 'Rapport PDF professionnel de 30 pages', icon: '📄' },
  ]

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] border border-[#c9a227]/30 rounded-2xl p-8 my-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#c9a227]/20 rounded-full" />
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#c9a227] border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              Votre évaluation Flash est prête !
            </h3>
            <p className="text-white/60">
              Laissez-moi quelques secondes pour calculer votre fourchette de valorisation...
            </p>
          </div>
          <div className="flex space-x-1 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-[#c9a227] rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] border border-[#c9a227]/30 rounded-2xl overflow-hidden my-4 transition-all duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header */}
      <div className="bg-[#c9a227]/10 px-6 py-4 border-b border-[#c9a227]/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[#c9a227] text-sm font-medium">ÉVALUATION FLASH</span>
            <h2 className="text-xl font-bold text-white mt-1">{data.entreprise}</h2>
          </div>
          <div className="text-right text-white/60 text-sm">
            <div>{data.activite}</div>
            <div>{data.anciennete} ans d&apos;ancienneté</div>
          </div>
        </div>
      </div>

      {/* Données clés */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-white/10">
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-white/60 text-sm">Chiffre d&apos;affaires</div>
          <div className="text-2xl font-bold text-white">{formatValue(data.ca)}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-white/60 text-sm">Résultat net</div>
          <div className="text-2xl font-bold text-white">{formatValue(data.resultat)}</div>
        </div>
      </div>

      {/* Frise de valorisation */}
      <div className="px-6 py-6">
        <h3 className="text-white font-semibold mb-4">Fourchette de valorisation indicative</h3>

        {/* La frise */}
        <div className="relative h-16 rounded-xl overflow-hidden mb-4">
          {/* Gradient background */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-gradient-to-r from-green-600 to-green-500" />
            <div className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500" />
            <div className="flex-1 bg-gradient-to-r from-orange-500 to-red-500" />
          </div>

          {/* Markers */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <div className="text-white font-bold text-lg drop-shadow-lg">
              {formatValue(data.valuationLow)}
            </div>
            <div className="text-white font-bold text-xl drop-shadow-lg bg-black/30 px-4 py-2 rounded-lg">
              {formatValue(midValue)}
            </div>
            <div className="text-white font-bold text-lg drop-shadow-lg">
              {formatValue(data.valuationHigh)}
            </div>
          </div>

          {/* Labels */}
          <div className="absolute bottom-1 inset-x-0 flex justify-between px-4 text-xs text-white/80">
            <span>Basse</span>
            <span>Moyenne</span>
            <span>Haute</span>
          </div>
        </div>

        {/* Valorisation centrale */}
        <div className="text-center py-4 bg-[#c9a227]/10 rounded-xl border border-[#c9a227]/30">
          <div className="text-[#c9a227] text-sm font-medium mb-1">VALORISATION INDICATIVE</div>
          <div className="text-3xl font-bold text-white">
            {formatValue(data.valuationLow)} - {formatValue(data.valuationHigh)}
          </div>
        </div>
      </div>

      {/* Points forts */}
      {data.pointsForts && data.pointsForts.length > 0 && (
        <div className="px-6 py-4 border-t border-white/10">
          <h3 className="text-white font-semibold mb-3">Points forts identifiés</h3>
          <div className="space-y-2">
            {data.pointsForts.map((point, i) => (
              <div key={i} className="flex items-center gap-2 text-green-400">
                <span>✓</span>
                <span className="text-white/80">{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ce qui manque */}
      <div className="px-6 py-4 border-t border-white/10 bg-red-500/5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="text-red-400">⚠️</span>
          Ce qui manque pour une évaluation sérieuse
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {missingElements.map((element, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-red-400 mt-0.5">✗</span>
              <span className="text-white/70">{element.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Avertissement */}
      <div className="px-6 py-4 border-t border-white/10 bg-orange-500/10">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="text-orange-400 font-semibold">Cette évaluation Flash est indicative</h4>
            <p className="text-white/60 text-sm mt-1">
              Sans analyse approfondie de vos documents et des spécificités de votre entreprise,
              cette fourchette peut varier significativement. Une évaluation complète est recommandée
              pour toute décision importante.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-6 border-t border-[#c9a227]/30 bg-gradient-to-r from-[#c9a227]/10 to-transparent">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-white font-semibold">Prêt pour une évaluation précise ?</h4>
            <p className="text-white/60 text-sm">
              Obtenez une valorisation fiable avec rapport PDF professionnel
            </p>
          </div>
          <button
            onClick={() => {
              if (siren) {
                // Redirection directe vers checkout
                router.push(`/checkout?siren=${siren}&plan=eval_complete`)
              } else if (onUpgrade) {
                // Fallback si pas de siren
                onUpgrade()
              }
            }}
            className="px-6 py-3 bg-[#c9a227] hover:bg-[#e8c547] text-[#1a1a2e] font-bold rounded-xl transition-all transform hover:scale-105 flex items-center gap-2 whitespace-nowrap"
          >
            <span>Évaluation Complète</span>
            <span className="bg-[#1a1a2e]/20 px-2 py-0.5 rounded text-sm">79€</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Parser pour extraire les données de valorisation du texte de l'IA
export function parseFlashValuation(content: string): FlashValuationData | null {
  try {
    // Fonction pour parser un montant (supporte K€, M€, espaces)
    const parseAmount = (str: string): number => {
      if (!str) return 0
      const cleaned = str.replace(/\s/g, '').replace(/€/g, '').replace(/,/g, '.')

      // Gérer les millions (M)
      if (cleaned.toLowerCase().includes('m')) {
        const num = parseFloat(cleaned.replace(/[mM]/g, ''))
        return Math.round(num * 1000000)
      }

      // Gérer les milliers (K)
      if (cleaned.toLowerCase().includes('k')) {
        const num = parseFloat(cleaned.replace(/[kK]/g, ''))
        return Math.round(num * 1000)
      }

      return parseInt(cleaned, 10) || 0
    }

    // Chercher les montants de valorisation (plusieurs formats possibles)
    // Format 1: XXX € - XXX € ou XXX€ - XXX€
    // Format 2: XXX K€ - XXX K€
    // Format 3: X,X M€ - X,X M€
    const valuationPatterns = [
      // Valorisation indicative : XXX € - XXX €
      /valorisation\s*(?:indicative)?\s*:?\s*\**\s*([\d\s,\.]+)\s*([KkMm])?€?\s*[-–à]\s*([\d\s,\.]+)\s*([KkMm])?€/i,
      // Format avec €
      /([\d\s,\.]+)\s*([KkMm])?€\s*[-–à]\s*([\d\s,\.]+)\s*([KkMm])?€/,
      // Format simple avec tiret
      /([\d\s]+(?:\s?\d{3})*)\s*[-–à]\s*([\d\s]+(?:\s?\d{3})*)\s*€/,
    ]

    let valuationLow = 0
    let valuationHigh = 0

    for (const pattern of valuationPatterns) {
      const match = content.match(pattern)
      if (match) {
        if (match.length >= 5) {
          // Format avec multiplicateur (K/M)
          valuationLow = parseAmount(match[1] + (match[2] || ''))
          valuationHigh = parseAmount(match[3] + (match[4] || ''))
        } else if (match.length >= 3) {
          valuationLow = parseAmount(match[1])
          valuationHigh = parseAmount(match[2])
        }
        if (valuationLow > 0 && valuationHigh > 0) break
      }
    }

    // Si pas de valorisation trouvée, retourner null
    if (valuationLow === 0 || valuationHigh === 0) return null

    // Extraire le CA (plusieurs formats)
    const caPatterns = [
      /CA\s*:?\s*([\d\s,\.]+)\s*([KkMm])?€/i,
      /chiffre\s*d['']affaires?\s*:?\s*([\d\s,\.]+)\s*([KkMm])?€/i,
    ]
    let ca = 0
    for (const pattern of caPatterns) {
      const match = content.match(pattern)
      if (match) {
        ca = parseAmount(match[1] + (match[2] || ''))
        if (ca > 0) break
      }
    }

    // Extraire le résultat
    const resultatPatterns = [
      /[Rr]ésultat\s*(?:net)?\s*:?\s*(-?[\d\s,\.]+)\s*([KkMm])?€/i,
      /bénéfice\s*:?\s*(-?[\d\s,\.]+)\s*([KkMm])?€/i,
    ]
    let resultat = 0
    for (const pattern of resultatPatterns) {
      const match = content.match(pattern)
      if (match) {
        resultat = parseAmount(match[1] + (match[2] || ''))
        if (resultat !== 0) break
      }
    }

    // Extraire l'ancienneté
    const anciennetePatterns = [
      /(\d+)\s*ans?\s*(?:d[''])?(?:ancienneté|antériorité|existence)/i,
      /créé(?:e)?\s*(?:depuis|il y a|en)\s*(\d+)\s*ans?/i,
      /depuis\s*(\d+)\s*ans?/i,
    ]
    let anciennete = 0
    for (const pattern of anciennetePatterns) {
      const match = content.match(pattern)
      if (match) {
        anciennete = parseInt(match[1], 10)
        if (anciennete > 0) break
      }
    }

    // Extraire les points forts (lignes avec ✓ ou ✅ ou - suivi de texte positif)
    const pointsForts: string[] = []
    const pointsMatch = content.match(/[✓✅]\s*([^\n]+)/g)
    if (pointsMatch) {
      pointsMatch.forEach(p => {
        const cleaned = p.replace(/[✓✅]\s*/, '').trim()
        if (cleaned && !cleaned.includes('manque')) pointsForts.push(cleaned)
      })
    }

    // Si pas de points forts trouvés avec ✓, chercher dans les listes à puces
    if (pointsForts.length === 0) {
      const bulletPoints = content.match(/[-•]\s*(.*(?:rentabilité|récurrent|fidèle|stable|croissance|ancienneté|expérience|clientèle|réputation|emplacement)[^\n]*)/gi)
      if (bulletPoints) {
        bulletPoints.forEach(p => {
          const cleaned = p.replace(/^[-•]\s*/, '').trim()
          if (cleaned) pointsForts.push(cleaned)
        })
      }
    }

    // Extraire le secteur si mentionné
    const secteurMatch = content.match(/secteur\s*:?\s*([^\n,]+)/i)
    const secteur = secteurMatch ? secteurMatch[1].trim() : undefined

    return {
      entreprise: 'Votre entreprise',
      activite: 'Activité',
      ca,
      resultat,
      anciennete,
      valuationLow,
      valuationHigh,
      pointsForts: pointsForts.slice(0, 5),
      secteur,
    }
  } catch {
    return null
  }
}
