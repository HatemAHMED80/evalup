'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import type { ProfileUpdate } from '@/lib/database.types'

export default function ComptePage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      setEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name')
        .eq('id', user.id)
        .single() as { data: { full_name: string | null; company_name: string | null } | null }

      if (profile) {
        setFullName(profile.full_name || '')
        setCompany(profile.company_name || '')
      }
      setIsLoading(false)
    }
    loadProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const updateData: ProfileUpdate = {
      full_name: fullName,
      company_name: company,
      updated_at: new Date().toISOString(),
    }
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData as never)
      .eq('id', user.id)

    setIsSaving(false)
    if (updateError) {
      setError('Erreur lors de la sauvegarde')
    } else {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  const handlePasswordReset = async () => {
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (!resetError) {
      alert('Un email de reinitialisation a ete envoye a ' + email)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Mon profil</h1>
          <p className="text-[var(--text-secondary)] mt-1">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-[var(--text-primary)]">Mon profil</h1>
        <p className="text-[var(--text-secondary)] mt-1">Gerez vos informations personnelles</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold">Informations personnelles</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                disabled
                className="opacity-60"
              />
            </div>
            <Input
              label="Entreprise"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            {error && (
              <p className="text-[13px] text-[var(--danger)]">{error}</p>
            )}
            {saveSuccess && (
              <p className="text-[13px] text-[var(--success)]">Modifications enregistrees</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" isLoading={isSaving}>
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-[16px] font-semibold">Securite</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Mot de passe</p>
              <p className="text-[13px] text-[var(--text-secondary)]">Envoyer un email de reinitialisation</p>
            </div>
            <Button variant="outline" size="sm" onClick={handlePasswordReset}>
              Reinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--danger)]/20">
        <CardHeader>
          <h2 className="text-[16px] font-semibold text-[var(--danger)]">Zone dangereuse</h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Supprimer mon compte</p>
              <p className="text-[13px] text-[var(--text-secondary)]">Contactez-nous a contact@evalup.fr</p>
            </div>
            <Button variant="danger" size="sm" asChild>
              <a href="mailto:contact@evalup.fr?subject=Suppression de compte">Contacter</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
