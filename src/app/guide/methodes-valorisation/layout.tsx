import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'

export const metadata: Metadata = {
  title: 'Les 5 méthodes de valorisation d\'entreprise expliquées',
  description: 'Multiple d\'EBITDA, DCF, actif net réévalué, comparables, multiple de CA : découvrez les 5 méthodes de valorisation utilisées pour estimer la valeur d\'une PME en France, avec des exemples chiffrés.',
  alternates: {
    canonical: '/guide/methodes-valorisation',
  },
  openGraph: {
    title: 'Les 5 méthodes de valorisation d\'entreprise',
    description: 'Multiple d\'EBITDA, DCF, ANR, comparables, multiple de CA — chaque méthode expliquée avec des exemples.',
    type: 'article',
  },
}

export default function MethodesGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Les 5 méthodes de valorisation d\'entreprise expliquées',
            description: 'Guide détaillé des 5 méthodes de valorisation d\'entreprise avec exemples chiffrés.',
            author: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            publisher: { '@type': 'Organization', name: 'EvalUp', url: siteUrl, logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.svg` } },
            datePublished: '2025-01-15',
            dateModified: '2025-02-17',
            mainEntityOfPage: `${siteUrl}/guide/methodes-valorisation`,
            inLanguage: 'fr-FR',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: siteUrl },
              { '@type': 'ListItem', position: 2, name: 'Guides', item: `${siteUrl}/guide` },
              { '@type': 'ListItem', position: 3, name: 'Méthodes de valorisation', item: `${siteUrl}/guide/methodes-valorisation` },
            ],
          }),
        }}
      />
      {children}
    </>
  )
}
