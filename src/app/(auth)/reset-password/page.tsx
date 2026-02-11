'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const supabase = createClient()

  // Verifier que l'utilisateur a un token valide
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setErrorMessage('Lien invalide ou expire. Veuillez demander un nouveau lien.')
      }
    }
    checkSession()
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
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères')
      setIsLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    setSuccessMessage('Mot de passe mis a jour avec succes !')
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }

  if (successMessage) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Mot de passe modifie</h2>
          <p className="text-white/60">{successMessage}</p>
          <p className="text-white/40 text-sm mt-2">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Nouveau mot de passe
        </h1>
        <p className="text-white/60 text-center mb-8">
          Choisissez votre nouveau mot de passe
        </p>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
            <p className="text-red-400 text-sm text-center">{errorMessage}</p>
            {errorMessage.includes('expire') && (
              <div className="mt-3 text-center">
                <Link href="/mot-de-passe-oublie" className="text-[#c9a227] hover:underline text-sm">
                  Demander un nouveau lien
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20"
              placeholder="••••••••"
            />
            <p className="text-xs text-white/40 mt-1">Minimum 8 caracteres</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-2">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#c9a227] text-[#1a1a2e] font-semibold py-3 px-4 rounded-xl hover:bg-[#e8c547] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
