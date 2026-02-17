'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const FAQ_CATEGORIES = [
  {
    title: 'Premiers pas',
    icon: '🚀',
    questions: [
      {
        q: 'Comment fonctionne EvalUp ?',
        a: 'EvalUp utilise l\'intelligence artificielle pour analyser les données financières de votre entreprise et vous fournir une estimation de sa valeur. Entrez le numéro SIREN de l\'entreprise, et notre IA récupère automatiquement les données publiques (bilans, comptes de résultat via Pappers), détecte l\'archétype sectoriel, applique 5 méthodes de valorisation et génère un rapport PDF de 28 pages.',
      },
      {
        q: 'Quelles entreprises peuvent être évaluées ?',
        a: 'EvalUp peut évaluer toute entreprise française dont les données financières sont publiquement disponibles (sociétés commerciales ayant déposé leurs comptes au greffe). Cela inclut les PME, TPE, startups, commerces, industries et professions libérales en société.',
      },
      {
        q: 'Combien de temps prend une évaluation ?',
        a: 'Le diagnostic gratuit prend 2 minutes. L\'évaluation complète avec rapport PDF prend environ 10 minutes : le temps de vérifier vos données financières et de répondre aux questions de l\'IA sur votre entreprise.',
      },
      {
        q: 'Quelle est la fiabilité de l\'évaluation ?',
        a: 'EvalUp utilise les mêmes méthodes que les cabinets de conseil en M&A : multiples sectoriels Damodaran, DCF, actif net réévalué. La précision dépend de la qualité des données financières fournies. Plus vous complétez le panneau de données (retraitements, données qualitatives), plus l\'estimation est fiable.',
      },
    ],
  },
  {
    title: 'Valorisation',
    icon: '📊',
    questions: [
      {
        q: 'Quelle est la différence entre Flash et Complète ?',
        a: 'L\'évaluation Flash est gratuite et donne une fourchette indicative sans rapport PDF. L\'évaluation Complète (79€) analyse en profondeur vos documents, applique 5 méthodes de valorisation, identifie les risques (SWOT), calcule les retraitements EBITDA et génère un rapport PDF professionnel de 28 pages avec recommandations personnalisées.',
      },
      {
        q: 'Quelles méthodes de valorisation sont utilisées ?',
        a: 'EvalUp utilise 5 méthodes : (1) Multiple d\'EBITDA avec les multiples sectoriels Damodaran, (2) Discounted Cash Flow (DCF) pour les entreprises en croissance, (3) Actif Net Réévalué (ANR) pour les entreprises patrimoniales, (4) Méthode des comparables basée sur les transactions récentes du secteur, (5) Multiple de chiffre d\'affaires pour les startups et SaaS.',
      },
      {
        q: 'Qu\'est-ce qu\'un retraitement EBITDA ?',
        a: 'Un retraitement EBITDA consiste à ajuster le résultat d\'exploitation pour refléter la capacité bénéficiaire réelle de l\'entreprise. Les principaux retraitements sont : normalisation du salaire du dirigeant (souvent sous-payé en PME), ajout d\'un loyer de marché si le local appartient au dirigeant, réintégration du crédit-bail, et exclusion des charges exceptionnelles non récurrentes.',
      },
      {
        q: 'Comment est calculé le prix de cession ?',
        a: 'Le prix de cession part de la Valeur d\'Entreprise (VE), puis soustrait les dettes financières nettes, ajoute la trésorerie excédentaire, et applique des décotes : illiquidité (-15 à 25% pour une PME non cotée), dépendance au dirigeant (-5 à 20%), concentration clients (-5 à 15%). Le résultat est une fourchette basse/haute.',
      },
      {
        q: 'Qu\'est-ce qu\'un archétype sectoriel ?',
        a: 'EvalUp classe chaque entreprise dans un archétype sectoriel (SaaS, commerce de détail, services, industrie, profession libérale, etc.) basé sur son code NAF et son activité. Chaque archétype détermine la méthode de valorisation principale, les multiples de référence et les décotes spécifiques à appliquer.',
      },
      {
        q: 'Combien vaut une PME en France en moyenne ?',
        a: 'En France, une PME rentable se valorise généralement entre 3x et 7x son EBITDA retraité. Pour un commerce de détail, le multiple est de 4-5x. Pour les services aux entreprises, 5-7x. Pour les entreprises technologiques, 7-12x. Les startups SaaS en forte croissance se valorisent sur un multiple de CA (1x à 10x selon la croissance et le churn).',
      },
    ],
  },
  {
    title: 'Tarifs et paiement',
    icon: '💳',
    questions: [
      {
        q: 'Combien coûte une évaluation EvalUp ?',
        a: 'Le diagnostic (archétype sectoriel, méthode recommandée, erreurs à éviter) est gratuit. L\'évaluation complète avec rapport PDF de 28 pages coûte 79€ TTC. C\'est 25 à 60 fois moins cher qu\'un expert-comptable (2 000-5 000€) ou un cabinet M&A (5 000-15 000€).',
      },
      {
        q: 'Quels moyens de paiement acceptez-vous ?',
        a: 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via Stripe, notre partenaire de paiement sécurisé. Aucune donnée bancaire n\'est stockée sur nos serveurs.',
      },
      {
        q: 'Puis-je obtenir une facture ?',
        a: 'Oui, une facture est automatiquement générée après chaque paiement. Vous pouvez la télécharger depuis votre espace Compte > Factures.',
      },
    ],
  },
  {
    title: 'Documents et données',
    icon: '📁',
    questions: [
      {
        q: 'Quels documents puis-je importer ?',
        a: 'Vous pouvez importer des bilans comptables, comptes de résultat, liasses fiscales, et tout document financier en format PDF, Excel (XLS/XLSX), CSV ou image (JPG/PNG). L\'IA extrait automatiquement les chiffres clés et les intègre dans votre évaluation.',
      },
      {
        q: 'Les données Pappers sont-elles suffisantes ?',
        a: 'Les données Pappers (bilans publics) constituent une bonne base, mais elles peuvent être incomplètes (certains postes manquants, retard de publication). Pour une évaluation plus précise, nous recommandons d\'importer vos propres documents financiers et de compléter les retraitements (salaire dirigeant, loyer, etc.).',
      },
    ],
  },
  {
    title: 'Compte et sécurité',
    icon: '🔐',
    questions: [
      {
        q: 'Mes données sont-elles sécurisées ?',
        a: 'Oui. Toutes les communications sont chiffrées en HTTPS. L\'authentification est sécurisée via Supabase. Les données bancaires sont gérées exclusivement par Stripe (certifié PCI DSS). Vos documents financiers sont analysés puis supprimés — nous ne les conservons pas.',
      },
      {
        q: 'Comment supprimer mon compte ?',
        a: 'Rendez-vous dans Compte > Profil et cliquez sur "Supprimer mon compte" en bas de page. Cette action supprime toutes vos données personnelles et évaluations de manière irréversible.',
      },
    ],
  },
]

export default function AidePage() {
  const [search, setSearch] = useState('')
  const [openCategory, setOpenCategory] = useState<number | null>(0)

  const filteredCategories = FAQ_CATEGORIES.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(search.toLowerCase()) ||
        q.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.questions.length > 0)

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-[var(--nav-height)]">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-[var(--accent-subtle)] to-transparent">
          <div className="max-w-3xl mx-auto px-8 text-center">
            <Badge variant="accent" className="mb-4">Aide</Badge>
            <h1 className="text-[36px] font-bold text-[var(--text-primary)] mb-4">
              Comment pouvons-nous vous aider ?
            </h1>
            <Input
              placeholder="Rechercher une question..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              className="max-w-xl mx-auto"
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-8">
            <div className="space-y-6">
              {(search ? filteredCategories : FAQ_CATEGORIES).map((category, catIndex) => (
                <div
                  key={catIndex}
                  className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenCategory(openCategory === catIndex ? null : catIndex)}
                    className="w-full flex items-center gap-4 p-5 hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="flex-1 text-left text-[16px] font-semibold text-[var(--text-primary)]">
                      {category.title}
                    </span>
                    <svg
                      className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${openCategory === catIndex ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openCategory === catIndex && (
                    <div className="border-t border-[var(--border)]">
                      {category.questions.map((item, qIndex) => (
                        <details key={qIndex} className="border-b border-[var(--border)] last:border-0 group">
                          <summary className="px-5 py-4 pl-14 cursor-pointer list-none text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
                            {item.q}
                          </summary>
                          <p className="px-5 pb-4 pl-14 text-[var(--text-secondary)]">
                            {item.a}
                          </p>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {search && filteredCategories.length === 0 && (
              <p className="text-center text-[var(--text-muted)] py-8">
                Aucun résultat pour &quot;{search}&quot;
              </p>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 bg-[var(--bg-secondary)]">
          <div className="max-w-xl mx-auto px-8 text-center">
            <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-2">
              Vous n&apos;avez pas trouvé votre réponse ?
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Notre équipe est disponible pour vous aider.
            </p>
            <Link
              href="mailto:contact@evalup.fr"
              className="inline-flex items-center gap-2 text-[var(--accent)] font-medium hover:underline"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              contact@evalup.fr
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
