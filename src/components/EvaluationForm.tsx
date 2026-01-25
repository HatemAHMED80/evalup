'use client'

// Formulaire de saisie des données de l'entreprise avec auto-complétion SIREN
// et scoring qualitatif

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SECTEURS } from '@/lib/secteurs'
import { REGIONS } from '@/lib/types'
import QualitativeQuestionnaire from './QualitativeQuestionnaire'
import { type ReponseQualitative, serializeReponsesToParams } from '@/lib/scoring-qualitatif'

// Type pour la réponse de l'API entreprise
interface EntrepriseApiResponse {
  success: boolean
  data?: {
    nom: string
    secteurEvalup: string | null
    chiffreAffaires: number | null
    resultatNet: number | null
    effectif: number | null
    anciennete: number
    region: string | null
  }
  error?: string
  configured?: boolean
}

type Step = 'form' | 'qualitative'

export default function EvaluationForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('form')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  // État du formulaire
  const [siren, setSiren] = useState('')
  const [formData, setFormData] = useState({
    nom: '',
    secteur: '',
    chiffreAffaires: '',
    ebitda: '',
    nombreEmployes: '',
    anciennete: '',
    localisation: '',
  })

  // Gestion des changements
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Recherche d'entreprise par SIREN
  const rechercherEntreprise = async () => {
    if (!siren.trim()) {
      setSearchMessage({ type: 'error', text: 'Veuillez entrer un numéro SIREN ou SIRET' })
      return
    }

    // Nettoyer le numéro
    const numero = siren.replace(/[\s-]/g, '')
    if (!/^\d{9}$/.test(numero) && !/^\d{14}$/.test(numero)) {
      setSearchMessage({ type: 'error', text: 'Format invalide. Entrez 9 chiffres (SIREN) ou 14 chiffres (SIRET)' })
      return
    }

    setIsSearching(true)
    setSearchMessage(null)

    try {
      const response = await fetch(`/api/entreprise/${numero}`)
      const result: EntrepriseApiResponse = await response.json()

      if (!response.ok) {
        if (result.configured === false) {
          setSearchMessage({
            type: 'info',
            text: 'API Pappers non configurée. Remplissez le formulaire manuellement.',
          })
        } else {
          setSearchMessage({ type: 'error', text: result.error || 'Erreur lors de la recherche' })
        }
        return
      }

      if (result.success && result.data) {
        const data = result.data

        // Pré-remplir le formulaire
        setFormData({
          nom: data.nom || '',
          secteur: data.secteurEvalup || '',
          chiffreAffaires: data.chiffreAffaires?.toString() || '',
          ebitda: data.resultatNet?.toString() || '',
          nombreEmployes: data.effectif?.toString() || '',
          anciennete: data.anciennete?.toString() || '',
          localisation: data.region || '',
        })

        setSearchMessage({
          type: 'success',
          text: `Données récupérées pour "${data.nom}". Vérifiez et complétez si nécessaire.`,
        })
      }
    } catch {
      setSearchMessage({ type: 'error', text: 'Erreur de connexion au serveur' })
    } finally {
      setIsSearching(false)
    }
  }

  // Passer à l'étape qualitative
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep('qualitative')
  }

  // Navigation vers les résultats avec les réponses qualitatives
  const navigateToResults = (qualitativeReponses?: ReponseQualitative[]) => {
    setIsLoading(true)

    // Création des paramètres URL pour passer les données à la page résultats
    const params = new URLSearchParams({
      nom: formData.nom,
      secteur: formData.secteur,
      ca: formData.chiffreAffaires,
      ebitda: formData.ebitda,
      employes: formData.nombreEmployes,
      anciennete: formData.anciennete,
      localisation: formData.localisation,
    })

    // Ajouter les réponses qualitatives si présentes
    if (qualitativeReponses && qualitativeReponses.length > 0) {
      const qualParams = serializeReponsesToParams(qualitativeReponses)
      for (const [key, value] of Object.entries(qualParams)) {
        params.append(key, value)
      }
    }

    // Navigation vers la page de résultats
    router.push(`/resultats?${params.toString()}`)
  }

  // Gestion de la fin du questionnaire qualitatif
  const handleQualitativeComplete = (reponses: ReponseQualitative[]) => {
    navigateToResults(reponses)
  }

  // Passer le questionnaire qualitatif
  const handleQualitativeSkip = () => {
    navigateToResults()
  }

  // Style commun pour les inputs
  const inputStyle = `
    w-full px-4 py-3 rounded-lg border border-gray-300
    focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent
    transition-all duration-200 outline-none
  `

  const labelStyle = 'block text-sm font-medium text-gray-700 mb-2'

  // Affichage du questionnaire qualitatif
  if (currentStep === 'qualitative') {
    return (
      <div>
        {/* Indicateur d'étape */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setCurrentStep('form')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#1e3a5f] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au formulaire
          </button>
        </div>

        {/* Résumé de l'entreprise */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            Entreprise : <span className="font-semibold text-[#1e3a5f]">{formData.nom}</span>
          </p>
        </div>

        <QualitativeQuestionnaire
          onComplete={handleQualitativeComplete}
          onSkip={handleQualitativeSkip}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Recherche par SIREN */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <label htmlFor="siren" className="block text-sm font-medium text-[#1e3a5f] mb-2">
          Recherche rapide par SIREN/SIRET (optionnel)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="siren"
            value={siren}
            onChange={e => setSiren(e.target.value)}
            placeholder="Ex: 443061841 ou 44306184100047"
            className={`${inputStyle} flex-1`}
          />
          <button
            type="button"
            onClick={rechercherEntreprise}
            disabled={isSearching}
            className={`
              px-4 py-3 rounded-lg font-medium text-white
              bg-[#1e3a5f] hover:bg-[#2d5a8f]
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              whitespace-nowrap
            `}
          >
            {isSearching ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              'Rechercher'
            )}
          </button>
        </div>
        {searchMessage && (
          <p
            className={`mt-2 text-sm ${
              searchMessage.type === 'success'
                ? 'text-green-600'
                : searchMessage.type === 'error'
                ? 'text-red-600'
                : 'text-blue-600'
            }`}
          >
            {searchMessage.text}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Entrez un SIREN ou SIRET pour pré-remplir automatiquement le formulaire
        </p>
      </div>

      {/* Séparateur */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">ou remplissez manuellement</span>
        </div>
      </div>

      {/* Nom de l'entreprise */}
      <div>
        <label htmlFor="nom" className={labelStyle}>
          Nom de l&apos;entreprise
        </label>
        <input
          type="text"
          id="nom"
          name="nom"
          value={formData.nom}
          onChange={handleChange}
          required
          placeholder="Ex: Ma Super Entreprise"
          className={inputStyle}
        />
      </div>

      {/* Secteur d'activité */}
      <div>
        <label htmlFor="secteur" className={labelStyle}>
          Secteur d&apos;activité
        </label>
        <select
          id="secteur"
          name="secteur"
          value={formData.secteur}
          onChange={handleChange}
          required
          className={inputStyle}
        >
          <option value="">Sélectionnez un secteur</option>
          {SECTEURS.map(secteur => (
            <option key={secteur.code} value={secteur.code}>
              {secteur.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Chiffre d'affaires et EBITDA sur la même ligne */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="chiffreAffaires" className={labelStyle}>
            Chiffre d&apos;affaires annuel (€)
          </label>
          <input
            type="number"
            id="chiffreAffaires"
            name="chiffreAffaires"
            value={formData.chiffreAffaires}
            onChange={handleChange}
            required
            min="0"
            placeholder="Ex: 1000000"
            className={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="ebitda" className={labelStyle}>
            EBITDA / Résultat net (€)
          </label>
          <input
            type="number"
            id="ebitda"
            name="ebitda"
            value={formData.ebitda}
            onChange={handleChange}
            required
            placeholder="Ex: 150000"
            className={inputStyle}
          />
        </div>
      </div>

      {/* Employés et ancienneté sur la même ligne */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nombreEmployes" className={labelStyle}>
            Nombre d&apos;employés
          </label>
          <input
            type="number"
            id="nombreEmployes"
            name="nombreEmployes"
            value={formData.nombreEmployes}
            onChange={handleChange}
            required
            min="1"
            placeholder="Ex: 10"
            className={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="anciennete" className={labelStyle}>
            Ancienneté (années)
          </label>
          <input
            type="number"
            id="anciennete"
            name="anciennete"
            value={formData.anciennete}
            onChange={handleChange}
            required
            min="0"
            placeholder="Ex: 5"
            className={inputStyle}
          />
        </div>
      </div>

      {/* Localisation */}
      <div>
        <label htmlFor="localisation" className={labelStyle}>
          Localisation (région)
        </label>
        <select
          id="localisation"
          name="localisation"
          value={formData.localisation}
          onChange={handleChange}
          required
          className={inputStyle}
        >
          <option value="">Sélectionnez une région</option>
          {REGIONS.map(region => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      {/* Bouton de soumission */}
      <button
        type="submit"
        disabled={isLoading}
        className={`
          w-full py-4 px-6 rounded-lg font-semibold text-lg
          bg-[#10b981] hover:bg-[#059669] text-white
          transition-all duration-200 transform hover:scale-[1.02]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          shadow-lg hover:shadow-xl
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Chargement...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Continuer vers le scoring qualitatif
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </button>
    </form>
  )
}
