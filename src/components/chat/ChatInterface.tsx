'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { DocumentUpload } from './DocumentUpload'
import { DownloadReport } from './DownloadReport'
import { CompanyBentoGrid } from '@/components/CompanyBentoGrid'
import { useEvaluationDraft } from '@/hooks/useEvaluationDraft'
import { getDraftBySiren } from '@/lib/evaluation-draft'
import type { ConversationContext, Message, UploadedDocument } from '@/lib/anthropic'
import { MESSAGE_INITIAL } from '@/lib/prompts/base'
import { INTRO_MESSAGES, DOCUMENT_RESPONSE_YES, DOCUMENT_RESPONSE_NO, PEDAGOGY_OPTIONS, type UserParcours, type PedagogyLevel } from '@/lib/prompts/parcours'
import { trackConversion } from '@/lib/analytics'

// Options d'objectif de valorisation
const OBJECTIF_OPTIONS = [
  { id: 'vente', icon: '💰', title: 'Vente', description: 'Vendre mon entreprise' },
  { id: 'achat', icon: '🛒', title: 'Achat', description: 'Racheter cette entreprise' },
  { id: 'associe', icon: '🤝', title: 'Associé', description: 'Rachat ou sortie d\'associé' },
  { id: 'divorce', icon: '💔', title: 'Divorce', description: 'Séparation de patrimoine' },
  { id: 'transmission', icon: '👨‍👩‍👧', title: 'Transmission', description: 'Donation familiale' },
  { id: 'conflit', icon: '⚖️', title: 'Conflit', description: 'Litige entre associés' },
  { id: 'financement', icon: '🏦', title: 'Financement', description: 'Banque, levée de fonds' },
  { id: 'pilotage', icon: '📊', title: 'Pilotage', description: 'Comprendre ma valeur' },
] as const

type ObjectifType = typeof OBJECTIF_OPTIONS[number]['id']

interface BentoGridData {
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
    margeNette: number
    margeEbitda: number
    ratioEndettement: number
    roe: number
  }
  diagnostic?: {
    noteGlobale: string
    score: number
    pointsForts: string[]
    pointsVigilance: string[]
  }
  dataQuality?: {
    dataYear: number
    dataAge: number
    isDataOld: boolean
    confidence: 'faible' | 'moyenne' | 'haute'
  }
}

interface ChatInterfaceProps {
  entreprise: {
    siren: string
    nom: string
    secteur: string
    codeNaf: string
    dateCreation: string
    effectif: string
    adresse: string
    ville: string
    chiffreAffaires?: number
  }
  initialContext: ConversationContext
  onStepChange?: (step: number) => void
  previousMessages?: { role: 'assistant' | 'user', content: string }[]
  bentoGridData?: BentoGridData
}

export function ChatInterface({ entreprise, initialContext, onStepChange, previousMessages, bentoGridData }: ChatInterfaceProps) {
  // Un seul tableau de messages pour tout l'historique
  const [messages, setMessages] = useState<Message[]>(() => {
    if (previousMessages?.length) {
      return previousMessages.map((msg, idx) => ({
        id: `prev-${idx}`,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(),
      }))
    }
    return []
  })

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [context, setContext] = useState(initialContext)
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([])

  // Router pour mettre à jour l'URL
  const router = useRouter()
  const pathname = usePathname()

  // Objectif state - question principale après le bento grid
  const [showObjectifQuestion, setShowObjectifQuestion] = useState(false)
  const [objectifMessageText, setObjectifMessageText] = useState('')
  const [isTypingObjectif, setIsTypingObjectif] = useState(false)
  const [selectedObjectif, setSelectedObjectif] = useState<ObjectifType | null>(
    initialContext.objectif || null
  )

  // Niveau pédagogique (après objectif)
  const [showPedagogyQuestion, setShowPedagogyQuestion] = useState(false)
  const [selectedPedagogy, setSelectedPedagogy] = useState<PedagogyLevel | null>(
    initialContext.pedagogyLevel || null
  )

  // Index pour savoir où insérer le bento grid (après les messages initiaux)
  const bentoInsertIndex = useRef(previousMessages?.length || 0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Hook pour la sauvegarde automatique
  const { save: saveDraft, complete: completeDraft } = useEvaluationDraft({
    siren: entreprise.siren,
    entrepriseNom: entreprise.nom,
  })

  // Message d'objectif
  const OBJECTIF_MESSAGE = "Tout est en place ! Pour adapter mon analyse, quel est l'objectif de cette valorisation ?"

  // Restaurer automatiquement le brouillon au chargement
  useEffect(() => {
    const existingDraft = getDraftBySiren(entreprise.siren)
    if (existingDraft && !existingDraft.isCompleted && existingDraft.messages.length > 1) {
      // Restaurer automatiquement le brouillon
      setMessages(existingDraft.messages)
      setContext(existingDraft.context)
      if (existingDraft.context.objectif) {
        setSelectedObjectif(existingDraft.context.objectif as ObjectifType)
        setShowObjectifQuestion(true)
      }
      onStepChange?.(existingDraft.step)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entreprise.siren])

  // Si l'objectif est déjà sélectionné au chargement, ajouter le message d'intro
  useEffect(() => {
    if (!initialContext.objectif || !bentoGridData) return
    if (messages.length > 0) return // Déjà des messages, ne pas ajouter

    const option = OBJECTIF_OPTIONS.find(o => o.id === initialContext.objectif)
    if (!option) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `${option.icon} ${option.title} - ${option.description}`,
      timestamp: new Date(),
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: INTRO_MESSAGES.cedant, // Message par défaut
      timestamp: new Date(),
    }

    setMessages([userMessage, assistantMessage])
    setShowObjectifQuestion(true) // Afficher que l'objectif a été choisi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContext.objectif, bentoGridData])

  // Effet typewriter pour le message d'objectif
  useEffect(() => {
    if (!bentoGridData || selectedObjectif) {
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current)
        typeIntervalRef.current = null
      }
      return
    }

    const startDelay = setTimeout(() => {
      setShowObjectifQuestion(true)
      setIsTypingObjectif(true)

      let currentIndex = 0
      typeIntervalRef.current = setInterval(() => {
        if (currentIndex < OBJECTIF_MESSAGE.length) {
          setObjectifMessageText(OBJECTIF_MESSAGE.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          if (typeIntervalRef.current) {
            clearInterval(typeIntervalRef.current)
            typeIntervalRef.current = null
          }
          setIsTypingObjectif(false)
        }
      }, 20)
    }, 500)

    return () => {
      clearTimeout(startDelay)
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current)
        typeIntervalRef.current = null
      }
    }
  }, [selectedObjectif, OBJECTIF_MESSAGE])

  // Message initial (seulement si pas de bento grid et pas de messages precedents)
  useEffect(() => {
    if (previousMessages?.length) return
    if (bentoGridData) return // Pas de message initial avec le bento grid

    const caFormate = entreprise.chiffreAffaires
      ? `${entreprise.chiffreAffaires.toLocaleString('fr-FR')} EUR`
      : undefined

    const dataYear = initialContext.financials?.bilans?.[0]?.annee || null

    const initialMessage: Message = {
      id: 'initial',
      role: 'assistant',
      content: MESSAGE_INITIAL({
        nom: entreprise.nom,
        secteur: entreprise.secteur,
        dateCreation: entreprise.dateCreation,
        effectif: entreprise.effectif,
        ville: entreprise.ville,
        ca: caFormate,
        dataYear,
      }),
      timestamp: new Date(),
    }
    setMessages([initialMessage])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entreprise.siren, bentoGridData])

  // Sauvegarde automatique
  useEffect(() => {
    if (messages.length > 1 && !isStreaming) {
      const timeoutId = setTimeout(() => {
        saveDraft(context, messages, context.evaluationProgress.step)
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [messages, context, isStreaming, saveDraft])

  // Marquer comme termine
  useEffect(() => {
    if (context.evaluationProgress.step >= 6) {
      completeDraft()
    }
  }, [context.evaluationProgress.step, completeDraft])

  // Scroll auto
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

  // Auto-focus textarea
  useEffect(() => {
    if (!isStreaming && !isLoading && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isStreaming, isLoading])

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

  // Detecter l'etape dans la reponse
  const detectStep = useCallback((text: string) => {
    const stepMatch = text.match(/📍\s*(?:\*\*)?Étape\s*(\d+)\/6/i)
    if (stepMatch) {
      const newStep = parseInt(stepMatch[1])
      setContext(prev => ({
        ...prev,
        evaluationProgress: {
          ...prev.evaluationProgress,
          step: newStep,
        },
      }))
      onStepChange?.(newStep)
    }
  }, [onStepChange])

  // Handler pour sélection de l'objectif (première question après bento grid)
  const handleObjectifSelect = (objectif: ObjectifType) => {
    setSelectedObjectif(objectif)

    // Mettre à jour l'URL pour persister le choix
    router.replace(`${pathname}?objectif=${objectif}`, { scroll: false })

    const option = OBJECTIF_OPTIONS.find(o => o.id === objectif)
    if (!option) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `${option.icon} ${option.title} - ${option.description}`,
      timestamp: new Date(),
    }

    // Message demandant le niveau pédagogique
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Compris, objectif : **${option.title}**.\n\n**Quel est ton niveau de familiarité avec la valorisation d'entreprise ?**\n\n_Cela me permet d'adapter mes explications._`,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setShowPedagogyQuestion(true)

    const updatedContext = { ...context, objectif }
    setContext(updatedContext)
  }

  // Handler pour sélection du niveau pédagogique
  const handlePedagogySelect = (level: PedagogyLevel) => {
    setSelectedPedagogy(level)
    setShowPedagogyQuestion(false)

    const option = PEDAGOGY_OPTIONS.find(o => o.id === level)
    if (!option) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `${option.icon} ${option.title}`,
      timestamp: new Date(),
    }

    // Message d'intro avec demande de documents
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: INTRO_MESSAGES.cedant,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])

    const updatedContext = { ...context, pedagogyLevel: level }
    setContext(updatedContext)
  }

  // Handler pour clic sur une suggestion
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  // Envoyer un message
  const sendMessage = async (content: string, documents?: File[]) => {
    if (!content.trim() && !documents?.length) return

    // Gérer le clic sur "Oui, je veux affiner mon évaluation"
    if (content.toLowerCase().includes('affiner mon évaluation') || content.toLowerCase().includes('oui, je veux affiner')) {
      trackConversion('click_upgrade', { siren: entreprise.siren, plan: 'eval_complete' })
      router.push(`/checkout?siren=${entreprise.siren}&plan=eval_complete`)
      return
    }

    // Gérer les réponses prédéfinies pour les documents
    const lowerContent = content.toLowerCase()
    const isDocumentYes = lowerContent.includes('oui') && lowerContent.includes('documents')
    const isDocumentNo = lowerContent.includes('non') && lowerContent.includes('continuons')

    // Gérer "Non, continuons avec les données déjà collectées" après upgrade
    if (lowerContent.includes('continuons avec les données') && context.isPaid) {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      // Message de transition vers l'évaluation complète sans nouveaux documents
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Parfait, je vais utiliser les données que tu m'as déjà communiquées pendant l'évaluation Flash pour approfondir mon analyse.

📊 **Récapitulatif des éléments collectés :**
${context.responses && Object.keys(context.responses).length > 0
  ? Object.entries(context.responses).map(([key, value]) => `- **${key}**: ${value}`).join('\n')
  : '- Données Pappers (CA, résultat, effectif...)'}

Je vais maintenant procéder aux **retraitements** et à l'**analyse des risques** pour affiner la valorisation.

**Commençons par les retraitements :**

Quel est le **salaire annuel brut du dirigeant** (charges patronales incluses) ? C'est important car on va le comparer au salaire de marché pour un poste équivalent.

[SUGGESTIONS]Je n'ai pas cette info|Le dirigeant se verse environ...[/SUGGESTIONS]`,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, userMessage, assistantMessage])
      setInput('')
      return
    }

    // Détecter si l'utilisateur change d'avis (dit qu'il n'a finalement pas de documents)
    const isNoDocumentsAfterAll = (
      (lowerContent.includes('finalement') && (lowerContent.includes('non') || lowerContent.includes('pas'))) ||
      (lowerContent.includes('pas de document') || lowerContent.includes("pas de doc") || lowerContent.includes("j'ai pas")) ||
      (lowerContent.includes('aucun document') || lowerContent.includes('aucun doc')) ||
      (lowerContent.includes('non') && lowerContent.includes('rien')) ||
      (lowerContent.includes('je n\'ai') && lowerContent.includes('pas'))
    )

    if (isDocumentYes || isDocumentNo || isNoDocumentsAfterAll) {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      let responseContent: string
      if (isDocumentYes && !isNoDocumentsAfterAll) {
        responseContent = DOCUMENT_RESPONSE_YES
      } else {
        // Utiliser la réponse adaptée au parcours (que ce soit "non" initial ou changement d'avis)
        const currentParcours: UserParcours = 'cedant'
        responseContent = DOCUMENT_RESPONSE_NO[currentParcours]
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, userMessage, assistantMessage])
      setInput('')
      return
    }

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
      // Analyser les documents si presents
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

      const updatedContext: ConversationContext = {
        ...context,
        documents: [...context.documents, ...documentsAnalysis],
      }
      setContext(updatedContext)

      let messageContent = content
      if (documentsAnalysis.length > 0) {
        messageContent += '\n\n--- Analyse des documents joints ---\n'
        for (const doc of documentsAnalysis) {
          if (doc.analysis && !doc.analysis.error) {
            messageContent += `\nDocument: ${doc.name}\n`
            messageContent += `Type: ${doc.analysis.typeDocument || 'Non identifie'}\n`
            if (doc.analysis.chiffresExtraits) {
              messageContent += `Chiffres extraits: ${JSON.stringify(doc.analysis.chiffresExtraits)}\n`
            }
            if (doc.analysis.pointsCles?.length) {
              messageContent += `Points cles: ${doc.analysis.pointsCles.join(', ')}\n`
            }
          }
        }
      }

      setIsLoading(false)
      setIsStreaming(true)
      setStreamingContent('')

      const allMessages = [...messages, { ...userMessage, content: messageContent }]
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          context: updatedContext,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur de communication' }))

        // Gestion des erreurs specifiques avec messages user-friendly
        const errorMessages: Record<string, string> = {
          TOKEN_LIMIT_REACHED: 'Tu as atteint ta limite quotidienne. Reessaie demain ou passe au plan Pro pour continuer.',
          AUTH_REQUIRED: 'Ta session a expire. Rafraichis la page pour te reconnecter.',
        }

        const userMessage = errorMessages[errorData.code] || errorData.error || 'Erreur de communication avec le serveur'

        // Pour les erreurs 5xx (serveur), proposer un retry
        if (response.status >= 500) {
          throw new Error('Le serveur est temporairement indisponible. Reessaie dans quelques instants.')
        }

        throw new Error(userMessage)
      }

      await readStream(
        response,
        (text) => setStreamingContent(text),
        (fullText) => {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullText,
            timestamp: new Date(),
          }

          setMessages(prev => [...prev, assistantMessage])

          setStreamingContent('')
          setIsStreaming(false)
          detectStep(fullText)
        }
      )
    } catch (error) {
      console.error('Erreur envoi message:', error)
      setIsStreaming(false)
      setStreamingContent('')

      const errorText = error instanceof Error ? error.message : 'Une erreur inattendue est survenue'

      // Detecter les erreurs reseau
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch')
      const displayText = isNetworkError
        ? 'Impossible de joindre le serveur. Verifie ta connexion internet et reessaie.'
        : errorText

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `${displayText}\n\nSi le probleme persiste, contacte-nous a contact@evalup.fr.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input, uploadedDocs.length > 0 ? uploadedDocs : undefined)
  }

  const handleDocumentUpload = (files: File[]) => {
    setUploadedDocs(prev => [...prev, ...files])
  }

  const removeDocument = (index: number) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== index))
  }

  // Separer les messages en deux parties : avant et apres le bento grid
  const messagesBefore = messages.slice(0, bentoInsertIndex.current)
  const messagesAfter = messages.slice(bentoInsertIndex.current)

  return (
    <div className="flex flex-col h-full relative">
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-0">
        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 pb-4">
          {/* Messages AVANT le bento grid (historique initial) */}
          {messagesBefore.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSuggestionClick={handleSuggestionClick}
            />
          ))}

          {/* Bento Grid */}
          {bentoGridData && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center flex-shrink-0">
                <span className="text-[#1a1a2e] text-sm font-bold">E</span>
              </div>
              <div className="flex-1">
                <CompanyBentoGrid
                  entreprise={entreprise}
                  financier={bentoGridData.financier}
                  valorisation={bentoGridData.valorisation}
                  ratios={bentoGridData.ratios}
                  diagnostic={bentoGridData.diagnostic}
                  dataQuality={bentoGridData.dataQuality}
                />
              </div>
            </div>
          )}

          {/* Question d'objectif avec typewriter */}
          {showObjectifQuestion && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center flex-shrink-0">
                <span className="text-[#1a1a2e] text-sm font-bold">E</span>
              </div>
              <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 text-white/90 max-w-[80%]">
                {selectedObjectif ? OBJECTIF_MESSAGE : objectifMessageText}
                {isTypingObjectif && !selectedObjectif && (
                  <span className="inline-block w-0.5 h-4 bg-[#c9a227] ml-0.5 animate-pulse" />
                )}
              </div>
            </div>
          )}

          {/* Boutons d'objectif (8 choix) */}
          {showObjectifQuestion && !isTypingObjectif && !selectedObjectif && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 ml-11">
              {OBJECTIF_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleObjectifSelect(option.id)}
                  className="flex items-start gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#c9a227]/50 transition-all text-left group"
                >
                  <span className="text-xl">{option.icon}</span>
                  <div>
                    <p className="text-white font-medium text-sm group-hover:text-[#c9a227] transition-colors">
                      {option.title}
                    </p>
                    <p className="text-white/60 text-xs">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Messages APRES le bento grid (conversation post-objectif) */}
          {messagesAfter.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSuggestionClick={handleSuggestionClick}
            />
          ))}

          {/* Boutons Niveau pédagogique (APRÈS les messages, quand la question est posée) */}
          {showPedagogyQuestion && !selectedPedagogy && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 ml-11">
              {PEDAGOGY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handlePedagogySelect(option.id)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#c9a227]/50 transition-all text-center group"
                >
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <p className="text-white font-medium text-sm group-hover:text-[#c9a227] transition-colors">
                      {option.title}
                    </p>
                    <p className="text-white/60 text-xs">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Message en streaming */}
          {isStreaming && streamingContent && (
            <MessageBubble
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingContent,
                timestamp: new Date(),
              }}
              isStreaming={true}
              onSuggestionClick={handleSuggestionClick}
            />
          )}
          {isLoading && <TypingIndicator />}

          {/* Bouton de telechargement du rapport */}
          {context.evaluationProgress.step >= 6 && !isLoading && !isStreaming && (
            <DownloadReport
              context={context}
              messages={messages}
              evaluation={{
                valeurBasse: context.financials.ratios.ebitda * 4,
                valeurHaute: context.financials.ratios.ebitda * 7,
                methode: 'Multiple EBITDA',
                multiple: 5.5,
              }}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Zone de saisie */}
      <div className="sticky bottom-0 bg-[#1a1a2e] shadow-[0_-8px_20px_rgba(0,0,0,0.3)]">
        {uploadedDocs.length > 0 && (
          <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-0">
            <div className="max-w-3xl mx-auto flex flex-wrap gap-1.5 sm:gap-2">
              {uploadedDocs.map((doc, i) => (
                <div key={i} className="flex items-center gap-1.5 sm:gap-2 bg-white/10 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm border border-white/20">
                  <span>📄</span>
                  <span className="truncate max-w-[100px] sm:max-w-[150px] text-white/80">{doc.name}</span>
                  <button
                    onClick={() => removeDocument(i)}
                    className="text-white/40 hover:text-red-400 transition-colors p-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="p-3 sm:p-4 pb-safe">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative bg-white/5 rounded-2xl border border-white/20 focus-within:border-[#c9a227] focus-within:ring-2 focus-within:ring-[#c9a227]/20 transition-all">
              <div className="flex items-end gap-1.5 sm:gap-2 p-1.5 sm:p-2">
                <DocumentUpload onUpload={handleDocumentUpload} disabled={isLoading || isStreaming} />

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                  placeholder="Ecris ta reponse..."
                  className="flex-1 bg-transparent px-2 py-2.5 sm:py-2 resize-none focus:outline-none text-white placeholder:text-white/40 text-base"
                  rows={1}
                  disabled={isLoading || isStreaming}
                />

                <button
                  type="submit"
                  disabled={isLoading || isStreaming || (!input.trim() && !uploadedDocs.length)}
                  className="p-3 sm:p-2.5 bg-[#c9a227] text-[#1a1a2e] rounded-xl hover:bg-[#e8c547] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

            <p className="text-xs text-white/30 mt-2 text-center hidden sm:block">
              Entree pour envoyer - Maj+Entree pour un retour a la ligne
            </p>
          </form>
        </div>
      </div>

    </div>
  )
}
