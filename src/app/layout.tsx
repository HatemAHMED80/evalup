import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { FlowTester } from '@/components/debug/FlowTester'
import '../styles/globals.css'
import '../styles/animations.css'

export const metadata: Metadata = {
  title: 'EvalUp - Valorisation d\'entreprise par IA',
  description: 'Obtenez une estimation fiable de la valeur de votre entreprise en quelques minutes grâce à l\'intelligence artificielle.',
  keywords: ['valorisation', 'entreprise', 'IA', 'estimation', 'cession', 'transmission'],
  authors: [{ name: 'POSSE' }],
  openGraph: {
    title: 'EvalUp - Valorisation d\'entreprise par IA',
    description: 'Obtenez une estimation fiable de la valeur de votre entreprise en quelques minutes.',
    type: 'website',
    locale: 'fr_FR',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  })();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ThemeProvider>
            {children}
            {process.env.NODE_ENV === 'development' && <FlowTester />}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
