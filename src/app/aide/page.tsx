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
        a: 'EvalUp utilise l\'intelligence artificielle pour analyser les donnees financieres de votre entreprise et vous fournir une estimation de sa valeur. Entrez le SIREN de l\'entreprise, et notre IA recuperera automatiquement les donnees publiques disponibles.',
      },
      {
        q: 'Quelles entreprises peuvent etre evaluees ?',
        a: 'EvalUp peut evaluer toute entreprise francaise dont les donnees financieres sont publiquement disponibles (societes commerciales ayant depose leurs comptes au greffe).',
      },
    ],
  },
  {
    title: 'Evaluations',
    icon: '📊',
    questions: [
      {
        q: 'Quelle est la difference entre Flash et Complete ?',
        a: 'L\'evaluation Flash est gratuite et donne une fourchette indicative. L\'evaluation Complete (79€) analyse vos documents, identifie les risques et genere un rapport PDF professionnel.',
      },
      {
        q: 'Comment l\'evaluation est-elle calculee ?',
        a: 'L\'evaluation combine plusieurs methodes : multiples de marche (EV/EBITDA), DCF simplifie, et comparaison avec des transactions similaires dans le secteur.',
      },
    ],
  },
  {
    title: 'Tarifs et paiement',
    icon: '💳',
    questions: [
      {
        q: 'Quels moyens de paiement acceptez-vous ?',
        a: 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via Stripe, notre partenaire de paiement securise.',
      },
      {
        q: 'Puis-je obtenir une facture ?',
        a: 'Oui, une facture est automatiquement generee apres chaque paiement. Vous pouvez la telecharger depuis votre espace Compte > Factures.',
      },
    ],
  },
  {
    title: 'Compte et securite',
    icon: '🔐',
    questions: [
      {
        q: 'Mes donnees sont-elles securisees ?',
        a: 'Oui, nous utilisons le chiffrement HTTPS, l\'authentification securisee, et nous ne stockons pas vos donnees bancaires (gerees par Stripe).',
      },
      {
        q: 'Comment supprimer mon compte ?',
        a: 'Rendez-vous dans Compte > Profil et cliquez sur "Supprimer mon compte" en bas de page. Cette action est irreversible.',
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
                Aucun resultat pour "{search}"
              </p>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 bg-[var(--bg-secondary)]">
          <div className="max-w-xl mx-auto px-8 text-center">
            <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-2">
              Vous n'avez pas trouve votre reponse ?
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Notre equipe est disponible pour vous aider.
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
