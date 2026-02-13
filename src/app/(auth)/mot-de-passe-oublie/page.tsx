'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      // Toujours afficher le message de succes (meme si le compte n'existe pas, pour securite)
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-[var(--accent)] rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-[16px]">
              E
            </div>
            <span className="text-[20px] font-bold text-[var(--text-primary)]">
              Eval<span className="text-[var(--accent)]">Up</span>
            </span>
          </Link>
        </div>

        <div className="bg-[var(--bg-primary)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-lg)] border border-[var(--border)] p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--success-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-2">
                Email envoye !
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un lien de reinitialisation.
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link href="/connexion">Retour a la connexion</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">
                  Mot de passe oublie ?
                </h2>
                <p className="text-[var(--text-secondary)]">
                  Entrez votre email pour recevoir un lien de reinitialisation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <Input
                  label="Email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Envoyer le lien
                </Button>
              </form>

              <p className="text-center text-[var(--text-secondary)] text-sm mt-6">
                <Link href="/connexion" className="text-[var(--accent)] font-medium hover:underline">
                  Retour a la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
