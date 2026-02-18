'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const supabase = createClient()

  // Echanger le code PKCE contre une session, ou verifier la session existante
  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setErrorMessage('Lien invalide ou expire. Veuillez demander un nouveau lien.')
        } else {
          setIsReady(true)
        }
        // Nettoyer l'URL
        window.history.replaceState({}, '', '/reset-password')
      } else {
        // Pas de code, verifier si une session existe deja
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setErrorMessage('Lien invalide ou expire. Veuillez demander un nouveau lien.')
        } else {
          setIsReady(true)
        }
      }
    }
    handleAuth()
  }, [supabase.auth])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setErrorMessage(error.message)
        setIsLoading(false)
        return
      }

      setSuccessMessage('Mot de passe mis a jour avec succes !')
      setTimeout(() => {
        router.push('/connexion')
      }, 2000)
    } catch {
      setErrorMessage('Une erreur est survenue. Veuillez reessayer.')
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
          {successMessage ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--success-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-2">
                Mot de passe modifie
              </h2>
              <p className="text-[var(--text-secondary)] mb-2">{successMessage}</p>
              <p className="text-[var(--text-muted)] text-sm">Redirection en cours...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-[24px] font-bold text-[var(--text-primary)] mb-2">
                  Nouveau mot de passe
                </h2>
                <p className="text-[var(--text-secondary)]">
                  Choisissez votre nouveau mot de passe
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-red-600 text-sm mb-6">
                  <p className="text-center">{errorMessage}</p>
                  {errorMessage.includes('expire') && (
                    <div className="mt-3 text-center">
                      <Link href="/mot-de-passe-oublie" className="text-[var(--accent)] font-medium hover:underline">
                        Demander un nouveau lien
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-[var(--text-muted)] -mt-2">Minimum 8 caracteres</p>

                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={!isReady || isLoading}
                >
                  Mettre a jour le mot de passe
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
