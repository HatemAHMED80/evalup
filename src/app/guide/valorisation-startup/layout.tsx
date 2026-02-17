import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'

export const metadata: Metadata = {
  title: 'Valorisation de startup : méthodes pré-revenue, DCF et comparables',
  description: 'Valoriser une startup sans revenus ou en early-stage : méthode DCF, Berkus, scorecard, comparables de levées. Guide complet avec exemples de valorisation seed et série A.',
  alternates: { canonical: '/guide/valorisation-startup' },
  openGraph: {
    title: 'Valorisation de startup — Méthodes et exemples',
    description: 'Pré-revenue, seed, série A : comment valoriser une startup en France.',
    type: 'article',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Valorisation de startup : méthodes pré-revenue, DCF et comparables',
            author: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            publisher: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            datePublished: '2025-01-20',
            dateModified: '2025-02-17',
            mainEntityOfPage: `${siteUrl}/guide/valorisation-startup`,
            inLanguage: 'fr-FR',
          }),
        }}
      />
      {children}
    </>
  )
}
