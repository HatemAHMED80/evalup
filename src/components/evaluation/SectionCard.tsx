import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  filled: number
  total: number
  children: ReactNode
}

export function SectionCard({ title, filled, total, children }: SectionCardProps) {
  const allFilled = filled === total && total > 0

  return (
    <div
      style={{
        background: 'var(--dp-card)',
        borderRadius: 12,
        border: '1px solid var(--dp-card-border)',
        marginBottom: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 16px',
          borderBottom: '1px solid var(--dp-line)',
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 2.2,
            textTransform: 'uppercase',
            color: 'var(--dp-text-muted)',
          }}
        >
          {title}
        </span>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 2,
                background: i < filled
                  ? allFilled ? 'var(--dp-green)' : 'var(--dp-blue)'
                  : 'rgba(255,255,255,0.04)',
              }}
            />
          ))}
        </div>
      </div>
      {/* Fields */}
      <div style={{ padding: '2px 6px' }}>
        {children}
      </div>
    </div>
  )
}
