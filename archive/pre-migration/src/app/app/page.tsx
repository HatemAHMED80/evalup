'use client'

import { useState } from 'react'
import { SimpleHeader } from '../../components/layout/Header'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'

export default function AppPage() {
  const [siren, setSiren] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic SIREN validation
    const cleanSiren = siren.replace(/\s/g, '')
    if (cleanSiren.length !== 9 && cleanSiren.length !== 14) {
      setError('Le SIREN doit contenir 9 chiffres (ou 14 pour un SIRET)')
      return
    }

    setIsLoading(true)
    // Redirect to the chat interface
    window.location.href = `/chat/${cleanSiren.slice(0, 9)}`
  }

  return (
    <div className="flex flex-col h-full">
      <SimpleHeader
        title="Nouvelle évaluation"
        subtitle="Commencez par renseigner le SIREN de l'entreprise"
      />

      <div className="flex-1 flex items-center justify-center p-8">
        <Card
          variant="outlined"
          padding="lg"
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--accent-light)] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-2">
              Identifier l'entreprise
            </h2>
            <p className="text-[14px] text-[var(--text-secondary)]">
              Entrez le numéro SIREN ou SIRET de l'entreprise à valoriser
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="SIREN / SIRET"
              placeholder="Ex: 552 032 534"
              value={siren}
              onChange={(e) => setSiren(e.target.value)}
              error={error}
              hint="Le SIREN est un identifiant à 9 chiffres"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              isLoading={isLoading}
            >
              Lancer l'évaluation
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <p className="text-[12px] text-[var(--text-muted)] text-center">
              Nous récupérons automatiquement les données publiques disponibles
              (INSEE, Pappers, Infogreffe) pour pré-remplir l'analyse.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
