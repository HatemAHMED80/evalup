'use client'

// ⚠️ DEV ONLY — NE JAMAIS COMMIT CE FICHIER ⚠️
// Barre de raccourcis pour tester le flow sans passer par chaque étape

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const ARCHETYPE_SHORTCUTS = [
  { id: 'saas_hyper', label: 'SaaS Hyper' },
  { id: 'saas_mature', label: 'SaaS Mature' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'conseil', label: 'Conseil' },
  { id: 'services_recurrents', label: 'Services Réc.' },
  { id: 'commerce_retail', label: 'Commerce' },
  { id: 'industrie', label: 'Industrie' },
  { id: 'patrimoine', label: 'Patrimoine' },
] as const

const TEST_SIREN = '552032534' // Total Energies
const TEST_COMPANY = 'TOTALENERGIES SE'

function seedSessionStorage(archetypeId: string) {
  const diagnosticData = {
    siren: TEST_SIREN,
    companyName: TEST_COMPANY,
    sector: 'industrie',
    nafCode: '0610Z',
    activityType: 'industrie',
    revenue: 2_000_000,
    ebitda: 200_000,
    growth: 15,
    recurring: 20,
    masseSalariale: 35,
    effectif: '10-49',
  }

  const diagnosticResult = {
    archetypeId,
    archetype: null,
    multiples: null,
    input: diagnosticData,
  }

  sessionStorage.setItem('diagnostic_data', JSON.stringify(diagnosticData))
  sessionStorage.setItem('diagnostic_result', JSON.stringify(diagnosticResult))
}

function seedExtractionData(evalId: string) {
  // Données d'extraction fictives pour tester la page review
  const extraction = {
    exercices: [
      {
        annee: 2024,
        ca: 2_000_000,
        resultat_exploitation: 200_000,
        resultat_net: 150_000,
        ebitda: 280_000,
        dotations_amortissements: 60_000,
        dotations_provisions: 20_000,
        charges_personnel: 800_000,
        effectif_moyen: 15,
        remuneration_dirigeant: 80_000,
        loyers: 36_000,
        credit_bail: null,
        capitaux_propres: 500_000,
        dettes_financieres: 200_000,
        tresorerie: 150_000,
        total_actif: 1_200_000,
        actif_immobilise: 400_000,
        stocks: 100_000,
        creances_clients: 250_000,
        dettes_fournisseurs: 180_000,
      },
      {
        annee: 2023,
        ca: 1_800_000,
        resultat_exploitation: 170_000,
        resultat_net: 120_000,
        ebitda: 240_000,
        dotations_amortissements: 55_000,
        dotations_provisions: 15_000,
        charges_personnel: 750_000,
        effectif_moyen: 13,
        remuneration_dirigeant: 75_000,
        loyers: 34_000,
        credit_bail: null,
        capitaux_propres: 420_000,
        dettes_financieres: 220_000,
        tresorerie: 100_000,
        total_actif: 1_050_000,
        actif_immobilise: 380_000,
        stocks: 90_000,
        creances_clients: 220_000,
        dettes_fournisseurs: 160_000,
      },
    ],
    metadata: {
      source_documents: ['bilan-2024.pdf', 'bilan-2023.pdf'],
      completeness_score: 92,
      missing_critical: [],
      warnings: ['Credit-bail non renseigne'],
    },
  }
  sessionStorage.setItem(`evalup_extraction_${evalId}`, JSON.stringify(extraction))
}

export function DevToolbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedArchetype, setSelectedArchetype] = useState('saas_hyper')
  const [evalId, setEvalId] = useState('')

  if (process.env.NODE_ENV !== 'development') return null

  // Sur les pages chat/evaluation, le bouton est en haut à droite pour ne pas gêner l'input
  const isOverlay = pathname.startsWith('/evaluation')

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-[9999] w-9 h-9 bg-red-600 text-white rounded-full text-[16px] font-bold shadow-lg hover:bg-red-700 transition-colors ${
          isOverlay ? 'top-3 right-14' : 'bottom-3 right-3'
        }`}
        title="Dev Toolbar"
      >
        {isOpen ? '×' : '⚙'}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className={`fixed z-[9998] right-3 bg-gray-900/95 backdrop-blur text-white text-[12px] border border-red-500/50 rounded-xl p-3 shadow-2xl w-[440px] max-h-[80vh] overflow-y-auto ${
            isOverlay ? 'top-14 right-14' : 'bottom-14'
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
            <span className="text-red-400 font-bold text-[11px]">⚠️ DEV TOOLBAR</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-500 text-[10px]">SIREN: {TEST_SIREN}</span>
          </div>

          {/* Config row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 font-medium text-[11px]">Archétype :</span>
            <select
              value={selectedArchetype}
              onChange={(e) => setSelectedArchetype(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-[11px] flex-1"
            >
              {ARCHETYPE_SHORTCUTS.map((a) => (
                <option key={a.id} value={a.id}>{a.label} ({a.id})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-400 font-medium text-[11px]">Eval ID :</span>
            <input
              type="text"
              value={evalId}
              onChange={(e) => setEvalId(e.target.value)}
              placeholder="coller un UUID d'évaluation"
              className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-[11px] flex-1 placeholder:text-gray-600"
            />
          </div>

          {/* ── PRE-PAIEMENT ── */}
          <div className="mb-2 text-[10px] text-gray-500 font-medium uppercase tracking-wide">Pré-paiement</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => router.push('/diagnostic')}
              className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 rounded text-[10px] font-medium transition-colors"
            >
              1. Form
            </button>
            <button
              onClick={() => {
                seedSessionStorage(selectedArchetype)
                router.push('/diagnostic/loading')
              }}
              className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 rounded text-[10px] font-medium transition-colors"
            >
              2. Loading
            </button>
            <button
              onClick={() => {
                seedSessionStorage(selectedArchetype)
                router.push(`/diagnostic/signup?archetype=${selectedArchetype}`)
              }}
              className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 rounded text-[10px] font-medium transition-colors"
            >
              3. Signup
            </button>
            <button
              onClick={() => {
                seedSessionStorage(selectedArchetype)
                router.push(`/diagnostic/result?archetype=${selectedArchetype}`)
              }}
              className="px-2.5 py-1 bg-green-700 hover:bg-green-600 rounded text-[10px] font-bold transition-colors"
            >
              4. Résultat ⭐
            </button>
            <button
              onClick={() => {
                seedSessionStorage(selectedArchetype)
                router.push(`/checkout?plan=eval_complete&siren=${TEST_SIREN}&archetype=${selectedArchetype}`)
              }}
              className="px-2.5 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-[10px] font-medium transition-colors"
            >
              5. Checkout
            </button>
          </div>

          {/* ── POST-PAIEMENT ── */}
          <div className="mb-2 text-[10px] text-gray-500 font-medium uppercase tracking-wide">Post-paiement (nouveau flow)</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => {
                if (!evalId) { alert('Colle un Eval ID en haut'); return }
                router.push(`/evaluation/${evalId}/upload?payment=success`)
              }}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-[10px] font-medium transition-colors"
            >
              6. Upload docs
            </button>
            <button
              onClick={() => {
                if (!evalId) { alert('Colle un Eval ID en haut'); return }
                seedExtractionData(evalId)
                router.push(`/evaluation/${evalId}/review`)
              }}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-[10px] font-medium transition-colors"
            >
              7. Review (+ fake data)
            </button>
            <button
              onClick={() => {
                if (!evalId) { alert('Colle un Eval ID en haut'); return }
                router.push(`/evaluation/${evalId}/chat`)
              }}
              className="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 rounded text-[10px] font-medium transition-colors"
            >
              8. Chat éval
            </button>
          </div>

          {/* ── PAGES ── */}
          <div className="mb-2 text-[10px] text-gray-500 font-medium uppercase tracking-wide">Pages</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => router.push('/connexion')}
              className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded text-[10px] font-medium transition-colors"
            >
              Connexion
            </button>
            <button
              onClick={() => router.push('/inscription')}
              className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded text-[10px] font-medium transition-colors"
            >
              Inscription
            </button>
            <button
              onClick={() => router.push('/tarifs')}
              className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded text-[10px] font-medium transition-colors"
            >
              Tarifs
            </button>
            <button
              onClick={() => router.push('/app')}
              className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded text-[10px] font-medium transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded text-[10px] font-medium transition-colors"
            >
              Accueil
            </button>
          </div>

          {/* ── UTILS ── */}
          <div className="mb-2 text-[10px] text-gray-500 font-medium uppercase tracking-wide">Utilitaires</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                sessionStorage.clear()
                localStorage.clear()
                alert('sessionStorage + localStorage vidés')
              }}
              className="px-2.5 py-1 bg-red-800 hover:bg-red-700 rounded text-[10px] font-medium transition-colors"
            >
              Clear Storage
            </button>
            <button
              onClick={() => {
                document.cookie.split(';').forEach((c) => {
                  document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
                })
                alert('Cookies supprimés (côté client)')
              }}
              className="px-2.5 py-1 bg-red-800 hover:bg-red-700 rounded text-[10px] font-medium transition-colors"
            >
              Clear Cookies
            </button>
          </div>
        </div>
      )}
    </>
  )
}
