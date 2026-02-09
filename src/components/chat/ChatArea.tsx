'use client'

import { useRef, useEffect, ReactNode } from 'react'
import { MessageAI } from './MessageAI'
import { MessageUser } from './MessageUser'
import { TypingIndicator } from './TypingIndicator'

export interface Message {
  id: string
  role: 'assistant' | 'user'
  content: string | ReactNode
  timestamp?: Date
}

interface ChatAreaProps {
  messages: Message[]
  isTyping?: boolean
  className?: string
}

export function ChatArea({ messages, isTyping = false, className = '' }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  return (
    <div
      ref={scrollRef}
      className={`
        flex-1
        overflow-y-auto
        px-8 py-8
        ${className}
      `}
    >
      <div className="max-w-[var(--chat-max-width)] mx-auto space-y-6">
        {messages.map((message) => {
          if (message.role === 'assistant') {
            return (
              <MessageAI
                key={message.id}
                content={message.content}
              />
            )
          }
          return (
            <MessageUser
              key={message.id}
              content={message.content as string}
            />
          )
        })}

        {isTyping && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default ChatArea
