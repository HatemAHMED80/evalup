import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'

export const metadata: Metadata = {
  title: 'Comment valoriser un restaurant ? Méthodes et multiples 2025',
  description: 'Un restaurant en France se valorise entre 40% et 100% de son CA annuel, soit 3x à 5x l\'EBITDA retraité. Guide complet : méthodes, retraitements, décotes, erreurs à éviter.',
  alternates: { canonical: '/guide/valorisation-restaurant' },
  openGraph: {
    title: 'Valorisation d\'un restaurant — Guide complet',
    description: 'Méthodes, multiples et erreurs à éviter pour valoriser un restaurant en France.',
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
            headline: 'Comment valoriser un restaurant ? Méthodes et multiples 2025',
            author: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            publisher: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            datePublished: '2025-01-20',
            dateModified: '2025-02-17',
            mainEntityOfPage: `${siteUrl}/guide/valorisation-restaurant`,
            inLanguage: 'fr-FR',
          }),
        }}
      />
      {children}
    </>
  )
}
