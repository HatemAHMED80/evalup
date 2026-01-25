'use client'

import { useState } from 'react'
import {
  QUESTIONS_QUALITATIVES,
  NOMS_CATEGORIES,
  type QuestionQualitative,
  type ReponseQualitative,
  type CategorieQuestion,
} from '@/lib/scoring-qualitatif'

interface QualitativeQuestionnaireProps {
  onComplete: (reponses: ReponseQualitative[]) => void
  onSkip: () => void
}

// Grouper les questions par catégorie
const questionsParCategorie = QUESTIONS_QUALITATIVES.reduce((acc, q) => {
  if (!acc[q.categorie]) {
    acc[q.categorie] = []
  }
  acc[q.categorie].push(q)
  return acc
}, {} as Record<CategorieQuestion, QuestionQualitative[]>)

const categories = Object.keys(questionsParCategorie) as CategorieQuestion[]

export default function QualitativeQuestionnaire({
  onComplete,
  onSkip,
}: QualitativeQuestionnaireProps) {
  const [currentCategorieIndex, setCurrentCategorieIndex] = useState(0)
  const [reponses, setReponses] = useState<Record<string, number>>({})

  const currentCategorie = categories[currentCategorieIndex]
  const questions = questionsParCategorie[currentCategorie]
  const isLastCategorie = currentCategorieIndex === categories.length - 1
  const isFirstCategorie = currentCategorieIndex === 0

  // Vérifier si toutes les questions de la catégorie actuelle sont répondues
  const allCurrentAnswered = questions.every(q => reponses[q.id] !== undefined)

  // Compter le nombre total de réponses
  const totalReponses = Object.keys(reponses).length
  const totalQuestions = QUESTIONS_QUALITATIVES.length
  const progressPct = Math.round((totalReponses / totalQuestions) * 100)

  const handleReponse = (questionId: string, valeur: number) => {
    setReponses(prev => ({ ...prev, [questionId]: valeur }))
  }

  const handleNext = () => {
    if (isLastCategorie) {
      // Convertir en tableau de ReponseQualitative
      const reponsesArray: ReponseQualitative[] = Object.entries(reponses).map(
        ([questionId, valeur]) => ({ questionId, valeur })
      )
      onComplete(reponsesArray)
    } else {
      setCurrentCategorieIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstCategorie) {
      setCurrentCategorieIndex(prev => prev - 1)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-[#1e3a5f]">
            Scoring Qualitatif
          </h2>
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Passer cette étape
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Ces questions permettent d&apos;affiner l&apos;évaluation en fonction de critères non-financiers.
        </p>
      </div>

      {/* Barre de progression */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{totalReponses} / {totalQuestions} questions</span>
          <span>{progressPct}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#10b981] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Navigation par catégorie */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat, index) => {
          const questionsCategorie = questionsParCategorie[cat]
          const nbRepondues = questionsCategorie.filter(q => reponses[q.id] !== undefined).length
          const isComplete = nbRepondues === questionsCategorie.length
          const isCurrent = index === currentCategorieIndex

          return (
            <button
              key={cat}
              onClick={() => setCurrentCategorieIndex(index)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                isCurrent
                  ? 'bg-[#1e3a5f] text-white'
                  : isComplete
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {NOMS_CATEGORIES[cat]}
              {isComplete && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {/* Questions de la catégorie */}
      <div className="space-y-6">
        {questions.map((question, qIndex) => (
          <div key={question.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
            <div className="mb-3">
              <p className="font-medium text-gray-800">
                {qIndex + 1}. {question.question}
              </p>
              {question.description && (
                <p className="text-sm text-gray-500 mt-1">{question.description}</p>
              )}
            </div>
            <div className="space-y-2">
              {question.options.map(option => {
                const isSelected = reponses[question.id] === option.valeur
                return (
                  <button
                    key={option.valeur}
                    onClick={() => handleReponse(question.id, option.valeur)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 ring-2 ring-[#1e3a5f]/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#1e3a5f]' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-[#1e3a5f]" />
                        )}
                      </div>
                      <span className={isSelected ? 'text-[#1e3a5f] font-medium' : 'text-gray-700'}>
                        {option.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handlePrevious}
          disabled={isFirstCategorie}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isFirstCategorie
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Précédent
        </button>
        <button
          onClick={handleNext}
          disabled={!allCurrentAnswered}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            allCurrentAnswered
              ? 'bg-[#1e3a5f] text-white hover:bg-[#2d5a8f]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLastCategorie ? 'Voir les résultats' : 'Suivant'}
        </button>
      </div>
    </div>
  )
}
