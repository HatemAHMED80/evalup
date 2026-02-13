'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/compte', label: 'Profil', icon: '👤' },
  { href: '/compte/abonnement', label: 'Abonnement', icon: '💳' },
  { href: '/compte/factures', label: 'Factures', icon: '📄' },
]

export default function CompteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/connexion')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {/* Header */}
      <header className="bg-[var(--bg-primary)] border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[var(--accent)] rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-[14px]">
              E
            </div>
            <span className="text-[18px] font-bold text-[var(--text-primary)]">
              Eval<span className="text-[var(--accent)]">Up</span>
            </span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app">Retour a l&apos;app</Link>
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-56 flex-shrink-0">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)]
                      text-[14px] font-medium transition-colors
                      ${isActive
                        ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                      }
                    `}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-8 pt-8 border-t border-[var(--border)]">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-[var(--danger)]"
                onClick={handleLogout}
              >
                Se deconnecter
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
