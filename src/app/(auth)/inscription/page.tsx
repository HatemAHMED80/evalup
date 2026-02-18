'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

function InscriptionForm() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Cet email est déjà utilisé')
        } else {
          setError(authError.message)
        }
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Une erreur est survenue')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
      },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-[var(--bg-primary)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-lg)] border border-[var(--border)] p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">
            Vérifiez votre email
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Un email de confirmation a été envoyé à <strong>{email}</strong>. Cliquez sur le lien pour activer votre compte.
          </p>
          <Link href="/connexion">
            <Button variant="outline" className="w-full">
              Retour à la connexion
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--accent)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] to-[#1E40AF]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/20 rounded-[var(--radius-md)] flex items-center justify-center font-bold text-[16px]">
              E
            </div>
            <span className="text-[20px] font-bold">EvalUp</span>
          </Link>

          <div>
            <h1 className="text-[40px] font-bold leading-tight mb-4">
              Commencez gratuitement
            </h1>
            <p className="text-white/70 text-lg max-w-md">
              Créez votre compte en quelques secondes et obtenez votre première évaluation gratuite.
            </p>

            <div className="mt-8 space-y-4">
              {[
                'Évaluation Flash gratuite',
                'Données sécurisées',
                'Rapport PDF professionnel',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/50 text-sm">
            2024 POSSE. Tous droits réservés.
          </p>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-white/10 rounded-full" />
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/5 rounded-full" />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 bg-[var(--accent)] rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-[16px]">
                E
              </div>
              <span className="text-[20px] font-bold text-[var(--text-primary)]">
                Eval<span className="text-[var(--accent)]">Up</span>
              </span>
            </Link>
          </div>

          <div className="bg-[var(--bg-primary)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-lg)] border border-[var(--border)] p-8">
            <div className="text-center mb-8">
              <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">
                Créer un compte
              </h2>
              <p className="text-[var(--text-secondary)]">
                Inscrivez-vous pour commencer votre évaluation
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

              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="8 caractères minimum"
                required
              />

              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={confirmPassword && password !== confirmPassword ? 'Les mots de passe ne correspondent pas' : undefined}
                required
              />

              <div className="text-sm">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-[var(--border)] mt-0.5" required />
                  <span className="text-[var(--text-secondary)]">
                    J&apos;accepte les{' '}
                    <Link href="/cgu" className="text-[var(--accent)] hover:underline">CGU</Link>
                    {' '}et la{' '}
                    <Link href="/privacy" className="text-[var(--accent)] hover:underline">politique de confidentialité</Link>
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Créer mon compte
              </Button>
            </form>

            {/* TODO: Reactiver quand Google OAuth sera configure dans GCP
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[var(--bg-primary)] text-[var(--text-muted)]">
                  ou continuer avec
                </span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignup} type="button">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
            */}

            <p className="text-center text-[var(--text-secondary)] text-sm mt-6">
              Déjà un compte ?{' '}
              <Link href="/connexion" className="text-[var(--accent)] font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    }>
      <InscriptionForm />
    </Suspense>
  )
}
