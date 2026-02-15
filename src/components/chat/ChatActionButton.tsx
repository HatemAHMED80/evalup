'use client'

import type { ReactNode } from 'react'

interface ChatActionButtonProps {
  icon?: ReactNode
  label: string
  onClick: () => void
  variant?: 'primary' | 'outline' | 'subtle'
}

export function ChatActionButton({ icon, label, onClick, variant = 'outline' }: ChatActionButtonProps) {
  const base = 'inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-[var(--radius-lg)] transition-all duration-150 active:scale-[0.98]'

  const variants = {
    primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm',
    outline: 'border border-[var(--accent)]/25 bg-[var(--accent-light)] text-[var(--accent)] hover:bg-[var(--accent)]/15',
    subtle: 'border border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]',
  }

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`}>
      {icon}
      {label}
    </button>
  )
}
