'use client'

import { useState, useMemo, use } from 'react'
import { Header } from '../../../../components/layout/Header'
import { ChatArea, Message } from '../../../../components/chat/ChatArea'
import { ChatInput } from '../../../../components/chat/ChatInput'
import { QuickReplies, QUICK_REPLIES } from '../../../../components/chat/QuickReplies'
import { DataCard } from '../../../../components/ui/DataCard'
import { ValuationResult } from '../../../../components/ui/ValuationResult'

// Mock database of companies
const MOCK_COMPANIES: Record<string, {
  name: string
  sector: string
  siren: string
  formeJuridique: string
  dateCreation: string
  naf: string
  siege: string
  ca: string
  caChange: string
  resultat: string
  resultatChange: string
  effectif: string
  capitauxPropres: string
  endettement: string
  margeEbitda: string
  margeChange: string
}> = {
  '1': {
    name: 'DANONE',
    sector: 'Agroalimentaire',
    siren: '552 032 534',
    formeJuridique: 'SA a conseil d\'administration',
    dateCreation: '1919',
    naf: '1051A - Fabrication de lait liquide',
    siege: 'Paris 9e (75)',
    ca: '27.6 Md€',
    caChange: '+4.2%',
    resultat: '1.1 Md€',
    resultatChange: '+15%',
    effectif: '96 000',
    capitauxPropres: '18.2 Md€',
    endettement: '11.4 Md€',
    margeEbitda: '14.2%',
    margeChange: '+0.8pts',
  },
  '2': {
    name: 'BOULANGERIE MARTIN',
    sector: 'Commerce de detail',
    siren: '823 456 789',
    formeJuridique: 'SARL',
    dateCreation: '2005',
    naf: '1071C - Boulangerie et patisserie',
    siege: 'Lyon 3e (69)',
    ca: '450 K€',
    caChange: '+8%',
    resultat: '45 K€',
    resultatChange: '+12%',
    effectif: '6',
    capitauxPropres: '120 K€',
    endettement: '80 K€',
    margeEbitda: '18%',
    margeChange: '+1.2pts',
  },
  '3': {
    name: 'TECHSOLUTIONS SAS',
    sector: 'Services informatiques',
    siren: '901 234 567',
    formeJuridique: 'SAS',
    dateCreation: '2018',
    naf: '6201Z - Programmation informatique',
    siege: 'Bordeaux (33)',
    ca: '2.1 M€',
    caChange: '+25%',
    resultat: '320 K€',
    resultatChange: '+35%',
    effectif: '18',
    capitauxPropres: '580 K€',
    endettement: '150 K€',
    margeEbitda: '22%',
    margeChange: '+3pts',
  },
}

const STEPS = [
  { id: 1, label: 'Objectif' },
  { id: 2, label: 'Activite' },
  { id: 3, label: 'Finances' },
  { id: 4, label: 'Equipe' },
  { id: 5, label: 'Marche' },
  { id: 6, label: 'Resultat' },
]

export default function EvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const company = MOCK_COMPANIES[id] || MOCK_COMPANIES['1']

  const initialMessage = useMemo(() => ({
    id: '1',
    role: 'assistant' as const,
    content: (
      <div>
        <p className="mb-4">
          Bonjour ! Je suis votre assistant EvalUp. Je vais vous aider a estimer la valeur de votre entreprise.
        </p>
        <p className="mb-3">
          J'ai recupere les informations publiques disponibles sur <strong>{company.name}</strong> :
        </p>
        <DataCard
          title="Informations legales"
          source="INSEE / Pappers"
          items={[
            { label: 'SIREN', value: company.siren },
            { label: 'Denomination', value: company.name },
            { label: 'Forme juridique', value: company.formeJuridique },
            { label: 'Date creation', value: company.dateCreation },
            { label: 'Secteur (NAF)', value: company.naf },
            { label: 'Siege social', value: company.siege },
          ]}
          className="mb-4"
        />
        <DataCard
          title="Donnees financieres (2023)"
          source="Pappers / Bilans"
          items={[
            { label: 'Chiffre d\'affaires', value: company.ca, change: { value: company.caChange, type: 'positive' as const } },
            { label: 'Resultat net', value: company.resultat, change: { value: company.resultatChange, type: 'positive' as const } },
            { label: 'Effectif', value: company.effectif },
            { label: 'Capitaux propres', value: company.capitauxPropres },
            { label: 'Endettement net', value: company.endettement },
            { label: 'Marge EBITDA', value: company.margeEbitda, change: { value: company.margeChange, type: 'positive' as const } },
          ]}
        />
        <p className="mt-4 font-medium text-[var(--text-primary)]">
          Pour adapter mon analyse, quel est l'objectif de cette valorisation ?
        </p>
      </div>
    ),
  }), [company])

  const [messages, setMessages] = useState<Message[]>([initialMessage])
  const [currentStep, setCurrentStep] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    }
    setMessages((prev) => [...prev, userMessage])
    setShowQuickReplies(false)

    // Simulate AI response
    setIsTyping(true)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getNextResponse(currentStep),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
      setCurrentStep((prev) => Math.min(prev + 1, 5))
      setShowQuickReplies(currentStep < 4)
    }, 1500)
  }

  const handleQuickReply = (reply: { id: string; label: string; value?: string }) => {
    handleSendMessage(reply.label)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with stepper */}
      <Header
        companyName={company.name}
        sector={company.sector}
        currentStep={currentStep}
        totalSteps={6}
        steps={STEPS}
      />

      {/* Chat Area */}
      <ChatArea
        messages={messages}
        isTyping={isTyping}
      />

      {/* Quick Replies */}
      {showQuickReplies && !isTyping && (
        <div className="px-8 pb-4">
          <div className="max-w-[var(--chat-max-width)] mx-auto">
            <QuickReplies
              replies={getQuickRepliesForStep(currentStep)}
              onSelect={handleQuickReply}
            />
          </div>
        </div>
      )}

      {/* Chat Input */}
      <ChatInput
        onSend={handleSendMessage}
        onAttach={() => console.log('Attach clicked')}
        disabled={isTyping}
        isLoading={isTyping}
      />
    </div>
  )
}

// Helper functions for demo
function getNextResponse(step: number): React.ReactNode {
  const responses = [
    // After objective
    <div key="1">
      <p>Parfait, vous souhaitez <strong>vendre votre entreprise</strong>. C'est noté.</p>
      <p className="mt-3 font-medium text-[var(--text-primary)]">
        Pouvez-vous me décrire l'activité principale de votre entreprise ?
      </p>
    </div>,
    // After activity
    <div key="2">
      <p>Je comprends. J'ai analysé l'évolution de vos <strong>données financières</strong> sur les 3 dernières années :</p>
      <DataCard
        title="Évolution financière (2021-2023)"
        source="Pappers / Bilans"
        className="my-4"
        items={[
          { label: 'CA 2023', value: '27.6 Md€', change: { value: '+4.2%', type: 'positive' } },
          { label: 'CA 2022', value: '26.5 Md€', change: { value: '+13.9%', type: 'positive' } },
          { label: 'CA 2021', value: '23.3 Md€' },
          { label: 'EBITDA 2023', value: '3.9 Md€', change: { value: '+8.1%', type: 'positive' } },
          { label: 'Résultat net 2023', value: '1.1 Md€', change: { value: '+15%', type: 'positive' } },
          { label: 'Trésorerie', value: '2.8 Md€' },
        ]}
      />
      <p className="font-medium text-[var(--text-primary)]">Ces chiffres reflètent-ils bien votre situation actuelle ? Y a-t-il des éléments exceptionnels à signaler ?</p>
    </div>,
    // After finances
    <div key="3">
      <p>Excellente croissance ! Passons à votre <strong>équipe</strong>.</p>
      <p className="mt-3 font-medium text-[var(--text-primary)]">
        Pouvez-vous me présenter la structure de votre équipe ?
      </p>
    </div>,
    // After team
    <div key="4">
      <p>Équipe solide avec un bon équilibre. Parlons du <strong>marché</strong>.</p>
      <p className="mt-3 font-medium text-[var(--text-primary)]">
        Comment vous positionnez-vous par rapport à vos concurrents ?
      </p>
    </div>,
    // Final result
    <div key="5">
      <p className="mb-4">
        Merci pour toutes ces informations ! Voici mon <strong>estimation de valorisation</strong> basée sur notre échange :
      </p>
      <ValuationResult
        lowValue={1800000}
        highValue={2400000}
        centralValue={2100000}
        method="Multiple EBE + Comparables sectoriels"
        breakdown={[
          { label: 'Multiple EBE', value: '1.95M€', percentage: '50%' },
          { label: 'Comparables', value: '2.25M€', percentage: '30%' },
          { label: 'DCF', value: '2.10M€', percentage: '20%' },
        ]}
        className="my-4"
      />
      <p className="text-[var(--text-tertiary)]">
        Cette estimation s'entend hors stock et trésorerie excédentaire.
        Vous pouvez télécharger le rapport complet ou affiner l'analyse avec des documents supplémentaires.
      </p>
    </div>,
  ]
  return responses[step] || responses[0]
}

function getQuickRepliesForStep(step: number) {
  const repliesPerStep = [
    QUICK_REPLIES.objectives,
    [
      { id: 'services', label: 'Services aux entreprises' },
      { id: 'commerce', label: 'Commerce de détail' },
      { id: 'industrie', label: 'Industrie' },
      { id: 'tech', label: 'Tech / SaaS' },
    ],
    [
      { id: 'growth', label: 'En croissance' },
      { id: 'stable', label: 'Stable' },
      { id: 'decline', label: 'En déclin' },
    ],
    [
      { id: 'small', label: '1-10 employés' },
      { id: 'medium', label: '11-50 employés' },
      { id: 'large', label: '50+ employés' },
    ],
    [
      { id: 'leader', label: 'Leader du marché' },
      { id: 'challenger', label: 'Challenger' },
      { id: 'niche', label: 'Acteur de niche' },
    ],
  ]
  return repliesPerStep[step] || []
}
