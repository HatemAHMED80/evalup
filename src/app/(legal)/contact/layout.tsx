import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l\'équipe EvalUp pour toute question sur la valorisation de votre entreprise. Réponse sous 24h.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contactez EvalUp',
    description: 'Une question sur la valorisation de votre entreprise ? Notre équipe vous répond sous 24h.',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
