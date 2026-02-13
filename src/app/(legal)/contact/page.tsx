'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { trackConversion } from '@/lib/analytics'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du message')
      }

      setSubmitted(true)
      trackConversion('contact_submit', { subject: formData.subject })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue. Reessayez ou contactez contact@evalup.fr')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-6 bg-[var(--success-light)] rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-4">Message envoye !</h2>
        <p className="text-[var(--text-secondary)] mb-8">
          Nous avons bien recu votre message et vous repondrons dans les meilleurs delais.
        </p>
        <button
          onClick={() => {
            setSubmitted(false)
            setFormData({ name: '', email: '', subject: '', message: '' })
          }}
          className="text-[var(--accent)] hover:underline"
        >
          Envoyer un autre message
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[32px] font-bold text-[var(--text-primary)] mb-4">Contactez-nous</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Une question, une suggestion ou un probleme ? Nous sommes la pour vous aider.
      </p>

      <div className="grid md:grid-cols-2 gap-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nom"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Votre nom"
          />

          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="vous@exemple.com"
          />

          <div>
            <label className="block text-[13px] font-medium text-[var(--text-primary)] mb-2">
              Sujet
            </label>
            <select
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
            >
              <option value="">Selectionnez un sujet</option>
              <option value="question">Question generale</option>
              <option value="technique">Probleme technique</option>
              <option value="abonnement">Abonnement / Facturation</option>
              <option value="partenariat">Partenariat</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--text-primary)] mb-2">
              Message
            </label>
            <textarea
              required
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] resize-none"
              placeholder="Decrivez votre demande..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[var(--radius-md)] text-sm">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
            Envoyer le message
          </Button>
        </form>

        <div className="space-y-8">
          <div>
            <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-4">Autres moyens de contact</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[var(--text-primary)] font-medium">Email</p>
                  <a href="mailto:contact@evalup.fr" className="text-[var(--text-secondary)] hover:text-[var(--accent)]">
                    contact@evalup.fr
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[var(--text-primary)] font-medium">Adresse</p>
                  <p className="text-[var(--text-secondary)]">
                    22 RUE DU PRESIDENT WILSON<br />
                    78230 LE PECQ, France
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-[var(--radius-lg)] p-6">
            <h3 className="text-[var(--text-primary)] font-medium mb-2">Besoin d&apos;aide immediate ?</h3>
            <p className="text-[var(--text-secondary)] text-sm">
              Consultez notre{' '}
              <Link href="/aide" className="text-[var(--accent)] hover:underline">
                page d&apos;aide
              </Link>
              {' '}pour trouver des reponses aux questions frequentes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
