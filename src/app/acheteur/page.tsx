// Page Acheteur - Landing page pour les acheteurs potentiels

import Link from 'next/link'

export default function AcheteurPage() {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Espace Acheteur
            </div>

            <h1 className="text-3xl md:text-4xl font-light text-white mb-4">
              Trouvez votre<br />
              <span className="font-semibold">future entreprise</span>
            </h1>
            <p className="text-lg text-white/70 max-w-xl mx-auto mb-10">
              Créez votre profil acheteur pour accéder aux opportunités de reprise
              et être contacté par des vendeurs qualifiés.
            </p>

            <Link
              href="/acheteur/inscription"
              className="btn-success text-lg px-8 py-4 shadow-lg hover:shadow-xl"
            >
              Créer mon profil acheteur
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Vague décorative */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40V20C240 5 480 0 720 0C960 0 1200 5 1440 20V40H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* Système de scoring */}
      <section className="section-small bg-gray-50">
        <div className="container-page">
          <h2 className="heading-2 text-center text-[#1e3a5f] mb-4">
            Un scoring qui vous valorise
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Votre profil est évalué sur 4 critères pour rassurer les vendeurs sur votre capacité à reprendre.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-gold-hover p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#10b981]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Capacité financière</h3>
                  <p className="text-sm text-[#c9a227] font-medium">40 points max</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Votre apport personnel et capacité d&apos;emprunt déterminent les opportunités accessibles.
              </p>
            </div>

            <div className="card-gold-hover p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#1e3a5f]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Expérience</h3>
                  <p className="text-sm text-[#c9a227] font-medium">30 points max</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Vos années de gestion et expertise sectorielle rassurent les vendeurs sur votre capacité.
              </p>
            </div>

            <div className="card-gold-hover p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#c9a227]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sérieux du projet</h3>
                  <p className="text-sm text-[#c9a227] font-medium">20 points max</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Accompagnement professionnel, disponibilité et délai de reprise reflètent votre engagement.
              </p>
            </div>

            <div className="card-gold-hover p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Motivation</h3>
                  <p className="text-sm text-[#c9a227] font-medium">10 points max</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Une présentation claire de votre projet montre votre vision et vos objectifs.
              </p>
            </div>
          </div>

          {/* Grille des grades */}
          <div className="mt-12 card p-6">
            <h3 className="font-semibold text-gray-900 mb-4 text-center">Les grades acheteur</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 rounded-lg">
                <span className="w-8 h-8 bg-[#10b981] text-white rounded-full flex items-center justify-center font-bold text-sm">A</span>
                <span className="text-sm text-gray-700">90-100 pts</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">B</span>
                <span className="text-sm text-gray-700">75-89 pts</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg">
                <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">C</span>
                <span className="text-sm text-gray-700">60-74 pts</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">D</span>
                <span className="text-sm text-gray-700">40-59 pts</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <span className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center font-bold text-sm">E</span>
                <span className="text-sm text-gray-700">&lt;40 pts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="section-small bg-white">
        <div className="container-small">
          <h2 className="heading-2 text-center text-[#1e3a5f] mb-12">
            Comment ça marche ?
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Remplissez votre profil</h3>
                <p className="text-gray-600">
                  Renseignez vos informations : capacité financière, expérience, disponibilité et motivations.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Obtenez votre score</h3>
                <p className="text-gray-600">
                  Un score de A à E évalue votre profil. Plus il est élevé, plus les vendeurs vous feront confiance.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Définissez vos critères</h3>
                <p className="text-gray-600">
                  Précisez ce que vous recherchez : secteur, taille, localisation, budget maximum.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-[#10b981] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Recevez les opportunités</h3>
                <p className="text-gray-600">
                  Les vendeurs correspondant à vos critères pourront vous contacter directement.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/acheteur/inscription"
              className="btn-secondary text-lg px-8 py-4"
            >
              Commencer mon inscription
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-gray-50 border-t border-gray-100">
        <p className="text-center text-sm text-gray-500 max-w-lg mx-auto px-4">
          Vos données sont protégées et ne seront partagées qu&apos;avec votre consentement explicite.
        </p>
      </section>
    </div>
  )
}
