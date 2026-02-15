'use client'

import { useState } from 'react'

export interface Choice {
  id: string
  label: string
  sub?: string
  value: number
  icon?: string
}

interface StepQuickChoicesProps {
  title: string
  description: string
  choices: Choice[]
  selectedId: string | null
  onSelect: (choice: Choice) => void
  showExactInput?: boolean
  exactValue?: number | null
  onExactChange?: (value: number | null) => void
  unit?: string
}

export function StepQuickChoices({
  title,
  choices,
  selectedId,
  onSelect,
  showExactInput = false,
  exactValue,
  onExactChange,
  unit = '€',
}: StepQuickChoicesProps) {
  const [showExact, setShowExact] = useState(selectedId === 'exact')

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
          {title}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => {
              setShowExact(false)
              onSelect(choice)
            }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
              padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.15s', textAlign: 'left',
              border: selectedId === choice.id && !showExact
                ? '1px solid rgba(68,102,238,0.4)'
                : '1px solid rgba(255,255,255,0.04)',
              background: selectedId === choice.id && !showExact
                ? 'rgba(68,102,238,0.08)'
                : 'rgba(255,255,255,0.02)',
              color: selectedId === choice.id && !showExact
                ? '#b0b8dd'
                : 'var(--dg-text-dim)',
            }}
          >
            {choice.icon && <span style={{ fontSize: 18 }}>{choice.icon}</span>}
            <span style={{ fontWeight: 600 }}>{choice.label}</span>
            {choice.sub && (
              <span style={{ fontSize: 11, color: 'var(--dg-text-muted)' }}>{choice.sub}</span>
            )}
          </button>
        ))}

        {showExactInput && (
          <button
            onClick={() => setShowExact(true)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
              padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.15s', textAlign: 'left',
              gridColumn: 'span 2',
              border: showExact
                ? '1px solid rgba(68,102,238,0.4)'
                : '1px solid rgba(255,255,255,0.04)',
              background: showExact
                ? 'rgba(68,102,238,0.08)'
                : 'rgba(255,255,255,0.02)',
              color: showExact
                ? '#b0b8dd'
                : 'var(--dg-text-dim)',
            }}
          >
            <span style={{ fontWeight: 600 }}>Montant exact</span>
          </button>
        )}
      </div>

      {showExact && showExactInput && onExactChange && (
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--dg-input-bg)',
          border: '1px solid var(--dg-input-border)',
          borderRadius: 12, padding: '0 16px',
          maxWidth: 400, margin: '0 auto',
        }}>
          <input
            type="number"
            value={exactValue != null ? exactValue : ''}
            onChange={(e) =>
              onExactChange(e.target.value === '' ? null : Number(e.target.value))
            }
            autoFocus
            style={{
              flex: 1, padding: '16px 0', border: 'none', background: 'transparent',
              outline: 'none', color: 'var(--dg-input-text)', fontSize: 20, fontWeight: 600,
              fontFamily: 'var(--font-mono)',
            }}
          />
          <span style={{ fontSize: 13, color: 'var(--dg-text-muted)', fontWeight: 500, marginLeft: 8 }}>{unit}</span>
        </div>
      )}
    </div>
  )
}
