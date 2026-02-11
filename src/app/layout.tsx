import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import '../styles/globals.css'
import '../styles/animations.css'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'
const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-5CDRQB90BP'

export const metadata: Metadata = {
  title: {
    default: 'EvalUp - Valorisation d\'entreprise par IA',
    template: '%s | EvalUp',
  },
  description: 'Obtenez une estimation fiable de la valeur de votre entreprise en quelques minutes grace a l\'intelligence artificielle. Rapport professionnel de 32 pages, 5 methodes de valorisation.',
  keywords: ['valorisation entreprise', 'estimation entreprise', 'cession entreprise', 'transmission entreprise', 'valorisation IA', 'rapport valorisation', 'evaluer entreprise', 'prix de vente entreprise', 'multiple EBITDA', 'evaluation PME'],
  authors: [{ name: 'POSSE' }],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'EvalUp - Valorisation d\'entreprise par IA',
    description: 'Estimez la valeur de votre entreprise en quelques minutes. Rapport professionnel PDF, 5 methodes de valorisation, analyse financiere complete.',
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
    description: 'Estimez la valeur de votre entreprise en quelques minutes grace a l\'IA.',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script dangerouslySetInnerHTML={{ __html: `
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
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'EvalUp',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description: 'Valorisation d\'entreprise par intelligence artificielle. Rapport professionnel de 32 pages avec 5 methodes de valorisation.',
              url: siteUrl,
              offers: [
                {
                  '@type': 'Offer',
                  name: 'Evaluation Flash',
                  price: '0',
                  priceCurrency: 'EUR',
                  description: 'Estimation indicative gratuite',
                },
                {
                  '@type': 'Offer',
                  name: 'Evaluation Complete',
                  price: '79',
                  priceCurrency: 'EUR',
                  description: 'Valorisation precise avec rapport PDF professionnel de 32 pages',
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
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
