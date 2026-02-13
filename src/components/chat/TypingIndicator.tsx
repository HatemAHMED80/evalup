'use client'

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex-shrink-0 mr-3">
        <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
          <span className="text-white font-bold text-xs">E</span>
        </div>
      </div>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl px-5 py-4">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
