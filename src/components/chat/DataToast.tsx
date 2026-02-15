'use client'

import { useEffect } from 'react'

interface DataToastProps {
  label: string
  value: string
  onDismiss: () => void
}

export function DataToast({ label, value, onDismiss }: DataToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-fade-up">
      <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-full)] bg-[var(--success-light)] border border-[var(--success)]/20 shadow-sm">
        <svg className="w-3.5 h-3.5 text-[var(--success)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-[12px] text-[var(--text-primary)] whitespace-nowrap">
          <span className="font-medium">{label}</span> mis a jour : {value}
        </span>
      </div>
    </div>
  )
}
