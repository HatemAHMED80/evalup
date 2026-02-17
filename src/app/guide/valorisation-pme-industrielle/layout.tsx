import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'

export const metadata: Metadata = {
  title: 'Valorisation d\'une PME industrielle : EBITDA, actifs et multiples',
  description: 'Une PME industrielle se valorise entre 4x et 6x l\'EBITDA retraité. L\'actif net réévalué (machines, immobilier) sert de plancher. Guide : retraitements, carnet de commandes, dépendance client.',
  alternates: { canonical: '/guide/valorisation-pme-industrielle' },
  openGraph: {
    title: 'Valorisation d\'une PME industrielle — Guide complet',
    description: 'EBITDA, actifs corporels, carnet de commandes : valoriser une entreprise industrielle.',
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
            headline: 'Valorisation d\'une PME industrielle : EBITDA, actifs et multiples',
            author: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            publisher: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            datePublished: '2025-01-20',
            dateModified: '2025-02-17',
            mainEntityOfPage: `${siteUrl}/guide/valorisation-pme-industrielle`,
            inLanguage: 'fr-FR',
          }),
        }}
      />
      {children}
    </>
  )
}
