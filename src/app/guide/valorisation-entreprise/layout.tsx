import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'

export const metadata: Metadata = {
  title: 'Comment valoriser une entreprise en France ? Guide complet 2025',
  description: 'La valorisation d\'une entreprise en France repose sur 5 méthodes principales : multiple d\'EBITDA, DCF, actif net réévalué, comparables et chiffre d\'affaires. Ce guide explique chaque méthode, les retraitements à appliquer et les erreurs courantes.',
  alternates: {
    canonical: '/guide/valorisation-entreprise',
  },
  openGraph: {
    title: 'Comment valoriser une entreprise en France ? Guide complet',
    description: 'Guide pratique : les 5 méthodes de valorisation, les retraitements EBITDA, les décotes et les erreurs à éviter.',
    type: 'article',
  },
}

export default function ValorisationGuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Comment valoriser une entreprise en France ? Guide complet 2025',
            description: 'Guide pratique sur la valorisation d\'entreprise en France : méthodes, retraitements EBITDA, décotes, erreurs courantes.',
            author: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            publisher: { '@type': 'Organization', name: 'EvalUp', url: siteUrl, logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.svg` } },
            datePublished: '2025-01-15',
            dateModified: '2025-02-17',
            mainEntityOfPage: `${siteUrl}/guide/valorisation-entreprise`,
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
              { '@type': 'ListItem', position: 3, name: 'Valorisation d\'entreprise', item: `${siteUrl}/guide/valorisation-entreprise` },
            ],
          }),
        }}
      />
      {children}
    </>
  )
}
