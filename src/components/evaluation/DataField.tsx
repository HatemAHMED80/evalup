'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

type FieldType = 'currency' | 'percent' | 'number' | 'boolean' | 'select'
type FieldSource = 'pappers' | 'document' | 'manual' | 'ai'

interface DataFieldProps {
  label: string
  value: number | string | boolean | null | undefined
  onChange: (value: number | string | boolean | null) => void
  type: FieldType
  source?: FieldSource
  pappersValue?: number | null
  options?: { value: string; label: string }[]
  hint?: string
  unit?: string
  className?: string
  highlighted?: boolean
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

const SOURCE_CONFIG: Record<FieldSource, { variant: 'info' | 'accent' | 'neutral'; label: string }> = {
  pappers: { variant: 'info', label: 'Pappers' },
  document: { variant: 'accent', label: 'Doc' },
  ai: { variant: 'accent', label: 'IA' },
  manual: { variant: 'neutral', label: 'Manuel' },
}

export function DataField({
  label,
  value,
  onChange,
  type,
  source,
  pappersValue,
  options,
  hint,
  unit,
  className = '',
  highlighted,
}: DataFieldProps) {
  const [isFocused, setIsFocused] = useState(false)

  // Divergence warning
  const numValue = typeof value === 'number' ? value : null
  const showWarning =
    numValue != null &&
    pappersValue != null &&
    pappersValue !== 0 &&
    Math.abs((numValue - pappersValue) / pappersValue) > 0.5

  const isPappers = source === 'pappers'

  const highlightClass = highlighted ? 'animate-highlight-pulse rounded-[var(--radius-md)]' : ''

  if (type === 'boolean') {
    return (
      <div className={`flex items-center justify-between py-2 ${highlightClass} ${className}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] text-[var(--text-primary)] truncate">{label}</span>
          {source && (
            <Badge variant={SOURCE_CONFIG[source].variant} size="sm">
              {SOURCE_CONFIG[source].label}
            </Badge>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`px-3 py-1 text-[12px] font-medium rounded-[var(--radius-sm)] transition-colors ${
              value === true
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
            }`}
          >
            Oui
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`px-3 py-1 text-[12px] font-medium rounded-[var(--radius-sm)] transition-colors ${
              value === false
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
            }`}
          >
            Non
          </button>
        </div>
      </div>
    )
  }

  if (type === 'select' && options) {
    return (
      <div className={`space-y-1 ${highlightClass} ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[var(--text-primary)]">{label}</span>
          {source && (
            <Badge variant={SOURCE_CONFIG[source].variant} size="sm">
              {SOURCE_CONFIG[source].label}
            </Badge>
          )}
        </div>
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-2 text-[13px] bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10"
        >
          <option value="">Non renseigne</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // Currency / Percent / Number
  const rightUnit = unit || (type === 'currency' ? '€' : type === 'percent' ? '%' : undefined)

  const displayValue = isFocused
    ? numValue != null
      ? numValue
      : ''
    : numValue != null
      ? formatNumber(numValue)
      : ''

  return (
    <div className={`space-y-1 ${highlightClass} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[var(--text-primary)]">{label}</span>
          {source && (
            <Badge variant={SOURCE_CONFIG[source].variant} size="sm">
              {SOURCE_CONFIG[source].label}
            </Badge>
          )}
        </div>
        {pappersValue != null && (
          <span className="text-[11px] text-[var(--text-muted)]">
            Pappers: {formatNumber(pappersValue)}
          </span>
        )}
      </div>
      <Input
        type={isFocused ? 'number' : 'text'}
        value={displayValue}
        onChange={(e) => {
          const raw = e.target.value
          onChange(raw === '' ? null : Number(raw))
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        rightIcon={
          rightUnit ? (
            <span className="text-[var(--text-muted)] text-[12px]">{rightUnit}</span>
          ) : undefined
        }
        className={`text-[13px] py-2 ${isPappers ? 'bg-[var(--info-light)]/30' : ''}`}
      />
      {hint && !showWarning && (
        <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>
      )}
      {showWarning && (
        <p className="text-[11px] text-amber-600">
          Ecart &gt;50% vs Pappers ({formatNumber(pappersValue!)})
        </p>
      )}
    </div>
  )
}
