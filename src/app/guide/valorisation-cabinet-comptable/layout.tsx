import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'

export const metadata: Metadata = {
  title: 'Valorisation d\'un cabinet comptable : méthodes et multiples',
  description: 'Un cabinet comptable se valorise entre 80% et 120% de son CA récurrent. La méthode des comparables (% du CA) est la référence. Guide : facteurs de valorisation, décotes, négociation.',
  alternates: { canonical: '/guide/valorisation-cabinet-comptable' },
  openGraph: {
    title: 'Valorisation d\'un cabinet comptable — Guide complet',
    description: 'Méthodes, multiples et facteurs clés pour valoriser un cabinet d\'expertise comptable.',
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
            headline: 'Valorisation d\'un cabinet comptable : méthodes et multiples',
            author: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            publisher: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            datePublished: '2025-01-20',
            dateModified: '2025-02-17',
            mainEntityOfPage: `${siteUrl}/guide/valorisation-cabinet-comptable`,
            inLanguage: 'fr-FR',
          }),
        }}
      />
      {children}
    </>
  )
}
