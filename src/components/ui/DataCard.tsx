import { ReactNode } from 'react'
import Badge from '@/components/ui/Badge'

interface DataItem {
  label: string
  value: string | number
  change?: {
    value: string
    type: 'positive' | 'negative' | 'neutral'
  }
  prefix?: string
  suffix?: string
}

interface DataCardProps {
  title: string
  source?: string
  items: DataItem[]
  columns?: 2 | 3 | 4
  className?: string
  icon?: ReactNode
}

export function DataCard({
  title,
  source,
  items,
  columns = 3,
  className = '',
  icon,
}: DataCardProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  return (
    <div
      className={`
        bg-[var(--bg-secondary)]
        border border-[var(--border)]
        rounded-[var(--radius-lg)]
        p-5
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-[var(--text-muted)]">{icon}</span>
          )}
          <h4 className="text-[13px] font-bold text-[var(--text-primary)] uppercase tracking-wide">
            {title}
          </h4>
        </div>
        {source && (
          <Badge variant="accent" size="sm">
            {source}
          </Badge>
        )}
      </div>

      {/* Data Grid */}
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {items.map((item, index) => (
          <div key={index} className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)] font-medium">
              {item.label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <p className="font-mono text-[17px] font-semibold text-[var(--text-primary)]">
                {item.prefix}
                {typeof item.value === 'number'
                  ? item.value.toLocaleString('fr-FR')
                  : item.value}
                {item.suffix}
              </p>
              {item.change && (
                <span
                  className={`text-[11px] font-medium ${
                    item.change.type === 'positive'
                      ? 'text-[var(--success)]'
                      : item.change.type === 'negative'
                      ? 'text-[var(--danger)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {item.change.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple metric card for single values
interface MetricCardProps {
  label: string
  value: string | number
  change?: {
    value: string
    type: 'positive' | 'negative' | 'neutral'
  }
  icon?: ReactNode
  className?: string
}

export function MetricCard({
  label,
  value,
  change,
  icon,
  className = '',
}: MetricCardProps) {
  return (
    <div
      className={`
        bg-[var(--bg-secondary)]
        rounded-[var(--radius-md)]
        p-4
        ${className}
      `}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <span className="text-[var(--accent)]">{icon}</span>
        )}
        <p className="text-[11px] uppercase tracking-[0.04em] text-[var(--text-muted)] font-medium">
          {label}
        </p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="font-mono text-[20px] font-bold text-[var(--text-primary)]">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </p>
        {change && (
          <span
            className={`text-[12px] font-medium ${
              change.type === 'positive'
                ? 'text-[var(--success)]'
                : change.type === 'negative'
                ? 'text-[var(--danger)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {change.value}
          </span>
        )}
      </div>
    </div>
  )
}

export default DataCard
