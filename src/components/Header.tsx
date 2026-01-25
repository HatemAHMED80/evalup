// En-tête du site EvalUp

import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-[#1e3a5f] text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo et nom */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 bg-[#10b981] rounded-lg flex items-center justify-center font-bold text-xl">
              E
            </div>
            <span className="text-2xl font-bold">EvalUp</span>
          </Link>

          {/* Tagline */}
          <p className="hidden md:block text-sm text-gray-300">
            Estimez la valeur de votre entreprise en quelques clics
          </p>
        </div>
      </div>
    </header>
  )
}
