'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/chat/Sidebar'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { InstantValuation } from '@/components/chat/InstantValuation'
import { DocumentUpload } from '@/components/chat/DocumentUpload'
import { InitialDocumentUpload } from '@/components/chat/InitialDocumentUpload'
import { DownloadReport } from '@/components/chat/DownloadReport'
import { getEvaluations, type SavedEvaluation } from '@/lib/evaluations'
import { useEvaluationDraft } from '@/hooks/useEvaluationDraft'
import { MESSAGE_INITIAL } from '@/lib/prompts/base'
import type { ConversationContext, Message, UploadedDocument } from '@/lib/anthropic'

const exemplesSiren = [
  { siren: '443061841', nom: 'Google France' },
  { siren: '542107651', nom: 'Engie' },
  { siren: '552081317', nom: 'EDF' },
]

// Type pour les donnees de valorisation rapide
interface QuickValuationData {
  entreprise: {
    siren: string
    nom: string
    secteur: string
    codeNaf: string
    dateCreation: string
    effectif: string
    adresse: string
    ville: string
  }
  hasValuation: boolean
  message?: string
  financier?: {
    chiffreAffaires: number
    resultatNet: number
    ebitdaComptable: number
    tresorerie: number
    dettes: number
    capitauxPropres: number
    anneeDernierBilan: number
  }
  valorisation?: {
    valeurEntreprise: { basse: number; moyenne: number; haute: number }
    prixCession: { basse: number; moyenne: number; haute: number }
    detteNette: number
    multipleSectoriel: { min: number; max: number }
    methodePrincipale: string
  }
  ratios?: {
    margeEbitda: number
    margeNette: number
    ratioEndettement: number
    roe: number
  }
  diagnostic?: {
    noteGlobale: 'A' | 'B' | 'C' | 'D' | 'E'
    score: number
    pointsForts: string[]
    pointsVigilance: string[]
  }
  avertissement?: string
}

// Phases du chat unifie
type ChatPhase = 'siren_input' | 'valuation_loading' | 'valuation_display' | 'documents_upload' | 'evaluation'

// Fonction pour formater l'analyse de document en texte lisible
function formatDocumentAnalysis(doc: UploadedDocument): string {
  const analysis = doc.analysis
  if (!analysis) return `Document "${doc.name}" - Analyse en attente`

  if (analysis.error || analysis.parseError) {
    return `Document "${doc.name}" - Erreur d'analyse: ${analysis.error || 'Format non reconnu'}`
  }

  const parts: string[] = [`📄 **${doc.name}**`]

  if (analysis.typeDocument) {
    parts.push(`Type: ${analysis.typeDocument}`)
  }
  if (analysis.annee) {
    parts.push(`Annee: ${analysis.annee}`)
  }

  // Chiffres extraits
  if (analysis.chiffresExtraits) {
    const chiffres = analysis.chiffresExtraits as Record<string, number | null>
    const lignes: string[] = []
    if (chiffres.ca) lignes.push(`  - CA: ${chiffres.ca.toLocaleString('fr-FR')} €`)
    if (chiffres.resultatNet) lignes.push(`  - Resultat net: ${chiffres.resultatNet.toLocaleString('fr-FR')} €`)
    if (chiffres.ebitda) lignes.push(`  - EBITDA: ${chiffres.ebitda.toLocaleString('fr-FR')} €`)
    if (chiffres.tresorerie) lignes.push(`  - Tresorerie: ${chiffres.tresorerie.toLocaleString('fr-FR')} €`)
    if (chiffres.dettes) lignes.push(`  - Dettes: ${chiffres.dettes.toLocaleString('fr-FR')} €`)

    // Autres donnees
    if (chiffres.autresDonnees && typeof chiffres.autresDonnees === 'object') {
      const autres = chiffres.autresDonnees as Record<string, number>
      for (const [key, val] of Object.entries(autres)) {
        if (val) lignes.push(`  - ${key}: ${val.toLocaleString('fr-FR')} €`)
      }
    }

    if (lignes.length > 0) {
      parts.push('Donnees extraites:')
      parts.push(...lignes)
    }
  }

  // Points cles
  if (analysis.pointsCles && analysis.pointsCles.length > 0) {
    parts.push('Points cles:')
    analysis.pointsCles.slice(0, 3).forEach(p => parts.push(`  • ${p}`))
  }

  // Anomalies
  if (analysis.anomalies && analysis.anomalies.length > 0) {
    parts.push('⚠️ Alertes:')
    analysis.anomalies.slice(0, 3).forEach(a => {
      const anomalie = a as { message?: string; categorie?: string }
      parts.push(`  - ${anomalie.message || anomalie.categorie || 'Anomalie detectee'}`)
    })
  }

  return parts.join('\n')
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [evaluations, setEvaluations] = useState<SavedEvaluation[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State unifie
  const [phase, setPhase] = useState<ChatPhase>('siren_input')
  const [messages, setMessages] = useState<Message[]>([])
  const [valuationData, setValuationData] = useState<QuickValuationData | null>(null)
  const [context, setContext] = useState<ConversationContext | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([])


  // Message d'accueil
  const welcomeMessage: Message = {
    id: 'welcome',
    role: 'assistant',
    content: `# Bienvenue sur EvalUp

Je suis votre assistant expert en evaluation d'entreprises. Je vais analyser les donnees financieres, le secteur d'activite et les specificites de l'entreprise pour vous fournir une estimation precise.

**Pour commencer, entrez le numero SIREN de l'entreprise a evaluer (9 chiffres).**

_Le SIREN se trouve sur le Kbis, les factures ou le site societe.com_`,
    timestamp: new Date(),
  }

  // Charger les evaluations et initialiser le message d'accueil
  useEffect(() => {
    const saved = getEvaluations()
    setEvaluations(saved)
    setMessages([welcomeMessage])
  }, [])

  // Scroll auto vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, streamingContent])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [input])

  // Hook pour la sauvegarde automatique
  const { save: saveDraft } = useEvaluationDraft({
    siren: valuationData?.entreprise.siren || '',
    entrepriseNom: valuationData?.entreprise.nom || '',
  })

  const formatSiren = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 9)
    return numbers.replace(/(\d{3})(?=\d)/g, '$1 ')
  }

  // Soumettre le SIREN
  const handleSirenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanSiren = input.replace(/\s/g, '')
    if (!/^\d{9}$/.test(cleanSiren)) {
      setError('Le SIREN doit contenir 9 chiffres')
      return
    }

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `SIREN: ${formatSiren(cleanSiren)}`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setPhase('valuation_loading')

    try {
      // Appeler l'API de valorisation rapide
      const response = await fetch(`/api/entreprise/${cleanSiren}/quick-valuation`)
      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.code === 'NOT_FOUND'
          ? 'Entreprise non trouvee. Verifiez le numero SIREN.'
          : data.code === 'INVALID_SIREN'
            ? 'Le SIREN doit contenir 9 chiffres'
            : data.error || 'Erreur lors de la recherche'

        // Ajouter message d'erreur
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ **Erreur:** ${errorMsg}\n\nVeuillez verifier le numero SIREN et reessayer.`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
        setPhase('siren_input')
        setIsLoading(false)
        return
      }

      // Stocker les donnees de valorisation
      setValuationData(data)
      setPhase('valuation_display')
      setIsLoading(false)
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `❌ **Erreur de connexion.** Veuillez reessayer.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      setPhase('siren_input')
      setIsLoading(false)
    }
  }

  // Continuer apres la valorisation
  const handleContinueAfterValuation = async () => {
    if (!valuationData) return

    // Ajouter message utilisateur
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Continuer l\'evaluation',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Charger le contexte complet pour le chat
      const response = await fetch(`/api/entreprise/${valuationData.entreprise.siren}`)
      const data = await response.json()

      if (!response.ok) {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `❌ **Erreur lors du chargement des donnees.** Veuillez reessayer.`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
        setIsLoading(false)
        return
      }

      setContext(data.initialContext)

      // Ajouter le message d'introduction pour les documents
      const docMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `## Documents complementaires

Pour affiner l'evaluation, vous pouvez ajouter des documents:
- **Bilans comptables** (PDF ou images)
- **Liasses fiscales**
- **Rapports financiers**

Ces documents permettent d'avoir une vision plus precise de la situation financiere.

**Vous pouvez passer cette etape si vous n'avez pas de documents a ajouter.**`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, docMessage])
      setPhase('documents_upload')
      setIsLoading(false)
    } catch {
      setIsLoading(false)
    }
  }

  // Passer l'upload de documents
  const handleSkipDocuments = () => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: 'Passer cette etape',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    startEvaluation()
  }

  // Demarrer l'evaluation (avec documents optionnels deja analyses)
  const startEvaluation = (analyzedDocs?: UploadedDocument[]) => {
    if (!valuationData || !context) return

    // Mettre a jour le contexte avec les documents analyses
    let updatedContext = context
    if (analyzedDocs && analyzedDocs.length > 0) {
      updatedContext = {
        ...context,
        documents: [...context.documents, ...analyzedDocs],
      }
      setContext(updatedContext)
    }

    // Extraire l'annee des donnees
    const dataYear = updatedContext.financials?.bilans?.[0]?.annee || null
    const caFormate = valuationData.financier?.chiffreAffaires
      ? `${valuationData.financier.chiffreAffaires.toLocaleString('fr-FR')} €`
      : undefined

    // Construire le resume des documents si presents
    let docsResume = ''
    if (analyzedDocs && analyzedDocs.length > 0) {
      const docsSummary = analyzedDocs.map(d => formatDocumentAnalysis(d)).join('\n\n')
      docsResume = `\n\n---\n**Documents fournis et analyses:**\n\n${docsSummary}\n\n---\n\n*Je vais adapter mes questions en fonction des informations deja disponibles dans vos documents.*`
    }

    // Message initial de l'evaluation
    const evalMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: MESSAGE_INITIAL({
        nom: valuationData.entreprise.nom,
        secteur: valuationData.entreprise.secteur,
        dateCreation: valuationData.entreprise.dateCreation,
        effectif: valuationData.entreprise.effectif,
        ville: valuationData.entreprise.ville,
        ca: caFormate,
        dataYear,
      }) + docsResume,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, evalMessage])
    setPhase('evaluation')
    setCurrentStep(1)
  }

  // Gerer l'upload initial de documents avec analyse
  const handleInitialDocumentUpload = async (files: File[]) => {
    if (!context) return

    setIsLoading(true)
    setUploadedDocs(files)

    // Message utilisateur
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `J'ajoute ${files.length} document(s) pour l'evaluation`,
      timestamp: new Date(),
      documents: files.map(f => ({
        id: crypto.randomUUID(),
        name: f.name,
        type: f.type,
        size: f.size,
      })),
    }
    setMessages(prev => [...prev, userMsg])

    // Message d'analyse en cours
    const analyzingMsg: Message = {
      id: 'analyzing-docs',
      role: 'assistant',
      content: `📄 Analyse de ${files.length} document(s) en cours...`,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, analyzingMsg])

    try {
      // Analyser chaque document
      const analyzedDocs: UploadedDocument[] = []

      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('context', JSON.stringify(context))

        const response = await fetch('/api/documents/analyze', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          analyzedDocs.push({
            id: result.documentId || crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
            extractedText: result.extractedText,
            analysis: result.analysis,
          })
        } else {
          analyzedDocs.push({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
            analysis: { error: 'Erreur lors de l\'analyse' },
          })
        }
      }

      // Supprimer le message d'analyse en cours
      setMessages(prev => prev.filter(m => m.id !== 'analyzing-docs'))

      // Demarrer l'evaluation avec les documents analyses
      startEvaluation(analyzedDocs)
    } catch (error) {
      console.error('Erreur analyse documents:', error)
      setMessages(prev => prev.filter(m => m.id !== 'analyzing-docs'))
      // Demarrer quand meme sans les analyses
      startEvaluation()
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour lire le stream SSE
  const readStream = useCallback(async (
    response: Response,
    onChunk: (text: string) => void,
    onComplete: (fullText: string) => void
  ) => {
    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let fullText = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              onComplete(fullText)
              return
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                fullText += parsed.text
                onChunk(fullText)
              }
            } catch {
              // Ignorer les erreurs de parsing
            }
          }
        }
      }
      onComplete(fullText)
    } catch (error) {
      console.error('Erreur lecture stream:', error)
      onComplete(fullText)
    }
  }, [])

  // Envoyer un message pendant l'evaluation
  const sendMessage = async (content: string, documents?: File[]) => {
    if (!content.trim() && !documents?.length) return
    if (!context) return

    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      documents: documents?.map(f => ({
        id: crypto.randomUUID(),
        name: f.name,
        type: f.type,
        size: f.size,
      })),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setUploadedDocs([])
    setIsLoading(true)

    try {
      // Si documents uploades, les analyser d'abord
      const documentsAnalysis: UploadedDocument[] = []
      if (documents?.length) {
        for (const doc of documents) {
          const formData = new FormData()
          formData.append('file', doc)
          formData.append('context', JSON.stringify(context))

          const analysisRes = await fetch('/api/documents/analyze', {
            method: 'POST',
            body: formData,
          })
          const analysis = await analysisRes.json()
          documentsAnalysis.push({
            id: analysis.documentId,
            name: doc.name,
            type: doc.type,
            size: doc.size,
            extractedText: analysis.extractedText,
            analysis: analysis.analysis,
          })
        }
      }

      // Mettre a jour le contexte avec les documents
      const updatedContext: ConversationContext = {
        ...context,
        documents: [...context.documents, ...documentsAnalysis],
      }
      setContext(updatedContext)

      // Construire le contenu avec les analyses de documents
      let messageContent = content
      if (documentsAnalysis.length > 0) {
        const docsSummary = documentsAnalysis.map(d => formatDocumentAnalysis(d)).join('\n\n')
        messageContent = `${content}\n\n---\n**Documents analyses:**\n\n${docsSummary}`
      }

      // Construire l'historique pour l'API (filtrer les messages systeme)
      const apiMessages = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

      // Ajouter le nouveau message
      apiMessages.push({ role: 'user', content: messageContent })

      // Appeler l'API de chat en streaming
      setIsStreaming(true)
      setStreamingContent('')

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: updatedContext,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur API')
      }

      await readStream(
        response,
        (text) => setStreamingContent(text),
        (fullText) => {
          // Extraire le nouveau step si present
          const stepMatch = fullText.match(/\[STEP:(\d+)\]/)
          if (stepMatch) {
            const newStep = parseInt(stepMatch[1])
            setCurrentStep(newStep)
            setContext(prev => prev ? {
              ...prev,
              evaluationProgress: { ...prev.evaluationProgress, step: newStep }
            } : prev)
          }

          // Nettoyer le texte
          const cleanText = fullText.replace(/\[STEP:\d+\]/g, '').trim()

          // Ajouter le message assistant
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: cleanText,
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, assistantMessage])
          setStreamingContent('')
          setIsStreaming(false)
          setIsLoading(false)

          // Sauvegarder le brouillon
          if (valuationData) {
            saveDraft(updatedContext, [...messages, userMessage, assistantMessage], currentStep)
          }
        }
      )
    } catch (error) {
      console.error('Erreur envoi message:', error)
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phase === 'siren_input') {
      handleSirenSubmit(e)
    } else if (phase === 'evaluation') {
      sendMessage(input, uploadedDocs.length > 0 ? uploadedDocs : undefined)
    }
  }

  const handleExemple = (sirenExemple: string) => {
    setInput(formatSiren(sirenExemple))
    setError('')
  }

  // Nouvelle evaluation (reset)
  const handleNewEvaluation = () => {
    setPhase('siren_input')
    setMessages([welcomeMessage])
    setValuationData(null)
    setContext(null)
    setInput('')
    setError('')
    setCurrentStep(1)
    setUploadedDocs([])
  }

  // Donnees entreprise pour la sidebar
  const entrepriseData = valuationData ? {
    siren: valuationData.entreprise.siren,
    nom: valuationData.entreprise.nom,
    secteur: valuationData.entreprise.secteur,
  } : null

  // Placeholder selon la phase
  const getPlaceholder = () => {
    switch (phase) {
      case 'siren_input':
        return 'Entrez un SIREN (ex: 443 061 841)'
      case 'evaluation':
        return 'Votre reponse...'
      default:
        return ''
    }
  }

  // Afficher la zone de saisie
  const showInput = phase === 'siren_input' || phase === 'evaluation'

  return (
    <div className="h-screen-safe flex bg-[#1a1a2e] no-overscroll">
      {/* Sidebar */}
      <Sidebar
        entreprise={entrepriseData ? {
          nom: entrepriseData.nom,
          secteur: entrepriseData.secteur,
          siren: entrepriseData.siren,
        } : {
          nom: 'Nouvelle evaluation',
          secteur: '',
          siren: '',
        }}
        currentStep={currentStep}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        evaluations={evaluations}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="relative z-10 flex items-center gap-3 px-4 py-3 sm:py-4 pt-safe bg-[#1a1a2e] shadow-lg shadow-black/20">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setSidebarOpen(true)
              } else {
                setSidebarCollapsed(!sidebarCollapsed)
              }
            }}
            className="p-2.5 sm:p-2 -ml-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors touch-target"
            title={sidebarCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
          >
            {sidebarCollapsed ? (
              <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-white truncate">
              {entrepriseData ? entrepriseData.nom : 'Nouvelle evaluation'}
            </h1>
          </div>

          {phase === 'evaluation' && (
            <div className="text-xs text-white/60 bg-white/10 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-full whitespace-nowrap">
              Etape {currentStep}/6
            </div>
          )}

          {valuationData && (
            <button
              onClick={handleNewEvaluation}
              className="p-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors"
              title="Nouvelle evaluation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </header>

        {/* Zone principale - Chat unifie */}
        <main className="flex-1 overflow-hidden bg-[#1a1a2e]">
          <div className="flex flex-col h-full relative">
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-0 scroll-smooth-mobile">
              <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 pb-4">

                {/* Tous les messages */}
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {/* Suggestions SIREN (phase input uniquement) */}
                {phase === 'siren_input' && messages.length === 1 && (
                  <div className="flex justify-start">
                    <div className="flex-shrink-0 mr-2 sm:mr-3 w-8" />
                    <div className="flex flex-wrap gap-2">
                      {exemplesSiren.map((exemple) => (
                        <button
                          key={exemple.siren}
                          onClick={() => handleExemple(exemple.siren)}
                          className="px-3.5 py-2 sm:px-3 sm:py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors touch-target"
                        >
                          {exemple.nom}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isLoading && !isStreaming && <TypingIndicator />}

                {/* Streaming content */}
                {isStreaming && streamingContent && (
                  <MessageBubble
                    message={{
                      id: 'streaming',
                      role: 'assistant',
                      content: streamingContent,
                      timestamp: new Date(),
                    }}
                  />
                )}

                {/* Valorisation - reste visible dans l'historique */}
                {valuationData && (
                  <div className="space-y-4">
                    <InstantValuation
                      data={valuationData}
                      onContinue={phase === 'valuation_display' ? handleContinueAfterValuation : undefined}
                      showContinueButton={phase === 'valuation_display'}
                    />
                  </div>
                )}

                {/* Phase upload documents */}
                {phase === 'documents_upload' && (
                  <div className="flex justify-start">
                    <div className="flex-shrink-0 mr-2 sm:mr-3 w-8" />
                    <div className="space-y-3">
                      <InitialDocumentUpload
                        onUpload={handleInitialDocumentUpload}
                        onSkip={handleSkipDocuments}
                      />
                    </div>
                  </div>
                )}

                {/* Telecharger le rapport (fin d'evaluation) */}
                {phase === 'evaluation' && context && currentStep >= 6 && (
                  <DownloadReport context={context} messages={messages} />
                )}

                {/* Message d'erreur */}
                {error && (
                  <div className="flex justify-start">
                    <div className="flex-shrink-0 mr-2 sm:mr-3 w-8" />
                    <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 sm:px-4 py-2">
                      {error}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Zone de saisie */}
            {showInput && (
              <div className="sticky bottom-0 bg-[#1a1a2e] shadow-[0_-8px_20px_rgba(0,0,0,0.3)] sticky-input-mobile">
                <div className="p-3 sm:p-4 pb-safe">
                  <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    <div className="relative bg-white/5 rounded-2xl border border-white/20 focus-within:border-[#c9a227] focus-within:ring-2 focus-within:ring-[#c9a227]/20 transition-all">
                      {/* Documents attaches */}
                      {uploadedDocs.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 border-b border-white/10">
                          {uploadedDocs.map((doc, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1 text-xs text-white/70">
                              <span className="truncate max-w-[150px]">{doc.name}</span>
                              <button
                                type="button"
                                onClick={() => setUploadedDocs(prev => prev.filter((_, j) => j !== i))}
                                className="text-white/50 hover:text-white"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-end gap-1.5 sm:gap-2 p-1.5 sm:p-2">
                        {/* Icone */}
                        <div className="p-2.5 sm:p-3 text-white/50">
                          {phase === 'siren_input' ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )}
                        </div>

                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => {
                            if (phase === 'siren_input') {
                              setInput(formatSiren(e.target.value))
                            } else {
                              setInput(e.target.value)
                            }
                            setError('')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSubmit(e)
                            }
                          }}
                          placeholder={getPlaceholder()}
                          className="flex-1 bg-transparent px-2 py-2.5 sm:py-2 resize-none focus:outline-none text-white placeholder:text-white/40 text-base sm:text-lg"
                          rows={1}
                          disabled={isLoading || isStreaming}
                        />

                        {/* Bouton upload documents (phase evaluation) */}
                        {phase === 'evaluation' && (
                          <DocumentUpload
                            onUpload={(files) => setUploadedDocs(prev => [...prev, ...files])}
                          />
                        )}

                        <button
                          type="submit"
                          disabled={isLoading || isStreaming || !input.trim()}
                          className="p-3 sm:p-2.5 bg-[#c9a227] text-[#1a1a2e] rounded-xl hover:bg-[#e8c547] disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-target"
                        >
                          {isLoading || isStreaming ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {phase === 'siren_input' && (
                      <p className="text-xs text-white/30 mt-2 text-center hidden sm:block">
                        Entree pour rechercher | <Link href="/evaluation" className="hover:text-white/50 underline">Remplir manuellement</Link>
                      </p>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
