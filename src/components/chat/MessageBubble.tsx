'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
interface MessageBubbleProps {
  message: {
    id?: string
    role: 'user' | 'assistant'
    content: string
    timestamp?: Date
    documents?: Array<{ name: string; type: string; size: number }>
  }
  isStreaming?: boolean
  typewriter?: boolean
  onTypewriterDone?: () => void
  onSuggestionClick?: (suggestion: string) => void
  completeness?: number
  onValidateData?: () => void
}

// Types pour le parsing
interface NumericField {
  label: string
  unit: string
  optional: boolean
}

interface ParsedContent {
  mainContent: string
  context: string | null
  question: string | null
  suggestions: string[]
  numericFields: NumericField[]
  hasValidateButton: boolean
}

// Parser pour extraire les différentes sections du contenu
function parseContent(content: string): ParsedContent {
  let mainContent = content
  let context: string | null = null
  let question: string | null = null
  let suggestions: string[] = []
  let numericFields: NumericField[] = []
  let hasValidateButton = false

  // Nettoyer le contenu des code blocks qui contiennent les suggestions
  // Le modèle met parfois les suggestions dans un bloc ```
  mainContent = mainContent.replace(/```\s*\n?\[SUGGESTIONS\]/g, '[SUGGESTIONS]')
  mainContent = mainContent.replace(/\[\/SUGGESTIONS\]\s*\n?```/g, '[/SUGGESTIONS]')

  // Même nettoyage pour [NUMERIC_FIELDS]
  mainContent = mainContent.replace(/```\s*\n?\[NUMERIC_FIELDS\]/g, '[NUMERIC_FIELDS]')
  mainContent = mainContent.replace(/\[\/NUMERIC_FIELDS\]\s*\n?```/g, '[/NUMERIC_FIELDS]')

  // Extraire les suggestions (plusieurs formats possibles)
  // Format 1: [SUGGESTIONS]opt1|opt2|opt3[/SUGGESTIONS]
  // Format 2: [SUGGESTIONS]\nopt1|opt2|opt3\n[/SUGGESTIONS]
  // Format 3: [SUGGESTIONS] opt1|opt2|opt3 (sans balise fermante)
  const suggestionsMatchClosed = mainContent.match(/\[SUGGESTIONS\]\s*\n?([\s\S]+?)\n?\s*\[\/SUGGESTIONS\]/i)
  const suggestionsMatchOpen = mainContent.match(/\[SUGGESTIONS\]\s*\n?(.+?)(?:\n|$)/im)

  if (suggestionsMatchClosed) {
    // Extraire les options séparées par |
    const rawSuggestions = suggestionsMatchClosed[1].trim()
    suggestions = rawSuggestions.split('|').map(s => s.trim()).filter(Boolean)
    // Supprimer le bloc complet
    mainContent = mainContent.replace(/\[SUGGESTIONS\]\s*\n?[\s\S]+?\n?\s*\[\/SUGGESTIONS\]/i, '').trim()
  } else if (suggestionsMatchOpen) {
    const rawSuggestions = suggestionsMatchOpen[1].trim()
    suggestions = rawSuggestions.split('|').map(s => s.trim()).filter(Boolean)
    mainContent = mainContent.replace(/\[SUGGESTIONS\]\s*\n?.+?(?:\n|$)/im, '').trim()
  }

  // Si on a extrait des suggestions, supprimer aussi les lignes qui les répètent
  // (le modèle liste parfois les suggestions en texte après le bloc)
  if (suggestions.length > 0) {
    for (const suggestion of suggestions) {
      // Supprimer les lignes qui ne contiennent que cette suggestion
      const escapedSuggestion = suggestion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      mainContent = mainContent.replace(new RegExp(`^\\s*${escapedSuggestion}\\s*$`, 'gm'), '')
    }
    // Nettoyer les lignes vides multiples
    mainContent = mainContent.replace(/\n{3,}/g, '\n\n').trim()
  }

  // Extraire les champs numériques [NUMERIC_FIELDS]
  const numericMatch = mainContent.match(
    /\[NUMERIC_FIELDS\]\s*\n?([\s\S]+?)\n?\s*\[\/NUMERIC_FIELDS\]/i
  )

  if (numericMatch) {
    const rawBlock = numericMatch[1].trim()
    numericFields = rawBlock
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split('|').map(p => p.trim())
        return {
          label: parts[0] || '',
          unit: parts[1] || '',
          optional: parts[2] === '?',
        }
      })
      .filter(f => f.label.length > 0)

    // Supprimer le bloc du contenu affiché
    mainContent = mainContent
      .replace(/\[NUMERIC_FIELDS\]\s*\n?[\s\S]+?\n?\s*\[\/NUMERIC_FIELDS\]/i, '')
      .trim()
  }

  // Extraire le contexte
  const contextMatch = mainContent.match(/\[CONTEXT\]([\s\S]*?)\[\/CONTEXT\]/m)
  if (contextMatch) {
    context = contextMatch[1].trim()
    mainContent = mainContent.replace(/\[CONTEXT\][\s\S]*?\[\/CONTEXT\]/m, '').trim()
  }

  // Extraire la question
  const questionMatch = mainContent.match(/\[QUESTION\]([\s\S]*?)\[\/QUESTION\]/m)
  if (questionMatch) {
    question = questionMatch[1].trim()
    mainContent = mainContent.replace(/\[QUESTION\][\s\S]*?\[\/QUESTION\]/m, '').trim()
  }

  // Detecter le bouton de validation [VALIDATE_DATA]
  if (mainContent.includes('[VALIDATE_DATA]')) {
    hasValidateButton = true
    mainContent = mainContent.replace('[VALIDATE_DATA]', '').trim()
  }

  return { mainContent, context, question, suggestions, numericFields, hasValidateButton }
}

export function MessageBubble({
  message,
  isStreaming = false,
  typewriter = false,
  onTypewriterDone,
  onSuggestionClick,
  completeness,
  onValidateData,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  const [numericValues, setNumericValues] = useState<Record<string, string>>({})

  // Typewriter effect — stable refs to avoid dependency churn
  const [charIndex, setCharIndex] = useState(typewriter ? 0 : -1)
  const typewriterDoneRef = useRef(false)
  const onTypewriterDoneRef = useRef(onTypewriterDone)
  onTypewriterDoneRef.current = onTypewriterDone

  // Interval: runs once, increments charIndex until done
  useEffect(() => {
    if (!typewriter) return
    const contentLen = message.content.length
    const timer = setInterval(() => {
      setCharIndex(prev => {
        const next = prev + 1
        if (next >= contentLen) {
          clearInterval(timer)
          return contentLen
        }
        return next
      })
    }, 35)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typewriter])

  // Completion detection: fires callback once when typewriter finishes
  useEffect(() => {
    if (typewriter && charIndex >= message.content.length && !typewriterDoneRef.current) {
      typewriterDoneRef.current = true
      onTypewriterDoneRef.current?.()
    }
  }, [typewriter, charIndex, message.content.length])

  const isTypewriting = typewriter && charIndex >= 0 && charIndex < message.content.length
  const displayContent = typewriter ? message.content.slice(0, Math.max(0, charIndex)) : message.content

  // Detect onboarding message for serif styling
  const isOnboarding = message.id === 'initial' || message.id === 'onboarding-1'

  // Extraire les différentes sections du contenu
  const { mainContent, context, question, suggestions, numericFields, hasValidateButton } = isUser
    ? { mainContent: message.content, context: null, question: null, suggestions: [], numericFields: [], hasValidateButton: false }
    : parseContent(displayContent.replace('[EVALUATION_COMPLETE]', ''))

  // Toggle une suggestion
  const toggleSuggestion = (suggestion: string) => {
    setSelectedSuggestions(prev =>
      prev.includes(suggestion)
        ? prev.filter(s => s !== suggestion)
        : [...prev, suggestion]
    )
  }

  // Envoyer les suggestions sélectionnées
  const sendSelectedSuggestions = () => {
    if (selectedSuggestions.length > 0 && onSuggestionClick) {
      onSuggestionClick(selectedSuggestions.join(', '))
      setSelectedSuggestions([])
    }
  }

  // Champs numériques — mise à jour
  const handleNumericChange = (label: string, value: string) => {
    // Garder digits, espaces, virgules, points (format FR)
    const cleaned = value.replace(/[^\d\s.,]/g, '')
    setNumericValues(prev => ({ ...prev, [label]: cleaned }))
  }

  // Champs numériques — envoi
  const submitNumericFields = () => {
    const lines = numericFields
      .filter(f => {
        const val = numericValues[f.label]?.trim()
        return val && val.length > 0
      })
      .map(f => {
        const rawVal = numericValues[f.label].trim()
        // Parser et formater en FR
        const num = parseFloat(rawVal.replace(/\s/g, '').replace(',', '.'))
        const formatted = !isNaN(num)
          ? new Intl.NumberFormat('fr-FR').format(num)
          : rawVal
        return `• ${f.label} : ${formatted} ${f.unit}`.trim()
      })

    if (lines.length > 0 && onSuggestionClick) {
      onSuggestionClick(lines.join('\n'))
      setNumericValues({})
    }
  }

  // Au moins un champ requis rempli
  const canSubmitNumeric = numericFields.length > 0 && numericFields.some(f => {
    const val = numericValues[f.label]?.trim()
    return val && val.length > 0
  })

  if (isUser) {
    // Style utilisateur - bulle alignée à droite
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[70%]">
          {/* Documents joints */}
          {message.documents && message.documents.length > 0 && (
            <div className="mb-2 flex flex-wrap justify-end gap-2">
              {message.documents.map((doc, i) => (
                <span key={i} className="text-sm flex items-center gap-1 bg-[var(--bg-tertiary)] px-2 py-1 rounded-[var(--radius-md)] text-[var(--text-secondary)]">
                  📄 {doc.name}
                </span>
              ))}
            </div>
          )}
          <div className="bg-[var(--accent)] text-white rounded-2xl rounded-br-md px-4 py-3">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    )
  }

  // Style assistant - style Claude, pas de bulle
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
          <span className="text-white font-bold text-xs">E</span>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0 pt-1">
        <div className={`prose prose-sm max-w-none ${isOnboarding ? 'font-serif text-[15px] leading-[1.8]' : ''}`} style={isOnboarding ? { fontFamily: "Georgia, 'Times New Roman', serif" } : undefined}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0 text-[var(--text-primary)] leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1 text-[var(--text-primary)]">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1 text-[var(--text-primary)]">{children}</ol>,
              li: ({ children }) => <li className="mb-0.5 text-[var(--text-primary)]">{children}</li>,
              strong: ({ children }) => <strong className="font-bold text-[var(--accent)]">{children}</strong>,
              em: ({ children }) => <em className="text-sm text-[var(--text-tertiary)] block mt-2">{children}</em>,
              h1: ({ children }) => <h1 className="font-bold text-2xl mb-2 text-[var(--text-primary)]">{children}</h1>,
              h2: ({ children }) => <h2 className="font-semibold text-xl mt-4 mb-2 text-[var(--text-primary)]">{children}</h2>,
              h3: ({ children }) => <h3 className="font-semibold text-base mt-4 mb-2 text-[var(--text-primary)]">{children}</h3>,
              h4: ({ children }) => <h4 className="font-semibold text-sm mt-3 mb-1 text-[var(--text-primary)]">{children}</h4>,
              code: ({ children }) => (
                <code className="bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--text-primary)]">{children}</code>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-[var(--accent)] pl-3 my-3 text-[var(--text-secondary)] italic">{children}</blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-3">
                  <table className="min-w-full text-sm border-collapse">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-[var(--border)] px-3 py-2 bg-[var(--bg-tertiary)] font-medium text-left text-[var(--text-primary)]">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border border-[var(--border)] px-3 py-2 text-[var(--text-secondary)]">{children}</td>
              ),
            }}
          >
            {mainContent}
          </ReactMarkdown>

          {/* Contexte en petit, gris, italique */}
          {context && (
            <div className="mt-3 text-xs text-[var(--text-tertiary)] italic leading-relaxed">
              {context.split('\n').map((line, i) => (
                <p key={i} className="mb-1">{line}</p>
              ))}
            </div>
          )}

          {/* Question en accent gras - toujours à la fin */}
          {question && (
            <p className="mt-4 text-[var(--accent)] font-semibold text-base">
              {question}
            </p>
          )}

          {/* Curseur clignotant pendant le streaming ou typewriter */}
          {(isStreaming || isTypewriting) && (
            <span className="inline-block w-2 h-4 bg-[var(--accent)] ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>

        {/* Réponses suggérées avec multi-sélection */}
        {suggestions.length > 0 && !isStreaming && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion: string, index: number) => {
                const isSelected = selectedSuggestions.includes(suggestion)
                return (
                  <button
                    key={index}
                    onClick={() => toggleSuggestion(suggestion)}
                    className={`px-4 py-2 border rounded-[var(--radius-full)] text-sm transition-all ${
                      isSelected
                        ? 'bg-[var(--accent-light)] border-[var(--accent)] text-[var(--accent)]'
                        : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {suggestion}
                  </button>
                )
              })}
            </div>
            {/* Bouton envoyer quand des suggestions sont sélectionnées */}
            {selectedSuggestions.length > 0 && (
              <button
                onClick={sendSelectedSuggestions}
                className="mt-3 px-5 py-2 bg-[var(--accent)] text-white rounded-[var(--radius-full)] text-sm font-medium hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2"
              >
                Envoyer {selectedSuggestions.length > 1 ? `(${selectedSuggestions.length})` : ''}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Bouton de validation des donnees */}
        {hasValidateButton && !isStreaming && (
          <div className="mt-5">
            <button
              onClick={() => onValidateData?.()}
              disabled={completeness !== undefined && completeness < 60}
              className={`w-full px-6 py-3.5 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 ${
                completeness !== undefined && completeness >= 60
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Valider mes données — {completeness ?? 0}%
            </button>
            {completeness !== undefined && completeness < 60 && (
              <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">
                Complétez les données financières et qualitatives pour atteindre 60%
              </p>
            )}
          </div>
        )}

        {/* Champs numériques structurés */}
        {numericFields.length > 0 && !isStreaming && (
          <div className="mt-4 space-y-2.5">
            {numericFields.map((field, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-lg)] px-4 py-3 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all"
              >
                <label className="text-sm text-[var(--text-primary)] font-medium whitespace-nowrap flex-shrink-0">
                  {field.label}
                  {field.optional && (
                    <span className="text-[var(--text-tertiary)] font-normal ml-1 text-xs">(optionnel)</span>
                  )}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={numericValues[field.label] || ''}
                  onChange={(e) => handleNumericChange(field.label, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canSubmitNumeric) {
                      e.preventDefault()
                      submitNumericFields()
                    }
                  }}
                  placeholder="0"
                  className="flex-1 min-w-0 bg-transparent text-right text-[var(--text-primary)] text-sm font-medium outline-none placeholder:text-[var(--text-tertiary)]"
                />
                {field.unit && (
                  <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap flex-shrink-0">
                    {field.unit}
                  </span>
                )}
              </div>
            ))}

            {/* Bouton envoyer */}
            <button
              onClick={submitNumericFields}
              disabled={!canSubmitNumeric}
              className="mt-1 px-5 py-2.5 bg-[var(--accent)] text-white rounded-[var(--radius-full)] text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              Envoyer
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
