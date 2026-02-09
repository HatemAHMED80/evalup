'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function UserMenu() {
  const { user, isLoading, signOut, isPremium, planName } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
    router.push('/')
    router.refresh()
  }

  // En cours de chargement
  if (isLoading) {
    return (
      <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse" />
    )
  }

  // Initiales pour utilisateur connecte
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
      >
        {user ? (
          // Utilisateur connecte - afficher avatar avec initiales
          <div className="w-9 h-9 bg-[#c9a227] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[#1a1a2e] text-sm font-semibold">{initials}</span>
          </div>
        ) : (
          // Non connecte - afficher icone utilisateur
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-medium text-white/90 truncate">
            {user ? (user.user_metadata?.full_name || 'Utilisateur') : 'Visiteur'}
          </div>
          <div className={`text-xs ${isPremium ? 'text-[#c9a227]' : 'text-white/50'}`}>
            {isPremium ? `⭐ ${planName}` : 'Plan Gratuit'}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-white/40 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Menu deroulant - s'ouvre vers le haut */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-56 bg-[#252542] border border-white/10 rounded-xl shadow-xl py-1 z-50">
          {/* Connexion (si non connecte) */}
          {!user && (
            <div className="py-1">
              <Link
                href="/connexion"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-[#c9a227] hover:bg-[#c9a227]/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Connexion
              </Link>
            </div>
          )}

          {/* Passer a Pro (seulement si pas premium) */}
          {!isPremium && (
            <div className="py-1">
              <Link
                href="/tarifs"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-[#c9a227] hover:bg-[#c9a227]/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Passer a Pro
              </Link>
            </div>
          )}

          {/* Liens (connecte uniquement) */}
          {user && (
            <>
              <div className="border-t border-white/10 py-1">
                <Link
                  href="/compte"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Mon compte
                </Link>

                <Link
                  href="/compte/abonnement"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Abonnement
                </Link>
              </div>
            </>
          )}

          {/* Aide */}
          <div className="border-t border-white/10 py-1">
            <Link
              href="/aide"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Aide
            </Link>
          </div>

          {/* Deconnexion (connecte uniquement) */}
          {user && (
            <div className="border-t border-white/10 py-1">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Deconnexion
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
