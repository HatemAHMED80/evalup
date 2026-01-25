// Footer professionnel - Style Rothschild/Mazars

import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#1e3a5f] text-white">
      {/* Ligne dorée */}
      <div className="h-1 bg-gradient-to-r from-[#c9a227]/0 via-[#c9a227] to-[#c9a227]/0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo et description */}
          <div className="md:col-span-2">
            <Logo variant="light" size="lg" />
            <p className="mt-6 text-white/70 max-w-md leading-relaxed">
              Plateforme de référence pour l&apos;évaluation et la transmission d&apos;entreprises.
              Nous accompagnons vendeurs et acquéreurs dans leurs projets de cession avec
              discrétion et professionnalisme.
            </p>

            {/* Certifications / Trust badges */}
            <div className="mt-8 flex items-center gap-6">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Données sécurisées</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Confidentialité</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-6">
              Services
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="/vendeur" className="text-white/70 hover:text-white transition-colors">
                  Vendre mon entreprise
                </Link>
              </li>
              <li>
                <Link href="/acheteur" className="text-white/70 hover:text-white transition-colors">
                  Acquérir une entreprise
                </Link>
              </li>
              <li>
                <Link href="/evaluation" className="text-white/70 hover:text-white transition-colors">
                  Évaluation gratuite
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-6">
              Contact
            </h4>
            <ul className="space-y-4 text-white/70">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>contact@evalup.fr</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Paris, France</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/50">
              &copy; {currentYear} EvalUp. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6 text-sm text-white/50">
              <Link href="#" className="hover:text-white transition-colors">
                Mentions légales
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                CGU
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
