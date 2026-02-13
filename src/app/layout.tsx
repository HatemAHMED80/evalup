import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { DevToolbar } from '@/components/layout/DevToolbar'
import '../styles/globals.css'
import '../styles/animations.css'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'
const gaId = process.env.NODE_ENV === 'production'
  ? (process.env.NEXT_PUBLIC_GA_ID || 'G-5CDRQB90BP')
  : process.env.NEXT_PUBLIC_GA_ID || ''

export const metadata: Metadata = {
  title: {
    default: 'EvalUp - Valorisation d\'entreprise par IA',
    template: '%s | EvalUp',
  },
  description: 'Obtenez une estimation fiable de la valeur de votre entreprise en quelques minutes grâce à l\'intelligence artificielle. Rapport professionnel de 32 pages, 5 méthodes de valorisation.',
  keywords: ['valorisation entreprise', 'estimation entreprise', 'cession entreprise', 'transmission entreprise', 'valorisation IA', 'rapport valorisation', 'évaluer entreprise', 'prix de vente entreprise', 'multiple EBITDA', 'évaluation PME'],
  authors: [{ name: 'POSSE' }],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'EvalUp - Valorisation d\'entreprise par IA',
    description: 'Estimez la valeur de votre entreprise en quelques minutes. Rapport professionnel PDF, 5 méthodes de valorisation, analyse financière complète.',
    type: 'website',
    locale: 'fr_FR',
    url: siteUrl,
    siteName: 'EvalUp',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'EvalUp - Valorisation d\'entreprise par IA',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EvalUp - Valorisation d\'entreprise par IA',
    description: 'Estimez la valeur de votre entreprise en quelques minutes grâce à l\'IA.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const nonce = (await headers()).get('x-nonce') || ''

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
        {gaId && (
          <>
            <script nonce={nonce} async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}} />
          </>
        )}
      </head>
      <body className="antialiased">
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'EvalUp',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description: 'Valorisation d\'entreprise par intelligence artificielle. Rapport professionnel de 32 pages avec 5 méthodes de valorisation.',
              url: siteUrl,
              offers: [
                {
                  '@type': 'Offer',
                  name: 'Évaluation Flash',
                  price: '0',
                  priceCurrency: 'EUR',
                  description: 'Estimation indicative gratuite',
                },
                {
                  '@type': 'Offer',
                  name: 'Évaluation Complète',
                  price: '79',
                  priceCurrency: 'EUR',
                  description: 'Valorisation précise avec rapport PDF professionnel de 32 pages',
                },
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '50',
                bestRating: '5',
              },
            }),
          }}
        />
        <AuthProvider>
          <ThemeProvider>
            {children}
            {process.env.NODE_ENV === 'development' && <DevToolbar />}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
