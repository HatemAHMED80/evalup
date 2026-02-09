'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FlashValuationDisplay } from '../chat/FlashValuationDisplay'

// Données de test pour différents scénarios
const MOCK_DATA = {
  boulangerie: {
    entreprise: 'Boulangerie du Marché',
    activite: 'Boulangerie-Pâtisserie',
    ca: 450000,
    resultat: 65000,
    anciennete: 12,
    valuationLow: 180000,
    valuationHigh: 280000,
    pointsForts: [
      'Emplacement premium en centre-ville',
      'Clientèle fidèle et récurrente',
      'Équipe stable et formée',
      'Rentabilité supérieure au secteur',
    ],
    secteur: 'Restauration',
  },
  saas: {
    entreprise: 'CloudTech Solutions',
    activite: 'Éditeur SaaS B2B',
    ca: 1200000,
    resultat: 180000,
    anciennete: 5,
    valuationLow: 2400000,
    valuationHigh: 4800000,
    pointsForts: [
      'MRR récurrent avec faible churn',
      'Croissance +40% annuelle',
      'Technologie propriétaire',
      'Base clients diversifiée',
    ],
    secteur: 'SaaS / Tech',
  },
  restaurant: {
    entreprise: 'Le Petit Bistrot',
    activite: 'Restaurant traditionnel',
    ca: 320000,
    resultat: 25000,
    anciennete: 8,
    valuationLow: 80000,
    valuationHigh: 150000,
    pointsForts: [
      'Terrasse attractive',
      'Licence IV incluse',
      'Avis Google 4.5/5',
    ],
    secteur: 'Restauration',
  },
  commerce: {
    entreprise: 'Mode & Style',
    activite: 'Commerce de détail textile',
    ca: 580000,
    resultat: 42000,
    anciennete: 15,
    valuationLow: 120000,
    valuationHigh: 200000,
    pointsForts: [
      'Bail commercial longue durée',
      'Stock bien géré',
      'Clientèle locale fidèle',
    ],
    secteur: 'Commerce',
  },
  transport: {
    entreprise: 'Express Livraison',
    activite: 'Transport routier de marchandises',
    ca: 890000,
    resultat: 95000,
    anciennete: 20,
    valuationLow: 350000,
    valuationHigh: 550000,
    pointsForts: [
      'Flotte récente et entretenue',
      'Contrats clients long terme',
      'Licences de transport valorisables',
      'Équipe de chauffeurs expérimentée',
    ],
    secteur: 'Transport',
  },
}

type MockScenario = keyof typeof MOCK_DATA

export function FlowTester() {
  const [isOpen, setIsOpen] = useState(false)
  const [showFlashValuation, setShowFlashValuation] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<MockScenario>('boulangerie')
  const [showLoader, setShowLoader] = useState(false)

  const scenarios: { key: MockScenario; label: string; icon: string }[] = [
    { key: 'boulangerie', label: 'Boulangerie', icon: '🥖' },
    { key: 'saas', label: 'SaaS', icon: '💻' },
    { key: 'restaurant', label: 'Restaurant', icon: '🍽️' },
    { key: 'commerce', label: 'Commerce', icon: '🛍️' },
    { key: 'transport', label: 'Transport', icon: '🚚' },
  ]

  const handleTestFlashValuation = (scenario: MockScenario, withLoader: boolean) => {
    setSelectedScenario(scenario)
    setShowLoader(withLoader)
    setShowFlashValuation(true)
    setIsOpen(false)
  }

  return (
    <>
      {/* Bouton flottant pour ouvrir le panneau de test */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all"
        title="Ouvrir le testeur de flow"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Panneau de test */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 bg-[#1a1a2e] border border-purple-500/50 rounded-2xl shadow-2xl p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <span className="text-purple-400">🧪</span> Flow Tester
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Section: Flash Valuation Display */}
          <div className="mb-4">
            <h4 className="text-white/70 text-sm font-medium mb-2">Flash Valuation (avec loader 10s)</h4>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleTestFlashValuation(s.key, true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg text-white text-sm transition-all"
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Flash Valuation sans loader */}
          <div className="mb-4">
            <h4 className="text-white/70 text-sm font-medium mb-2">Flash Valuation (sans loader)</h4>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map((s) => (
                <button
                  key={`instant-${s.key}`}
                  onClick={() => handleTestFlashValuation(s.key, false)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 rounded-lg text-white text-sm transition-all"
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Upgrade Modal */}
          <div className="mb-4">
            <h4 className="text-white/70 text-sm font-medium mb-2">Modales</h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowUpgradeModal(true)
                  setIsOpen(false)
                }}
                className="w-full px-3 py-2 bg-[#c9a227]/20 hover:bg-[#c9a227]/40 border border-[#c9a227]/30 rounded-lg text-white text-sm transition-all flex items-center gap-2"
              >
                <span>💳</span>
                <span>Modal Upgrade (79€)</span>
              </button>
            </div>
          </div>

          {/* Section: Actions rapides */}
          <div className="border-t border-white/10 pt-3">
            <h4 className="text-white/70 text-sm font-medium mb-2">Actions rapides</h4>
            <div className="space-y-2">
              <Link
                href="/chat/552032534?objectif=vente"
                className="block w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-white text-sm transition-all text-center"
              >
                Ouvrir chat test (SIREN fictif)
              </Link>
              <button
                onClick={() => {
                  localStorage.clear()
                  window.location.reload()
                }}
                className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded-lg text-white text-sm transition-all"
              >
                🗑️ Vider le localStorage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Flash Valuation */}
      {showFlashValuation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowFlashValuation(false)}
                className="text-white/50 hover:text-white bg-white/10 rounded-full p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FlashValuationDisplayWithLoader
              data={MOCK_DATA[selectedScenario]}
              onUpgrade={() => {
                setShowFlashValuation(false)
                setShowUpgradeModal(true)
              }}
              showLoader={showLoader}
            />
          </div>
        </div>
      )}

      {/* Modal Upgrade */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] border border-[#c9a227]/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#c9a227]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Évaluation Flash terminée !
              </h2>
              <p className="text-white/60">
                Tu as utilisé tes 8 questions gratuites pour {MOCK_DATA[selectedScenario].entreprise}
              </p>
            </div>

            {/* Ce qui manque */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-white/80 font-medium mb-3">Pour affiner ta valorisation, il te manque :</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-white/70">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Les <strong className="text-white">retraitements</strong> (rémunération dirigeant, charges exceptionnelles...)</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>L&apos;analyse des <strong className="text-white">risques</strong> (clients, fournisseurs, homme-clé...)</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>L&apos;upload de <strong className="text-white">documents</strong> (bilans, comptes de résultat)</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>Le <strong className="text-white">rapport PDF</strong> détaillé</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <button
                onClick={() => alert('Redirection vers Stripe Checkout...')}
                className="block w-full py-4 px-6 bg-[#c9a227] hover:bg-[#e8c547] text-[#1a1a2e] font-bold text-lg rounded-xl transition-colors text-center"
              >
                Affiner mon évaluation → 79€
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="block w-full py-3 px-6 text-white/50 hover:text-white/80 text-sm transition-colors text-center"
              >
                Non merci, rester sur l&apos;évaluation Flash
              </button>
            </div>

            {/* Réassurance */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Paiement sécurisé
              </span>
              <span>•</span>
              <span>Sans engagement</span>
              <span>•</span>
              <span>Accès immédiat</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Version avec contrôle du loader
function FlashValuationDisplayWithLoader({
  data,
  onUpgrade,
  showLoader,
}: {
  data: typeof MOCK_DATA.boulangerie
  onUpgrade: () => void
  showLoader: boolean
}) {
  const [isLoading, setIsLoading] = useState(showLoader)

  // Si showLoader est true, on simule le loader de 10s
  useState(() => {
    if (showLoader) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  })

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
          <button
            onClick={() => setIsLoading(false)}
            className="mt-4 text-white/40 hover:text-white/70 text-sm underline"
          >
            Passer le loader (dev)
          </button>
        </div>
      </div>
    )
  }

  return (
    <FlashValuationDisplay
      data={data}
      onUpgrade={onUpgrade}
      siren="552032534"
    />
  )
}
