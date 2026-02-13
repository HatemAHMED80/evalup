'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ARCHETYPES } from '@/lib/valuation/archetypes'
import { createClient } from '@/lib/supabase/client'
import { trackConversion } from '@/lib/analytics'

// ---------------------------------------------------------------------------
// Inner form (needs useSearchParams → must be inside Suspense)
// ---------------------------------------------------------------------------

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const archetypeId = searchParams.get('archetype') || ''
  const archetype = ARCHETYPES[archetypeId] || null

  const resultUrl = `/diagnostic/result?archetype=${encodeURIComponent(archetypeId)}`

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Mode connexion : signInWithPassword directement
      if (isLoginMode) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Email ou mot de passe incorrect')
          } else {
            setError(signInError.message)
          }
          return
        }

        if (signInData?.session) {
          setHasSession(true)
          setEmailSent(true)
          setTimeout(() => router.push(resultUrl), 1500)
        }
        return
      }

      // Mode inscription
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(resultUrl)}`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Cet email est déjà utilisé.')
          setIsLoginMode(true)
        } else if (authError.status === 429 || authError.message.includes('rate limit')) {
          setError('Trop de tentatives. Patientez quelques minutes ou connectez-vous si vous avez déjà un compte.')
          setIsLoginMode(true)
        } else {
          setError(authError.message)
        }
        return
      }

      const formRaw = sessionStorage.getItem('diagnostic_data')
      const hasSiren = formRaw ? JSON.parse(formRaw).siren?.replace(/\D/g, '').length === 9 : false
      trackConversion('signup_completed', { archetype_id: archetypeId, has_siren: hasSiren })

      // If signUp returned a session, user is already authenticated
      if (signUpData?.session) {
        setHasSession(true)
        setEmailSent(true)
        setTimeout(() => router.push(resultUrl), 1500)
        return
      }

      // No session from signUp — try signInWithPassword
      // (Supabase may allow login before email confirmation depending on project settings)
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInData?.session) {
        setHasSession(true)
        setEmailSent(true)
        setTimeout(() => router.push(resultUrl), 1500)
        return
      }

      // No session at all — email confirmation is required before login
      setEmailSent(true)
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(resultUrl)}`,
      },
    })
  }

  // ── Email sent confirmation ──────────────────────────────────────────────

  if (emailSent) {
    return (
      <div className="min-h-[calc(100vh-var(--nav-height))] bg-[var(--bg-secondary)] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-[var(--bg-primary)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-lg)] border border-[var(--border)] p-8 text-center space-y-4">
          {archetype && (
            <div
              className="w-16 h-16 mx-auto rounded-[var(--radius-xl)] flex items-center justify-center text-[32px]"
              style={{ backgroundColor: `${archetype.color}20` }}
            >
              {archetype.icon}
            </div>
          )}
          <div className="w-12 h-12 mx-auto bg-[var(--success-light)] rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-[var(--text-primary)]">
            Compte créé !
          </h2>
          {hasSession ? (
            <>
              <p className="text-[var(--text-secondary)] text-[14px]">
                Redirection vers votre diagnostic…
              </p>
              <div className="pt-2">
                <div className="w-6 h-6 mx-auto border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              </div>
            </>
          ) : (
            <>
              <p className="text-[var(--text-secondary)] text-[14px]">
                Un email de confirmation a été envoyé à <strong>{email}</strong>.
                <br />
                Cliquez sur le lien dans l'email pour accéder à votre diagnostic.
              </p>
              <button
                onClick={() => router.push(resultUrl)}
                className="text-[var(--accent)] hover:underline text-[14px] font-medium"
              >
                Voir un aperçu du diagnostic →
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Signup form ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-var(--nav-height))] bg-[var(--bg-secondary)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Archetype teaser */}
        <div className="text-center space-y-4">
          {archetype ? (
            <>
              <div
                className="w-20 h-20 mx-auto rounded-[var(--radius-xl)] flex items-center justify-center text-[40px] shadow-[var(--shadow-md)]"
                style={{ backgroundColor: `${archetype.color}20`, border: `2px solid ${archetype.color}40` }}
              >
                {archetype.icon}
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--accent)] uppercase tracking-wide">
                  Votre profil
                </p>
                <h1 className="text-[24px] font-bold text-[var(--text-primary)] mt-1">
                  {archetype.name}
                </h1>
              </div>
            </>
          ) : (
            <h1 className="text-[24px] font-bold text-[var(--text-primary)]">
              Votre diagnostic
            </h1>
          )}
          <p className="text-[var(--text-secondary)]">
            {isLoginMode
              ? 'Connectez-vous pour accéder à votre diagnostic.'
              : 'Votre diagnostic est prêt. Créez un compte pour le consulter.'}
          </p>
        </div>

        {/* Form card */}
        <div className="bg-[var(--bg-primary)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-lg)] border border-[var(--border)] p-8">
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
              hint={isLoginMode ? undefined : '8 caractères minimum'}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {isLoginMode ? 'Se connecter →' : 'Voir mon diagnostic →'}
            </Button>
          </form>

          {/* Google OAuth separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--bg-primary)] text-[var(--text-muted)]">
                ou
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
            Continuer avec Google
          </Button>

          {/* Toggle login/signup */}
          <p className="text-center text-[var(--text-secondary)] text-[14px] mt-6">
            {isLoginMode ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLoginMode(false); setError('') }}
                  className="text-[var(--accent)] font-medium hover:underline"
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                J&apos;ai déjà un compte{' '}
                <button
                  type="button"
                  onClick={() => { setIsLoginMode(true); setError('') }}
                  className="text-[var(--accent)] font-medium hover:underline"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>

        {/* Legal note */}
        <p className="text-center text-[12px] text-[var(--text-muted)]">
          En créant un compte, vous acceptez les{' '}
          <Link href="/cgu" className="hover:underline">CGU</Link>
          {' '}et la{' '}
          <Link href="/privacy" className="hover:underline">politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page wrapper (Suspense for useSearchParams)
// ---------------------------------------------------------------------------

export default function DiagnosticSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-var(--nav-height))] bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
