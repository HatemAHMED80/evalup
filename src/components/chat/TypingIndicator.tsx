'use client'

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex-shrink-0 mr-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a227] to-[#e8c547] flex items-center justify-center">
          <span className="text-[#1a1a2e] font-bold text-xs">E</span>
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-[#c9a227] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[#c9a227] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-[#c9a227] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
