// Page d'évaluation manuelle - Formulaire complet avec scoring qualitatif

import Link from 'next/link'
import EvaluationForm from '@/components/EvaluationForm'

export default function EvaluationPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Navigation */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à l&apos;accueil
            </Link>
          </div>

          {/* Titre et introduction */}
          <div className="text-center">
            <div className="badge-gold mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Évaluation manuelle
            </div>

            <h1 className="text-3xl md:text-4xl font-light text-white mb-4">
              Estimez la valeur de<br />
              <span className="font-semibold">votre entreprise</span>
            </h1>
            <p className="text-lg text-white/70 max-w-xl mx-auto">
              Remplissez ce formulaire pour obtenir une estimation basée sur les
              multiples sectoriels et un scoring qualitatif personnalisé.
            </p>
          </div>
        </div>

        {/* Vague décorative */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40V20C240 5 480 0 720 0C960 0 1200 5 1440 20V40H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Formulaire */}
      <section className="section-small bg-white">
        <div className="container-small">
          <div className="card p-8 md:p-10 shadow-xl border-0">
            <EvaluationForm />
          </div>

          {/* Avantages */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#c9a227]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">100% Confidentiel</h4>
                <p className="text-sm text-gray-600">Vos données restent privées</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Résultat instantané</h4>
                <p className="text-sm text-gray-600">Estimation en quelques secondes</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Méthodologie fiable</h4>
                <p className="text-sm text-gray-600">Basé sur les standards du marché</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-gray-50 border-t border-gray-100">
        <p className="text-center text-sm text-gray-500 max-w-lg mx-auto px-4">
          Cette estimation est fournie à titre indicatif. Pour une évaluation
          précise, consultez un expert en transmission d&apos;entreprise.
        </p>
      </section>
    </div>
  )
}
