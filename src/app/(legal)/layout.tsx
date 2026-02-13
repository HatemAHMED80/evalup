import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />

      <main className="pt-[var(--nav-height)]">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-2xl)] p-8 md:p-12">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
