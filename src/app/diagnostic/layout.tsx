import { Navbar } from '@/components/layout/Navbar'

export default function DiagnosticLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="pt-[var(--nav-height)]">
        {children}
      </main>
    </>
  )
}
