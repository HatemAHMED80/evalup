// Page d'inscription acheteur - Formulaire multi-étapes

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SECTEURS } from '@/lib/secteurs'
import { REGIONS } from '@/lib/types'
import { calculerScoreAcheteur, getGradeColor, getGradeLabel, type ProfilAcheteur } from '@/lib/scoring-acheteur'
import type { Disponibilite, DelaiReprise, Accompagnement } from '@/lib/database.types'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 'result'

const STEPS = [
  { num: 1, title: 'Identité' },
  { num: 2, title: 'Finances' },
  { num: 3, title: 'Expérience' },
  { num: 4, title: 'Projet' },
  { num: 5, title: 'Critères' },
  { num: 6, title: 'Motivation' },
]

export default function InscriptionAcheteurPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1)

  // État du formulaire
  const [formData, setFormData] = useState({
    // Étape 1 : Identité
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    ville: '',

    // Étape 2 : Capacité financière
    apport_personnel: '',
    capacite_emprunt: '',
    preuve_fonds_validee: false,

    // Étape 3 : Expérience
    annees_experience_gestion: 0,
    poste_actuel: '',
    secteurs_expertise: [] as string[],
    a_deja_repris: false,
    diplome: '',

    // Étape 4 : Projet
    accompagne_par: '' as Accompagnement | '',
    disponibilite: '' as Disponibilite | '',
    delai_reprise: '' as DelaiReprise | '',

    // Étape 5 : Critères
    secteurs_souhaites: [] as string[],
    ca_min: '',
    ca_max: '',
    regions: [] as string[],
    accepte_relocalisation: false,
    prix_max: '',
    type_reprise: [] as string[],

    // Étape 6 : Motivation
    pitch: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleMultiSelect = (name: string, value: string) => {
    setFormData(prev => {
      const currentValues = prev[name as keyof typeof prev] as string[]
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value]
      return { ...prev, [name]: newValues }
    })
  }

  const nextStep = () => {
    if (currentStep === 6) {
      setCurrentStep('result')
    } else if (typeof currentStep === 'number') {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const prevStep = () => {
    if (currentStep === 'result') {
      setCurrentStep(6)
    } else if (typeof currentStep === 'number' && currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  // Calculer le score pour la page de résultat
  const calculateScore = () => {
    const profil: ProfilAcheteur = {
      apport_personnel: parseFloat(formData.apport_personnel) || 0,
      capacite_emprunt: parseFloat(formData.capacite_emprunt) || null,
      preuve_fonds_validee: formData.preuve_fonds_validee,
      annees_experience_gestion: formData.annees_experience_gestion,
      secteurs_expertise: formData.secteurs_expertise,
      a_deja_repris: formData.a_deja_repris,
      diplome: formData.diplome || null,
      accompagne_par: formData.accompagne_par as Accompagnement || null,
      disponibilite: (formData.disponibilite as Disponibilite) || 'partiel',
      delai_reprise: (formData.delai_reprise as DelaiReprise) || '12_mois',
      pitch: formData.pitch || null,
    }
    return calculerScoreAcheteur(profil)
  }

  // Rendu de la page de résultat
  if (currentStep === 'result') {
    const score = calculateScore()
    const gradeColor = getGradeColor(score.grade)

    return (
      <div className="min-h-screen py-12 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="card p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="heading-2 text-[#1e3a5f] mb-2">Votre profil acheteur</h1>
              <p className="text-gray-600">Voici votre score et les prochaines étapes</p>
            </div>

            {/* Score Card */}
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] rounded-xl p-8 text-white text-center mb-8">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold mx-auto mb-4"
                style={{ backgroundColor: gradeColor }}
              >
                {score.grade}
              </div>
              <p className="text-2xl font-bold mb-1">{score.total}/100</p>
              <p className="text-white/80">{getGradeLabel(score.grade)}</p>
            </div>

            {/* Détail du score */}
            <div className="space-y-4 mb-8">
              <h3 className="font-semibold text-gray-900">Détail de votre score</h3>

              {Object.entries(score.details).map(([key, detail]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-700 capitalize">{key.replace('_', ' ')}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#10b981] rounded-full"
                        style={{ width: `${(detail.score / detail.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-16 text-right">
                      {detail.score}/{detail.max}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Conseils d'amélioration */}
            {score.conseils_amelioration.length > 0 && (
              <div className="bg-[#c9a227]/10 rounded-lg p-4 mb-8 border border-[#c9a227]/20">
                <h4 className="font-medium text-[#c9a227] mb-2">Conseils pour améliorer votre score</h4>
                <ul className="space-y-1">
                  {score.conseils_amelioration.map((conseil, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {conseil}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="btn-outline-dark w-full"
              >
                Modifier mon profil
              </button>
              <Link
                href="/"
                className="btn-success w-full text-center"
              >
                Terminer (sans Supabase)
              </Link>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              Note : L&apos;enregistrement en base de données nécessite la configuration de Supabase.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/acheteur"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#1e3a5f] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className={`flex flex-col items-center ${
                  typeof currentStep === 'number' && step.num <= currentStep ? 'text-[#1e3a5f]' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    typeof currentStep === 'number' && step.num <= currentStep
                      ? 'bg-[#1e3a5f] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.num}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-[#1e3a5f] rounded-full transition-all duration-300"
              style={{ width: `${(typeof currentStep === 'number' ? currentStep : 6) / 6 * 100}%` }}
            />
          </div>
        </div>

        {/* Formulaire */}
        <div className="card p-8 shadow-xl">
          {/* Étape 1 : Identité */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">Vos coordonnées</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                  <input type="text" id="prenom" name="prenom" value={formData.prenom} onChange={handleChange} required className="input-evalup" />
                </div>
                <div>
                  <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                  <input type="text" id="nom" name="nom" value={formData.nom} onChange={handleChange} required className="input-evalup" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="input-evalup" />
              </div>

              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                <input type="tel" id="telephone" name="telephone" value={formData.telephone} onChange={handleChange} required className="input-evalup" />
              </div>

              <div>
                <label htmlFor="ville" className="block text-sm font-medium text-gray-700 mb-2">Ville actuelle *</label>
                <input type="text" id="ville" name="ville" value={formData.ville} onChange={handleChange} required className="input-evalup" />
              </div>
            </div>
          )}

          {/* Étape 2 : Capacité financière */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">Votre capacité financière</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apport personnel disponible *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: '25000', label: '< 50 000 €' },
                    { value: '100000', label: '50 - 150k €' },
                    { value: '225000', label: '150 - 300k €' },
                    { value: '400000', label: '300 - 500k €' },
                    { value: '750000', label: '> 500 000 €' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.apport_personnel === option.value
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                          : 'border-gray-200 hover:border-[#c9a227]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="apport_personnel"
                        value={option.value}
                        checked={formData.apport_personnel === option.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="capacite_emprunt" className="block text-sm font-medium text-gray-700 mb-2">Capacité d&apos;emprunt estimée (optionnel)</label>
                <input type="number" id="capacite_emprunt" name="capacite_emprunt" value={formData.capacite_emprunt} onChange={handleChange} placeholder="Ex: 300000" className="input-evalup" />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="preuve_fonds_validee"
                    checked={formData.preuve_fonds_validee}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                  />
                  <span className="text-gray-700">Je peux fournir une attestation de fonds</span>
                </label>
              </div>
            </div>
          )}

          {/* Étape 3 : Expérience */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">Votre expérience</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Années d&apos;expérience en gestion/direction *</label>
                <input
                  type="range"
                  name="annees_experience_gestion"
                  min="0"
                  max="20"
                  value={formData.annees_experience_gestion}
                  onChange={handleChange}
                  className="w-full accent-[#1e3a5f]"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0 ans</span>
                  <span className="font-medium text-[#1e3a5f]">{formData.annees_experience_gestion} ans</span>
                  <span>20+ ans</span>
                </div>
              </div>

              <div>
                <label htmlFor="poste_actuel" className="block text-sm font-medium text-gray-700 mb-2">Poste actuel *</label>
                <input type="text" id="poste_actuel" name="poste_actuel" value={formData.poste_actuel} onChange={handleChange} placeholder="Ex: Directeur commercial" required className="input-evalup" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secteurs d&apos;expertise (plusieurs choix possibles)</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {SECTEURS.map((secteur) => (
                    <label
                      key={secteur.code}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer text-sm transition-colors ${
                        formData.secteurs_expertise.includes(secteur.code)
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                          : 'border-gray-200 hover:border-[#c9a227]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.secteurs_expertise.includes(secteur.code)}
                        onChange={() => handleMultiSelect('secteurs_expertise', secteur.code)}
                        className="sr-only"
                      />
                      <span className="text-gray-700">{secteur.nom}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="a_deja_repris"
                    checked={formData.a_deja_repris}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                  />
                  <span className="text-gray-700">J&apos;ai déjà repris ou créé une entreprise</span>
                </label>
              </div>

              <div>
                <label htmlFor="diplome" className="block text-sm font-medium text-gray-700 mb-2">Formation (optionnel)</label>
                <input type="text" id="diplome" name="diplome" value={formData.diplome} onChange={handleChange} placeholder="Ex: MBA, Ingénieur..." className="input-evalup" />
              </div>
            </div>
          )}

          {/* Étape 4 : Projet */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">Votre projet de reprise</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Êtes-vous accompagné ? *</label>
                <div className="space-y-2">
                  {[
                    { value: 'cabinet_ma', label: 'Oui, par un cabinet M&A / CRA' },
                    { value: 'avocat', label: 'Oui, par un avocat' },
                    { value: 'expert_comptable', label: 'Oui, par un expert-comptable' },
                    { value: 'autre', label: 'Oui, autre accompagnement' },
                    { value: 'aucun', label: 'Non, pas encore' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.accompagne_par === option.value
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                          : 'border-gray-200 hover:border-[#c9a227]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="accompagne_par"
                        value={option.value}
                        checked={formData.accompagne_par === option.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Votre disponibilité *</label>
                <div className="space-y-2">
                  {[
                    { value: 'temps_plein', label: 'Disponible immédiatement (temps plein)' },
                    { value: 'partiel', label: 'Je peux me libérer rapidement (préavis)' },
                    { value: 'apres_vente', label: 'Je gèrerai en parallèle de mon activité' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.disponibilite === option.value
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                          : 'border-gray-200 hover:border-[#c9a227]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="disponibilite"
                        value={option.value}
                        checked={formData.disponibilite === option.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Délai de reprise souhaité *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'immediat', label: 'Dès que possible' },
                    { value: '6_mois', label: 'Sous 6 mois' },
                    { value: '12_mois', label: 'Sous 12 mois' },
                    { value: '24_mois', label: '12-24 mois' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.delai_reprise === option.value
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                          : 'border-gray-200 hover:border-[#c9a227]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delai_reprise"
                        value={option.value}
                        checked={formData.delai_reprise === option.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Étape 5 : Critères de recherche */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">Vos critères de recherche</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secteurs d&apos;activité recherchés *</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {SECTEURS.map((secteur) => (
                    <label
                      key={secteur.code}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer text-sm transition-colors ${
                        formData.secteurs_souhaites.includes(secteur.code)
                          ? 'border-[#10b981] bg-[#10b981]/5'
                          : 'border-gray-200 hover:border-[#c9a227]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.secteurs_souhaites.includes(secteur.code)}
                        onChange={() => handleMultiSelect('secteurs_souhaites', secteur.code)}
                        className="sr-only"
                      />
                      <span className="text-gray-700">{secteur.nom}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ca_min" className="block text-sm font-medium text-gray-700 mb-2">CA minimum (€)</label>
                  <input type="number" id="ca_min" name="ca_min" value={formData.ca_min} onChange={handleChange} placeholder="Ex: 500000" className="input-evalup" />
                </div>
                <div>
                  <label htmlFor="ca_max" className="block text-sm font-medium text-gray-700 mb-2">CA maximum (€)</label>
                  <input type="number" id="ca_max" name="ca_max" value={formData.ca_max} onChange={handleChange} placeholder="Ex: 2000000" className="input-evalup" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Régions souhaitées</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {REGIONS.map((region) => (
                    <label
                      key={region}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer text-sm transition-colors ${
                        formData.regions.includes(region)
                          ? 'border-[#10b981] bg-[#10b981]/5'
                          : 'border-gray-200 hover:border-[#c9a227]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.regions.includes(region)}
                        onChange={() => handleMultiSelect('regions', region)}
                        className="sr-only"
                      />
                      <span className="text-gray-700">{region}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="accepte_relocalisation"
                    checked={formData.accepte_relocalisation}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-[#10b981] focus:ring-[#10b981]"
                  />
                  <span className="text-gray-700">J&apos;accepte de me relocaliser</span>
                </label>
              </div>

              <div>
                <label htmlFor="prix_max" className="block text-sm font-medium text-gray-700 mb-2">Budget maximum d&apos;acquisition (€) *</label>
                <input type="number" id="prix_max" name="prix_max" value={formData.prix_max} onChange={handleChange} placeholder="Ex: 500000" required className="input-evalup" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de reprise envisagé</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: '100%', label: 'Rachat 100%' },
                    { value: 'majoritaire', label: 'Majoritaire' },
                    { value: 'minoritaire', label: 'Minoritaire' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer text-sm transition-colors ${
                        formData.type_reprise.includes(option.value)
                          ? 'border-[#10b981] bg-[#10b981]/5'
                          : 'border-gray-200 hover:border-[#c9a227]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.type_reprise.includes(option.value)}
                        onChange={() => handleMultiSelect('type_reprise', option.value)}
                        className="sr-only"
                      />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Étape 6 : Motivation */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-6">Votre motivation</h2>

              <div>
                <label htmlFor="pitch" className="block text-sm font-medium text-gray-700 mb-2">
                  Présentez votre projet en quelques lignes *
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Expliquez vos motivations, ce que vous recherchez et ce que vous pouvez apporter à une entreprise.
                </p>
                <textarea
                  id="pitch"
                  name="pitch"
                  value={formData.pitch}
                  onChange={handleChange}
                  rows={6}
                  minLength={100}
                  required
                  placeholder="Dirigeant expérimenté avec 15 ans dans le commerce B2B, je recherche une entreprise saine à développer sur le long terme. Mon expertise en développement commercial et ma connaissance du marché local me permettront d'accompagner la croissance..."
                  className="input-evalup"
                />
                <p className={`text-sm mt-1 ${formData.pitch.length >= 100 ? 'text-[#10b981]' : 'text-gray-500'}`}>
                  {formData.pitch.length}/100 caractères minimum
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Précédent
            </button>

            <button
              type="button"
              onClick={nextStep}
              className="btn-secondary"
            >
              {currentStep === 6 ? 'Voir mon score' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
