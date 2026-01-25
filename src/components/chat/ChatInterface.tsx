'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { DocumentUpload } from './DocumentUpload'
import { InitialDocumentUpload } from './InitialDocumentUpload'
import { DownloadReport } from './DownloadReport'
import { useEvaluationDraft } from '@/hooks/useEvaluationDraft'
import { getDraftBySiren, formatRelativeTime } from '@/lib/evaluation-draft'
import type { ConversationContext, Message, UploadedDocument } from '@/lib/anthropic'
import { MESSAGE_INITIAL } from '@/lib/prompts/base'

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
}

export function ChatInterface({ entreprise, initialContext, onStepChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [context, setContext] = useState(initialContext)
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([])
  const [showInitialUpload, setShowInitialUpload] = useState(true)
  const [isInitialUploading, setIsInitialUploading] = useState(false)
  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const [draftInfo, setDraftInfo] = useState<{ step: number; lastUpdated: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Hook pour la sauvegarde automatique
  const { save: saveDraft, complete: completeDraft } = useEvaluationDraft({
    siren: entreprise.siren,
    entrepriseNom: entreprise.nom,
  })

  // Vérifier s'il existe un brouillon au chargement
  useEffect(() => {
    const existingDraft = getDraftBySiren(entreprise.siren)
    if (existingDraft && !existingDraft.isCompleted && existingDraft.messages.length > 1) {
      setShowDraftBanner(true)
      setDraftInfo({
        step: existingDraft.step,
        lastUpdated: existingDraft.lastUpdated,
      })
    }
  }, [entreprise.siren])

  // Restaurer un brouillon
  const restoreDraft = useCallback(() => {
    const draft = getDraftBySiren(entreprise.siren)
    if (draft) {
      setMessages(draft.messages)
      setContext(draft.context)
      setShowInitialUpload(false)
      setShowDraftBanner(false)
      onStepChange?.(draft.step)
    }
  }, [entreprise.siren, onStepChange])

  // Ignorer le brouillon et recommencer
  const ignoreDraft = useCallback(() => {
    setShowDraftBanner(false)
  }, [])

  // Message initial de l'IA
  useEffect(() => {
    const caFormate = entreprise.chiffreAffaires
      ? `${entreprise.chiffreAffaires.toLocaleString('fr-FR')} €`
      : undefined

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
      }),
      timestamp: new Date(),
    }
    setMessages([initialMessage])
  }, [entreprise])

  // Sauvegarde automatique après chaque message (debounced)
  useEffect(() => {
    if (messages.length > 1 && !isStreaming) {
      const timeoutId = setTimeout(() => {
        saveDraft(context, messages, context.evaluationProgress.step)
      }, 2000) // Attendre 2 secondes après le dernier changement

      return () => clearTimeout(timeoutId)
    }
  }, [messages, context, isStreaming, saveDraft])

  // Marquer comme terminé quand l'évaluation est finie
  useEffect(() => {
    if (context.evaluationProgress.step >= 6) {
      completeDraft()
    }
  }, [context.evaluationProgress.step, completeDraft])

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

  // Auto-focus textarea après la réponse de l'IA
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

  // Envoyer un message
  const sendMessage = async (content: string, documents?: File[]) => {
    if (!content.trim() && !documents?.length) return

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
      // Si documents uploadés, les analyser d'abord
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

      // Mettre à jour le contexte avec les documents
      const updatedContext: ConversationContext = {
        ...context,
        documents: [...context.documents, ...documentsAnalysis],
      }
      setContext(updatedContext)

      // Construire le contenu avec les analyses de documents
      let messageContent = content
      if (documentsAnalysis.length > 0) {
        messageContent += '\n\n--- Analyse des documents joints ---\n'
        for (const doc of documentsAnalysis) {
          if (doc.analysis && !doc.analysis.error) {
            messageContent += `\nDocument: ${doc.name}\n`
            messageContent += `Type: ${doc.analysis.typeDocument || 'Non identifié'}\n`
            if (doc.analysis.chiffresExtraits) {
              messageContent += `Chiffres extraits: ${JSON.stringify(doc.analysis.chiffresExtraits)}\n`
            }
            if (doc.analysis.pointsCles?.length) {
              messageContent += `Points clés: ${doc.analysis.pointsCles.join(', ')}\n`
            }
          }
        }
      }

      // Démarrer le streaming
      setIsLoading(false)
      setIsStreaming(true)
      setStreamingContent('')

      // Envoyer au chat avec streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { ...userMessage, content: messageContent }].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: updatedContext,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur de communication')
      }

      // Lire le stream et afficher progressivement
      await readStream(
        response,
        (text) => setStreamingContent(text),
        (fullText) => {
          // Ajouter le message complet
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullText,
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, assistantMessage])
          setStreamingContent('')
          setIsStreaming(false)

          // Détecter l'étape actuelle
          const stepMatch = fullText.match(/📍\s*(?:\*\*)?Étape\s*(\d+)\/6/i)
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
        }
      )

    } catch (error) {
      console.error('Erreur envoi message:', error)
      setIsStreaming(false)
      setStreamingContent('')
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Désolé, j'ai rencontré une erreur. Peux-tu réessayer ?",
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

  // Gestion de l'upload initial de documents
  const handleInitialUpload = async (files: File[]) => {
    setIsInitialUploading(true)

    try {
      // Analyser tous les documents
      const documentsAnalysis: UploadedDocument[] = []
      for (const doc of files) {
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

      // Mettre à jour le contexte avec les documents
      const updatedContext: ConversationContext = {
        ...context,
        documents: [...context.documents, ...documentsAnalysis],
      }
      setContext(updatedContext)

      // Ajouter un message système indiquant les documents uploadés
      const docsSummary = documentsAnalysis.map(d => {
        const type = d.analysis?.typeDocument || 'Document'
        return `- ${d.name} (${type})`
      }).join('\n')

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: `J'ai uploadé ${files.length} document${files.length > 1 ? 's' : ''} pour l'évaluation :\n${docsSummary}`,
        timestamp: new Date(),
        documents: documentsAnalysis.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          size: d.size,
        })),
      }
      setMessages(prev => [...prev, userMessage])

      // Construire le contenu avec les analyses
      let messageContent = `L'utilisateur a uploadé ${files.length} document(s) pour faciliter l'évaluation. Voici l'analyse de chaque document :\n\n`
      for (const doc of documentsAnalysis) {
        if (doc.analysis && !doc.analysis.error) {
          messageContent += `=== Document: ${doc.name} ===\n`
          messageContent += `Type: ${doc.analysis.typeDocument || 'Non identifié'}\n`
          if (doc.analysis.annee) {
            messageContent += `Année: ${doc.analysis.annee}\n`
          }
          if (doc.analysis.chiffresExtraits) {
            messageContent += `Chiffres extraits: ${JSON.stringify(doc.analysis.chiffresExtraits, null, 2)}\n`
          }
          if (doc.analysis.pointsCles?.length) {
            messageContent += `Points clés: ${doc.analysis.pointsCles.join(', ')}\n`
          }
          if (doc.analysis.anomalies?.length) {
            messageContent += `Anomalies détectées: ${JSON.stringify(doc.analysis.anomalies)}\n`
          }
          messageContent += '\n'
        }
      }

      // Masquer l'upload initial et démarrer le streaming de la réponse
      setShowInitialUpload(false)
      setIsStreaming(true)
      setStreamingContent('')

      // Envoyer au chat pour que l'IA commente les documents
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: messageContent }],
          context: updatedContext,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur de communication')
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
        }
      )

    } catch (error) {
      console.error('Erreur upload initial:', error)
      setShowInitialUpload(false)
    } finally {
      setIsInitialUploading(false)
    }
  }

  const handleSkipInitialUpload = () => {
    setShowInitialUpload(false)
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Banner pour reprendre une évaluation en cours */}
      {showDraftBanner && draftInfo && (
        <div className="bg-gradient-to-r from-[#c9a227]/20 to-[#e8c547]/20 border-b border-[#c9a227]/30 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#c9a227]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#c9a227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Évaluation en cours</p>
                <p className="text-white/60 text-xs">
                  Étape {draftInfo.step}/6 • {formatRelativeTime(draftInfo.lastUpdated)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={restoreDraft}
                className="px-3 py-1.5 bg-[#c9a227] text-[#1a1a2e] text-sm font-medium rounded-lg hover:bg-[#e8c547] transition-colors"
              >
                Reprendre
              </button>
              <button
                onClick={ignoreDraft}
                className="px-3 py-1.5 bg-white/10 text-white/70 text-sm rounded-lg hover:bg-white/20 transition-colors"
              >
                Recommencer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zone de messages - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-0">
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Zone d'upload initial - après le premier message */}
          {showInitialUpload && messages.length === 1 && (
            <div className="mt-4">
              <InitialDocumentUpload
                onUpload={handleInitialUpload}
                onSkip={handleSkipInitialUpload}
                isUploading={isInitialUploading}
              />
            </div>
          )}

          {/* Message en cours de streaming */}
          {isStreaming && streamingContent && (
            <MessageBubble
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingContent,
                timestamp: new Date(),
              }}
              isStreaming={true}
            />
          )}
          {isLoading && <TypingIndicator />}

          {/* Bouton de téléchargement du rapport - étape 6 */}
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

      {/* Zone de saisie - sticky en bas */}
      <div className="sticky bottom-0 bg-[#1a1a2e] shadow-[0_-8px_20px_rgba(0,0,0,0.3)]">
        {/* Documents uploadés en attente */}
        {uploadedDocs.length > 0 && (
          <div className="px-4 pt-3 pb-0">
            <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
              {uploadedDocs.map((doc, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm border border-white/20">
                  <span>📄</span>
                  <span className="truncate max-w-[150px] text-white/80">{doc.name}</span>
                  <button
                    onClick={() => removeDocument(i)}
                    className="text-white/40 hover:text-red-400 transition-colors"
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
        <div className="p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative bg-white/5 rounded-2xl border border-white/20 focus-within:border-[#c9a227] focus-within:ring-2 focus-within:ring-[#c9a227]/20 transition-all">
              <div className="flex items-end gap-2 p-2">
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
                  placeholder="Écris ta réponse..."
                  className="flex-1 bg-transparent px-2 py-2 resize-none focus:outline-none text-white placeholder:text-white/40"
                  rows={1}
                  disabled={isLoading || isStreaming}
                />

                <button
                  type="submit"
                  disabled={isLoading || isStreaming || (!input.trim() && !uploadedDocs.length)}
                  className="p-2.5 bg-[#c9a227] text-[#1a1a2e] rounded-xl hover:bg-[#e8c547] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

            <p className="text-xs text-white/30 mt-2 text-center">
              Entrée pour envoyer • Maj+Entrée pour un retour à la ligne
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
