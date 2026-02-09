'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'

export default function ComptePage() {
  const [fullName, setFullName] = useState('Jean Dupont')
  const [email, setEmail] = useState('jean.dupont@exemple.com')
  const [company, setCompany] = useState('Ma Societe SAS')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
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
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Input
              label="Entreprise"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={isLoading}>
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
              <p className="text-[13px] text-[var(--text-secondary)]">Derniere modification il y a 3 mois</p>
            </div>
            <Button variant="outline" size="sm">Modifier</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Authentification a deux facteurs</p>
              <p className="text-[13px] text-[var(--text-secondary)]">Non activee</p>
            </div>
            <Button variant="outline" size="sm">Activer</Button>
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
              <p className="text-[13px] text-[var(--text-secondary)]">Cette action est irreversible</p>
            </div>
            <Button variant="danger" size="sm">Supprimer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
