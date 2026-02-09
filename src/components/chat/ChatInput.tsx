'use client'

import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  onAttach?: () => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
  maxLength?: number
  className?: string
}

export function ChatInput({
  onSend,
  onAttach,
  placeholder = 'Écris ta réponse...',
  disabled = false,
  isLoading = false,
  maxLength = 2000,
  className = '',
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed && !disabled && !isLoading) {
      onSend(trimmed)
      setValue('')
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      setValue(newValue)
      // Auto-resize textarea
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
      }
    }
  }

  const canSend = value.trim().length > 0 && !disabled && !isLoading

  return (
    <div
      className={`
        border-t border-[var(--border)]
        bg-[var(--bg-primary)]
        px-8 py-5
        ${className}
      `}
    >
      <div className="max-w-[var(--chat-max-width)] mx-auto">
        <div
          className={`
            flex items-end gap-2
            bg-[var(--bg-secondary)]
            border border-[var(--border)]
            rounded-[var(--radius-xl)]
            px-4 py-1.5
            transition-all duration-150
            ${disabled ? 'opacity-50' : ''}
            focus-within:border-[var(--accent)] focus-within:shadow-[var(--shadow-focus)]
          `}
        >
          {/* Attach Button */}
          {onAttach && (
            <button
              onClick={onAttach}
              disabled={disabled || isLoading}
              className="
                p-2
                text-[var(--text-muted)]
                hover:text-[var(--text-secondary)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
              aria-label="Joindre un fichier"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          )}

          {/* Text Input */}
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="
              flex-1
              bg-transparent
              border-none
              outline-none
              resize-none
              text-[14.5px]
              text-[var(--text-primary)]
              placeholder:text-[var(--text-placeholder)]
              py-2.5
              max-h-[200px]
              disabled:cursor-not-allowed
            "
          />

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className={`
              w-[38px] h-[38px]
              flex items-center justify-center
              rounded-full
              transition-all duration-150
              ${
                canSend
                  ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.92]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
              }
            `}
            aria-label="Envoyer"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* Character count (optional, shown when approaching limit) */}
        {value.length > maxLength * 0.8 && (
          <p className="text-[11px] text-[var(--text-muted)] text-right mt-1.5">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}

export default ChatInput
