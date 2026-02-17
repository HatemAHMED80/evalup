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
    answer: 'EvalUp utilise l\'intelligence artificielle pour analyser les données financières de votre entreprise et vous fournir une estimation de sa valeur. Entrez le numéro SIREN, et l\'IA récupère automatiquement les données publiques (bilans via Pappers), détecte l\'archétype sectoriel, applique 5 méthodes de valorisation et génère un rapport PDF de 28 pages.',
  },
  {
    question: 'Quelles entreprises peuvent être évaluées ?',
    answer: 'EvalUp peut évaluer toute entreprise française dont les données financières sont publiquement disponibles : PME, TPE, startups, commerces, industries et professions libérales en société.',
  },
  {
    question: 'Combien de temps prend une évaluation ?',
    answer: 'Le diagnostic gratuit prend 2 minutes. L\'évaluation complète avec rapport PDF prend environ 10 minutes.',
  },
  {
    question: 'Quelle est la fiabilité de l\'évaluation ?',
    answer: 'EvalUp utilise les mêmes méthodes que les cabinets de conseil en M&A : multiples sectoriels Damodaran, DCF, actif net réévalué. La précision dépend de la qualité des données financières fournies.',
  },
  {
    question: 'Quelles méthodes de valorisation sont utilisées ?',
    answer: 'EvalUp utilise 5 méthodes : multiple d\'EBITDA avec les multiples sectoriels Damodaran, Discounted Cash Flow (DCF), Actif Net Réévalué (ANR), méthode des comparables, et multiple de chiffre d\'affaires pour les startups et SaaS.',
  },
  {
    question: 'Qu\'est-ce qu\'un retraitement EBITDA ?',
    answer: 'Un retraitement EBITDA consiste à ajuster le résultat d\'exploitation pour refléter la capacité bénéficiaire réelle : normalisation du salaire du dirigeant, ajout d\'un loyer de marché si le local appartient au dirigeant, réintégration du crédit-bail, et exclusion des charges exceptionnelles.',
  },
  {
    question: 'Combien vaut une PME en France en moyenne ?',
    answer: 'En France, une PME rentable se valorise généralement entre 3x et 7x son EBITDA retraité. Commerce de détail : 4-5x. Services aux entreprises : 5-7x. Entreprises technologiques : 7-12x. Startups SaaS : 1x à 10x le CA selon la croissance.',
  },
  {
    question: 'Combien coûte une évaluation EvalUp ?',
    answer: 'Le diagnostic est gratuit. L\'évaluation complète avec rapport PDF de 28 pages coûte 79€ TTC, soit 25 à 60 fois moins qu\'un expert-comptable (2 000-5 000€) ou un cabinet M&A (5 000-15 000€).',
  },
  {
    question: 'Quelle est la différence entre Flash et Complète ?',
    answer: 'L\'évaluation Flash est gratuite et donne une fourchette indicative. L\'évaluation Complète (79€) analyse vos documents, applique 5 méthodes, calcule les retraitements EBITDA et génère un rapport PDF de 28 pages avec SWOT et recommandations.',
  },
  {
    question: 'Quels documents puis-je importer ?',
    answer: 'Vous pouvez importer des bilans comptables, comptes de résultat, liasses fiscales en format PDF, Excel (XLS/XLSX), CSV ou image (JPG/PNG). L\'IA extrait automatiquement les chiffres clés.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Oui. Communications chiffrées en HTTPS, authentification sécurisée via Supabase, données bancaires gérées par Stripe (certifié PCI DSS). Les documents financiers sont analysés puis supprimés.',
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
