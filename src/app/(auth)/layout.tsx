// Layout minimal pour les pages d'authentification
// Les pages gèrent leur propre mise en page complète

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
