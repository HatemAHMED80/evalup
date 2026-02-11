export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      {children}
    </main>
  )
}
