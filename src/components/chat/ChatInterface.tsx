'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { DocumentUpload } from './DocumentUpload'
import { DownloadReport } from './DownloadReport'
import { useEvaluationDraft } from '@/hooks/useEvaluationDraft'
import { getDraftBySiren } from '@/lib/evaluation-draft'
import type { ConversationContext, Message, UploadedDocument } from '@/lib/anthropic'
import { ChatActionButton } from './ChatActionButton'
import { MESSAGE_ONBOARDING_WELCOME, MESSAGE_ONBOARDING_VALIDATE } from '@/lib/prompts/messages'
import { trackConversion } from '@/lib/analytics'
import { contextToPanel, computeOverallCompleteness } from '@/components/evaluation/dataPanelBridge'

const KNOWN_FIELD_LABELS = [
  "chiffre d'affaires", "resultat net", "resultat d'exploitation",
  "amortissements", "tresorerie", "dettes financieres", "capitaux propres",
  "creances clients", "dettes fournisseurs", "stocks", "provisions",
  "ebitda", "marge", "mrr", "arr", "churn", "cac", "ltv", "nrr", "runway",
  "salaire dirigeant", "loyer", "credit-bail",
  "dependance dirigeant", "concentration clients",
]

function detectMentionedFields(text: string): string[] {
  const lower = text.toLowerCase()
  return KNOWN_FIELD_LABELS.filter(label => lower.includes(label))
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
  context: ConversationContext
  onContextChange: React.Dispatch<React.SetStateAction<ConversationContext>>
  onStepChange?: (step: number) => void
  previousMessages?: { role: 'assistant' | 'user', content: string }[]
  onOpenDataPanel?: () => void
  onCloseDataPanel?: () => void
  dataPanelVisible?: boolean
  onFieldsMentioned?: (fields: string[]) => void
}

export function ChatInterface({ entreprise, context, onContextChange: setContext, onStepChange, previousMessages, onOpenDataPanel, onCloseDataPanel, dataPanelVisible, onFieldsMentioned }: ChatInterfaceProps) {
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
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([])

  // Onboarding state machine
  const [onboardingPhase, setOnboardingPhase] = useState<'typewriter' | 'panel-open' | 'waiting-validation' | 'done'>(
    previousMessages?.length ? 'done' : 'typewriter'
  )

  // Compute completeness directly from context (no useMemo — always fresh)
  const _panel = contextToPanel(context)
  const overallCompleteness = computeOverallCompleteness(_panel, context.archetype)

  const router = useRouter()

  const messagesRef = useRef<Message[]>(messages)
  messagesRef.current = messages

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Hook pour la sauvegarde automatique
  const { save: saveDraft, complete: completeDraft } = useEvaluationDraft({
    siren: entreprise.siren,
    entrepriseNom: entreprise.nom,
  })

  // Scanner les previousMessages pour détecter l'étape au chargement
  useEffect(() => {
    if (!previousMessages?.length) return
    for (let i = previousMessages.length - 1; i >= 0; i--) {
      if (previousMessages[i].role === 'assistant') {
        const text = previousMessages[i].content as string
        if (text) {
          detectStep(text)
          break
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initialisation : brouillon OU onboarding (un seul useEffect pour éviter les conflits)
  useEffect(() => {
    if (previousMessages?.length) return

    // 1. Tenter de restaurer un brouillon
    const existingDraft = getDraftBySiren(entreprise.siren)
    const hasUserMessages = existingDraft?.messages.some(m => m.role === 'user') ?? false
    if (existingDraft && !existingDraft.isCompleted && hasUserMessages && existingDraft.messages.length > 1) {
      setMessages(existingDraft.messages)
      setContext(existingDraft.context)
      setOnboardingPhase('done')
      onStepChange?.(existingDraft.step)
      for (let i = existingDraft.messages.length - 1; i >= 0; i--) {
        if (existingDraft.messages[i].role === 'assistant') {
          const text = existingDraft.messages[i].content as string
          if (text) {
            detectStep(text)
            break
          }
        }
      }
      return // Draft restauré → pas d'onboarding
    }

    // 2. Pas de brouillon → lancer l'onboarding
    const dataYear = context.financials?.bilans?.[0]?.annee || null
    const currentYear = new Date().getFullYear()
    const nextYear = dataYear ? dataYear + 1 : currentYear

    const msg1: Message = {
      id: 'onboarding-1',
      role: 'assistant',
      content: MESSAGE_ONBOARDING_WELCOME({ nom: entreprise.nom, dataYear, nextYear }),
      timestamp: new Date(),
    }
    setMessages([msg1])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entreprise.siren])

  // Sauvegarde automatique
  useEffect(() => {
    if (messages.length > 1 && !isStreaming && onboardingPhase === 'done') {
      const timeoutId = setTimeout(() => {
        saveDraft(context, messages, context.evaluationProgress.step)
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [messages, context, isStreaming, saveDraft, onboardingPhase])

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
    // Marqueur explicite : 📍 Étape X/6
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
      return
    }

    // Détection par contenu : si la réponse contient le résultat de valorisation
    const hasValuation = text.includes('Fourchette finale') ||
      text.includes('Prix de Cession') ||
      text.includes('prix de cession') ||
      text.includes('Valorisation finale') ||
      text.includes('valorisation finale') ||
      (text.includes('Valeur d\'Entreprise') && text.includes('Note de confiance')) ||
      (text.includes('fourchette') && text.includes('valorisation') && text.includes('€'))
    if (hasValuation) {
      setContext(prev => ({
        ...prev,
        evaluationProgress: {
          ...prev.evaluationProgress,
          step: 6,
        },
      }))
      onStepChange?.(6)
    }
  }, [onStepChange, setContext])

  // Ref stable pour onOpenDataPanel (évite de recréer handleTypewriterDone)
  const onOpenDataPanelRef = useRef(onOpenDataPanel)
  onOpenDataPanelRef.current = onOpenDataPanel

  // Onboarding: typewriter done → open panel + show validation message
  const handleTypewriterDone = useCallback(() => {
    setOnboardingPhase('panel-open')
    onOpenDataPanelRef.current?.()

    // After 2s, add the validation message
    setTimeout(() => {
      const msg2: Message = {
        id: 'onboarding-2',
        role: 'assistant',
        content: MESSAGE_ONBOARDING_VALIDATE(),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, msg2])
      setOnboardingPhase('waiting-validation')
    }, 2000)
  }, [])

  // Onboarding: validate data button clicked
  const handleValidateData = useCallback(() => {
    setOnboardingPhase('done')

    // Build a summary of the financial data
    const bilans = context.financials?.bilans || []
    const lines: string[] = []
    for (const bilan of bilans) {
      const year = bilan.annee
      if (bilan.chiffre_affaires) lines.push(`- CA ${year} : ${new Intl.NumberFormat('fr-FR').format(bilan.chiffre_affaires)} EUR`)
      if (bilan.resultat_net) lines.push(`- Résultat net ${year} : ${new Intl.NumberFormat('fr-FR').format(bilan.resultat_net)} EUR`)
      if (bilan.resultat_exploitation) lines.push(`- Résultat d'exploitation ${year} : ${new Intl.NumberFormat('fr-FR').format(bilan.resultat_exploitation)} EUR`)
    }
    if (context.financials?.ratios?.ebitda) {
      lines.push(`- EBITDA : ${new Intl.NumberFormat('fr-FR').format(context.financials.ratios.ebitda)} EUR`)
    }
    lines.push(`- Complétion : ${overallCompleteness ?? 0}%`)

    const summary = `J'ai vérifié les données. Voici mon résumé :\n${lines.join('\n')}`
    sendMessage(summary)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.financials, overallCompleteness])

  // Refaire l'évaluation : reset chat, garder l'entreprise et les données
  const handleResetEvaluation = useCallback(() => {
    // Reset evaluation progress
    setContext(prev => ({
      ...prev,
      evaluationProgress: {
        ...prev.evaluationProgress,
        step: 0,
        completedTopics: [],
        pendingTopics: prev.evaluationProgress.pendingTopics,
      },
    }))
    onStepChange?.(0)

    // Restart onboarding
    const dataYear = context.financials?.bilans?.[0]?.annee || null
    const currentYear = new Date().getFullYear()
    const nextYear = dataYear ? dataYear + 1 : currentYear

    const msg1: Message = {
      id: `onboarding-reset-${Date.now()}`,
      role: 'assistant',
      content: MESSAGE_ONBOARDING_WELCOME({ nom: entreprise.nom, dataYear, nextYear }),
      timestamp: new Date(),
    }
    setMessages([msg1])
    setOnboardingPhase('typewriter')
  }, [context.financials, entreprise.nom, onStepChange, setContext])

  // Handler pour clic sur une suggestion
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  // Envoyer un message
  const sendMessage = async (content: string, documents?: File[]) => {
    if (!content.trim() && !documents?.length) return

    // Gérer le clic sur "Oui, je veux affiner mon évaluation"
    if (content.toLowerCase().includes('affiner mon évaluation') || content.toLowerCase().includes('oui, je veux affiner')) {
      trackConversion('checkout_started', { siren: entreprise.siren, plan: 'eval_complete' })
      router.push(`/checkout?siren=${entreprise.siren}&plan=eval_complete`)
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

      const allMessages = [...messagesRef.current, { ...userMessage, content: messageContent }]
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

          const mentioned = detectMentionedFields(fullText)
          if (mentioned.length > 0) onFieldsMentioned?.(mentioned)
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

  return (
    <div className="flex flex-col h-full relative">
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 md:p-6 pb-0">
        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 pb-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              typewriter={message.id === 'onboarding-1' && onboardingPhase === 'typewriter'}
              onTypewriterDone={message.id === 'onboarding-1' ? handleTypewriterDone : undefined}
              onSuggestionClick={handleSuggestionClick}
              completeness={message.id === 'onboarding-2' ? overallCompleteness : undefined}
              onValidateData={message.id === 'onboarding-2' ? handleValidateData : undefined}
            />
          ))}

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

          {/* Toggle data panel button — permanent */}
          {messages.length >= 1 && !isLoading && !isStreaming && (
            <div className="flex gap-3 mt-2">
              <div className="w-8 flex-shrink-0" />
              {dataPanelVisible ? (
                <ChatActionButton
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                  label="Fermer le panneau"
                  variant="subtle"
                  onClick={() => onCloseDataPanel?.()}
                />
              ) : (
                <ChatActionButton
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-12.75A1.125 1.125 0 013.375 4.5h17.25c.621 0 1.125.504 1.125 1.125v12.75m-20.625 0h20.625m0 0a1.125 1.125 0 01-1.125 1.125m1.125-1.125V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m0 0h-7.5" />
                    </svg>
                  }
                  label="Ouvrir le panneau de donnees"
                  variant="outline"
                  onClick={() => onOpenDataPanel?.()}
                />
              )}
            </div>
          )}

          {/* Bouton de telechargement du rapport */}
          {context.evaluationProgress.step >= 6 && !isLoading && !isStreaming && (
            <DownloadReport
              context={context}
              messages={messages}
              onOpenDataPanel={onOpenDataPanel}
              onResetEvaluation={handleResetEvaluation}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Zone de saisie */}
      <div className="sticky bottom-0 bg-[var(--bg-primary)] border-t border-[var(--border)] shadow-[var(--shadow-md)]">
        {uploadedDocs.length > 0 && (
          <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-0">
            <div className="max-w-3xl mx-auto flex flex-wrap gap-1.5 sm:gap-2">
              {uploadedDocs.map((doc, i) => (
                <div key={i} className="flex items-center gap-1.5 sm:gap-2 bg-[var(--bg-tertiary)] px-2.5 sm:px-3 py-1.5 rounded-[var(--radius-full)] text-xs sm:text-sm border border-[var(--border)]">
                  <span>📄</span>
                  <span className="truncate max-w-[100px] sm:max-w-[150px] text-[var(--text-secondary)]">{doc.name}</span>
                  <button
                    onClick={() => removeDocument(i)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors p-0.5"
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
            <div className="relative bg-[var(--bg-secondary)] rounded-[var(--radius-xl)] border border-[var(--border)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
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
                  placeholder={onboardingPhase !== 'done' ? 'Vérifiez vos données dans le panneau à droite...' : 'Ecris ta reponse...'}
                  className="flex-1 bg-transparent px-2 py-2.5 sm:py-2 resize-none focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-base"
                  rows={1}
                  disabled={isLoading || isStreaming || onboardingPhase !== 'done'}
                />

                <button
                  type="submit"
                  disabled={isLoading || isStreaming || onboardingPhase !== 'done' || (!input.trim() && !uploadedDocs.length)}
                  className="p-3 sm:p-2.5 bg-[var(--accent)] text-white rounded-[var(--radius-lg)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

            <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center hidden sm:block">
              Entree pour envoyer - Maj+Entree pour un retour a la ligne
            </p>
          </form>
        </div>
      </div>

    </div>
  )
}
