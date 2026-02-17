import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'

export const metadata: Metadata = {
  title: 'Tarifs - Valorisation d\'entreprise',
  description: 'Diagnostic gratuit ou évaluation complète à 79€ avec rapport PDF professionnel. Comparez nos offres de valorisation d\'entreprise par IA.',
  alternates: {
    canonical: '/tarifs',
  },
  openGraph: {
    title: 'Tarifs EvalUp - Valorisation d\'entreprise par IA',
    description: 'Diagnostic gratuit ou évaluation complète à 79€. Rapport PDF professionnel, 5 méthodes de valorisation.',
  },
}

export default function TarifsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Accueil',
                item: siteUrl,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Tarifs',
                item: `${siteUrl}/tarifs`,
              },
            ],
          }),
        }}
      />
      {children}
    </>
  )
}
