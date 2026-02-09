import { ReactNode } from 'react'

type BadgeVariant = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: ReactNode
  children: ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  accent: 'bg-[var(--accent-light)] text-[var(--accent)]',
  success: 'bg-[var(--success-light)] text-[var(--success)]',
  warning: 'bg-[var(--warning-light)] text-[var(--warning)]',
  danger: 'bg-[var(--danger-light)] text-[var(--danger)]',
  info: 'bg-[var(--info-light)] text-[var(--info)]',
  neutral: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-[11px] gap-1.5',
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-semibold rounded-[var(--radius-full)] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

export default Badge
