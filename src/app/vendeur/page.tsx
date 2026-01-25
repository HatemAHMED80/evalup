// Page Vendeur - Recherche d'entreprise par SIREN

import Link from 'next/link'
import SirenSearch from '@/components/SirenSearch'

export default function VendeurPage() {
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
            <div className="badge-success mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Espace Vendeur
            </div>

            <h1 className="text-3xl md:text-4xl font-light text-white mb-4">
              Évaluez votre entreprise<br />
              <span className="font-semibold">gratuitement</span>
            </h1>
            <p className="text-lg text-white/70 max-w-xl mx-auto mb-10">
              Obtenez une estimation de valorisation basée sur vos bilans officiels
              et découvrez les acheteurs potentiels.
            </p>

            {/* Barre de recherche SIREN */}
            <div className="card p-6 shadow-2xl max-w-xl mx-auto">
              <SirenSearch />
            </div>
          </div>
        </div>

        {/* Vague décorative */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40V20C240 5 480 0 720 0C960 0 1200 5 1440 20V40H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* Avantages Vendeur */}
      <section className="section-small bg-gray-50">
        <div className="container-page">
          <h2 className="heading-2 text-center text-[#1e3a5f] mb-12">
            Ce que vous allez obtenir
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-gold-hover p-6">
              <div className="w-12 h-12 bg-[#10b981]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analyse financière</h3>
              <p className="text-sm text-gray-600">
                Synthèse de vos 3 derniers bilans avec indicateurs clés : CA, EBITDA, marge, trésorerie.
              </p>
            </div>

            <div className="card-gold-hover p-6">
              <div className="w-12 h-12 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Estimation de valorisation</h3>
              <p className="text-sm text-gray-600">
                Fourchette de prix basée sur les multiples sectoriels et la performance financière.
              </p>
            </div>

            <div className="card-gold-hover p-6">
              <div className="w-12 h-12 bg-[#c9a227]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Acheteurs qualifiés</h3>
              <p className="text-sm text-gray-600">
                Accédez à des profils d&apos;acheteurs scorés et validés correspondant à votre entreprise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Confidentialité */}
      <section className="section-small bg-white">
        <div className="container-small">
          <div className="bg-[#1e3a5f]/5 rounded-2xl p-8 border border-[#1e3a5f]/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#1e3a5f] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1e3a5f] mb-2">
                  Confidentialité garantie
                </h3>
                <p className="text-gray-600 mb-4">
                  Votre identité et les informations de votre entreprise restent strictement confidentielles.
                  Les acheteurs ne voient que les informations que vous choisissez de partager.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Nom d&apos;entreprise masqué jusqu&apos;à votre accord
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Vous choisissez qui peut vous contacter
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Aucune donnée partagée sans votre consentement
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-gray-50 border-t border-gray-100">
        <p className="text-center text-sm text-gray-500 max-w-lg mx-auto px-4">
          Cette estimation est fournie à titre indicatif et ne constitue pas un conseil financier.
        </p>
      </section>
    </div>
  )
}
