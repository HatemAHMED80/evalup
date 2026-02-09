import { ReactNode } from 'react'
import { Avatar } from '../ui/Avatar'

interface MessageAIProps {
  content: string | ReactNode
  isStreaming?: boolean
  className?: string
}

export function MessageAI({ content, isStreaming = false, className = '' }: MessageAIProps) {
  return (
    <div className={`flex gap-3.5 animate-fade-up ${className}`}>
      {/* Avatar */}
      <Avatar
        initials="E"
        size="sm"
        accentBg
        className="flex-shrink-0 mt-0.5"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] leading-[1.65] text-[var(--text-secondary)]">
          {typeof content === 'string' ? (
            <FormattedText text={content} />
          ) : (
            content
          )}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-[var(--accent)] ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>
      </div>
    </div>
  )
}

// Component to format text with highlights and bold
function FormattedText({ text }: { text: string }) {
  // Simple markdown-like parsing
  // **text** = bold
  // ==text== = highlight (accent color)

  const parts = text.split(/(\*\*[^*]+\*\*|==[^=]+=+=)/g)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Bold text
          return (
            <strong key={index} className="font-semibold text-[var(--text-primary)]">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith('==') && part.endsWith('==')) {
          // Highlighted text
          return (
            <span key={index} className="font-semibold text-[var(--accent)]">
              {part.slice(2, -2)}
            </span>
          )
        }
        // Normal text - handle line breaks
        return part.split('\n').map((line, lineIndex, arr) => (
          <span key={`${index}-${lineIndex}`}>
            {line}
            {lineIndex < arr.length - 1 && <br />}
          </span>
        ))
      })}
    </>
  )
}

export default MessageAI
