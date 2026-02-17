import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'

export const metadata: Metadata = {
  title: 'Valorisation SaaS : multiples ARR, métriques clés et méthodes',
  description: 'Une entreprise SaaS se valorise entre 3x et 15x son ARR selon la croissance, le churn et la NRR. Guide complet : Rule of 40, multiples EV/Revenue, métriques clés.',
  alternates: { canonical: '/guide/valorisation-saas' },
  openGraph: {
    title: 'Valorisation SaaS — Multiples ARR et métriques clés',
    description: 'Comment valoriser une entreprise SaaS : Rule of 40, multiples ARR, churn, NRR.',
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
            headline: 'Valorisation SaaS : multiples ARR, métriques clés et méthodes',
            author: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            publisher: { '@type': 'Organization', name: 'EvalUp', url: siteUrl },
            datePublished: '2025-01-20',
            dateModified: '2025-02-17',
            mainEntityOfPage: `${siteUrl}/guide/valorisation-saas`,
            inLanguage: 'fr-FR',
          }),
        }}
      />
      {children}
    </>
  )
}
