import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evalup.fr'

export const metadata: Metadata = {
  title: 'Aide - Questions fréquentes',
  description: 'Trouvez les réponses à vos questions sur EvalUp : fonctionnement, méthodes de valorisation, tarifs, paiement, sécurité des données.',
  alternates: {
    canonical: '/aide',
  },
  openGraph: {
    title: 'Aide et FAQ - EvalUp',
    description: 'Questions fréquentes sur la valorisation d\'entreprise avec EvalUp. Fonctionnement, méthodes, tarifs et sécurité.',
  },
}

const FAQ_ITEMS = [
  {
    question: 'Comment fonctionne EvalUp ?',
    answer: 'EvalUp utilise l\'intelligence artificielle pour analyser les données financières de votre entreprise et vous fournir une estimation de sa valeur. Entrez le SIREN de l\'entreprise, et notre IA récupérera automatiquement les données publiques disponibles.',
  },
  {
    question: 'Quelles entreprises peuvent être évaluées ?',
    answer: 'EvalUp peut évaluer toute entreprise française dont les données financières sont publiquement disponibles (sociétés commerciales ayant déposé leurs comptes au greffe).',
  },
  {
    question: 'Quelle est la différence entre Flash et Complète ?',
    answer: 'L\'évaluation Flash est gratuite et donne une fourchette indicative. L\'évaluation Complète (79€) analyse vos documents, identifie les risques et génère un rapport PDF professionnel.',
  },
  {
    question: 'Comment l\'évaluation est-elle calculée ?',
    answer: 'L\'évaluation repose sur un archétype sectoriel adapté à votre activité. Elle utilise les multiples de marché Damodaran (EV/EBITDA ou EV/Revenue selon le profil), applique des retraitements EBITDA et des décotes qualitatives.',
  },
  {
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via Stripe, notre partenaire de paiement sécurisé.',
  },
  {
    question: 'Puis-je obtenir une facture ?',
    answer: 'Oui, une facture est automatiquement générée après chaque paiement. Vous pouvez la télécharger depuis votre espace Compte > Factures.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Oui, nous utilisons le chiffrement HTTPS, l\'authentification sécurisée, et nous ne stockons pas vos données bancaires (gérées par Stripe).',
  },
  {
    question: 'Comment supprimer mon compte ?',
    answer: 'Rendez-vous dans Compte > Profil et cliquez sur "Supprimer mon compte" en bas de page. Cette action est irréversible.',
  },
]

export default function AideLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Accueil', item: siteUrl },
              { '@type': 'ListItem', position: 2, name: 'Aide', item: `${siteUrl}/aide` },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          }),
        }}
      />
      {children}
    </>
  )
}
