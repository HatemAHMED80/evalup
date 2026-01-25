// Header simplifié - Focus évaluation

'use client'

import Link from 'next/link'
import Logo from './Logo'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Logo variant="dark" size="md" />
          </Link>

          {/* CTA Acquéreur */}
          <Link
            href="/acheteur"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#1e3a5f] border-2 border-[#1e3a5f] rounded-lg hover:bg-[#1e3a5f] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Je suis acquéreur
          </Link>
        </div>
      </div>
    </header>
  )
}
