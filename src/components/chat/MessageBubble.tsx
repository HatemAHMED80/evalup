'use client'

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
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    // Style utilisateur - bulle alignée à droite
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[70%]">
          {/* Documents joints */}
          {message.documents && message.documents.length > 0 && (
            <div className="mb-2 flex flex-wrap justify-end gap-2">
              {message.documents.map((doc, i) => (
                <span key={i} className="text-sm flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg text-white/70">
                  📄 {doc.name}
                </span>
              ))}
            </div>
          )}
          <div className="bg-[#c9a227] text-[#1a1a2e] rounded-2xl rounded-br-md px-4 py-3">
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
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a227] to-[#e8c547] flex items-center justify-center">
          <span className="text-[#1a1a2e] font-bold text-xs">E</span>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0 text-white/90 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1 text-white/90">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1 text-white/90">{children}</ol>,
              li: ({ children }) => <li className="mb-0.5 text-white/90">{children}</li>,
              strong: ({ children }) => <strong className="font-bold text-[#c9a227]">{children}</strong>,
              em: ({ children }) => <em className="text-sm text-white/50 block mt-2">{children}</em>,
              h1: ({ children }) => <h1 className="font-bold text-2xl mb-2 text-white">{children}</h1>,
              h2: ({ children }) => <h2 className="font-semibold text-xl mt-4 mb-2 text-white">{children}</h2>,
              h3: ({ children }) => <h3 className="font-semibold text-base mt-4 mb-2 text-white">{children}</h3>,
              h4: ({ children }) => <h4 className="font-semibold text-sm mt-3 mb-1 text-white/90">{children}</h4>,
              code: ({ children }) => (
                <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-white/90">{children}</code>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-[#c9a227] pl-3 my-3 text-white/70 italic">{children}</blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-3">
                  <table className="min-w-full text-sm border-collapse">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-white/20 px-3 py-2 bg-white/5 font-medium text-left text-white/90">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border border-white/20 px-3 py-2 text-white/80">{children}</td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
          {/* Curseur clignotant pendant le streaming */}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-[#c9a227] ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>
      </div>
    </div>
  )
}
