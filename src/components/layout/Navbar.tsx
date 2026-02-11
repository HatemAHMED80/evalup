'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface NavItem {
  label: string
  href: string
}

interface NavbarProps {
  items?: NavItem[]
  className?: string
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Diagnostic gratuit', href: '/diagnostic' },
  { label: 'Comment ca marche', href: '#how-it-works' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Aide', href: '/aide' },
]

export function Navbar({ items = DEFAULT_NAV_ITEMS, className = '' }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[var(--nav-height)] transition-all duration-300 ${
        isScrolled
          ? 'bg-[var(--bg-primary)]/95 backdrop-blur-md shadow-[var(--shadow-sm)] border-b border-[var(--border)]'
          : 'bg-transparent'
      } ${className}`}
    >
      <div className="max-w-[var(--content-max-width)] mx-auto h-full px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[var(--accent)] rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-[16px]">
            E
          </div>
          <span className="text-[20px] font-bold text-[var(--text-primary)]">
            Eval<span className="text-[var(--accent)]">Up</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/connexion"
            className="px-5 py-2.5 text-[14px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] transition-all duration-150 cursor-pointer"
          >
            Connexion
          </a>
          <a
            href="/diagnostic"
            className="px-5 py-2.5 text-[14px] font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-150 cursor-pointer"
          >
            Commencer gratuitement
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-sm)] transition-colors"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[var(--bg-primary)] border-b border-[var(--border)] shadow-[var(--shadow-lg)] py-4 animate-slide-in-down">
          <div className="max-w-[var(--content-max-width)] mx-auto px-8">
            <div className="space-y-1 mb-4">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2.5 px-3 text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-[var(--border)] pt-4 space-y-2">
              <Link
                href="/connexion"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center px-5 py-2.5 text-[14px] font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] rounded-[var(--radius-md)] transition-all duration-150"
              >
                Connexion
              </Link>
              <Link
                href="/diagnostic"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center px-5 py-2.5 text-[14px] font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] rounded-[var(--radius-md)] transition-all duration-150"
              >
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
