import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'

export const metadata: Metadata = {
  title: 'Valorisation d\'un commerce : fonds de commerce, droit au bail, multiples',
  description: 'Un commerce en France se valorise entre 3x et 5x l\'EBITDA retraité, ou 50% à 100% du CA selon le secteur. Guide : fonds de commerce, droit au bail, emplacement, stock.',
  alternates: { canonical: '/guide/valorisation-commerce' },
  openGraph: {
    title: 'Valorisation d\'un commerce — Guide complet',
    description: 'Fonds de commerce, droit au bail, multiples : comment valoriser un commerce en France.',
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
            headline: 'Valorisation d\'un commerce : fonds de commerce, droit au bail, multiples',
            author: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            publisher: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            datePublished: '2025-01-20',
            dateModified: '2025-02-17',
            mainEntityOfPage: `${siteUrl}/guide/valorisation-commerce`,
            inLanguage: 'fr-FR',
          }),
        }}
      />
      {children}
    </>
  )
}
