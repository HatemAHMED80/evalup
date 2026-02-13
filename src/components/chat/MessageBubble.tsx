'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
interface MessageBubbleProps {
  message: {
    id?: string
    role: 'user' | 'assistant'
    content: string
    timestamp?: Date
    documents?: Array<{ name: string; type: string; size: number }>
  }
  isStreaming?: boolean
  onSuggestionClick?: (suggestion: string) => void
}

// Types pour le parsing
interface ParsedContent {
  mainContent: string
  context: string | null
  question: string | null
  suggestions: string[]
}

// Parser pour extraire les différentes sections du contenu
function parseContent(content: string): ParsedContent {
  let mainContent = content
  let context: string | null = null
  let question: string | null = null
  let suggestions: string[] = []

  // Nettoyer le contenu des code blocks qui contiennent les suggestions
  // Le modèle met parfois les suggestions dans un bloc ```
  mainContent = mainContent.replace(/```\s*\n?\[SUGGESTIONS\]/g, '[SUGGESTIONS]')
  mainContent = mainContent.replace(/\[\/SUGGESTIONS\]\s*\n?```/g, '[/SUGGESTIONS]')

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

  return { mainContent, context, question, suggestions }
}

export function MessageBubble({
  message,
  isStreaming = false,
  onSuggestionClick,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])

  // Extraire les différentes sections du contenu
  const { mainContent, context, question, suggestions } = isUser
    ? { mainContent: message.content, context: null, question: null, suggestions: [] }
    : parseContent(message.content.replace('[EVALUATION_COMPLETE]', '').replace(/\[DATA_UPDATE\][\s\S]*?\[\/DATA_UPDATE\]/gi, ''))

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
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
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

          {/* Curseur clignotant pendant le streaming */}
          {isStreaming && (
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
      </div>
    </div>
  )
}
