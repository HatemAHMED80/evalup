'use client'

import { Stepper } from '@/components/ui/Stepper'
import { Badge } from '@/components/ui/Badge'

interface HeaderProps {
  companyName?: string
  sector?: string
  currentStep: number
  totalSteps?: number
  steps?: { id: string | number; label?: string }[]
  className?: string
}

const DEFAULT_STEPS = [
  { id: 1, label: 'Objectif' },
  { id: 2, label: 'Activité' },
  { id: 3, label: 'Finances' },
  { id: 4, label: 'Équipe' },
  { id: 5, label: 'Marché' },
  { id: 6, label: 'Résultat' },
]

export function Header({
  companyName,
  sector,
  currentStep,
  totalSteps = 6,
  steps = DEFAULT_STEPS,
  className = '',
}: HeaderProps) {
  return (
    <header
      className={`
        h-[var(--header-height)]
        bg-[var(--bg-primary)]
        border-b border-[var(--border)]
        px-8
        flex items-center
        relative
        ${className}
      `}
    >
      {/* Left: Company Info */}
      <div className="flex items-center gap-3 min-w-0 max-w-[200px]">
        {companyName && (
          <h1 className="text-[17px] font-bold text-[var(--text-primary)] truncate">
            {companyName}
          </h1>
        )}
        {sector && (
          <Badge variant="neutral" size="md" className="hidden sm:inline-flex shrink-0">
            {sector}
          </Badge>
        )}
      </div>

      {/* Center: Stepper */}
      <div className="flex-1 flex justify-center">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          showLabels={true}
          size="md"
        />
      </div>

      {/* Right: Step Counter */}
      <div className="flex items-center gap-2 min-w-[80px] justify-end">
        <span className="font-mono text-[12.5px] text-[var(--text-tertiary)]">
          Étape {currentStep + 1}/{totalSteps}
        </span>
      </div>
    </header>
  )
}

// Simple header variant for non-evaluation pages
interface SimpleHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function SimpleHeader({
  title,
  subtitle,
  actions,
  className = '',
}: SimpleHeaderProps) {
  return (
    <header
      className={`
        h-[var(--header-height)]
        bg-[var(--bg-primary)]
        border-b border-[var(--border)]
        px-8
        flex items-center justify-between
        ${className}
      `}
    >
      <div>
        <h1 className="text-[17px] font-bold text-[var(--text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-[var(--text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  )
}

export default Header
