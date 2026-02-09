interface ValuationBreakdown {
  label: string
  value: string
  percentage?: string
}

interface ValuationResultProps {
  lowValue: number
  highValue: number
  centralValue?: number
  method?: string
  breakdown?: ValuationBreakdown[]
  className?: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value).replace(/\s/g, '\u00A0')
}

export function ValuationResult({
  lowValue,
  highValue,
  centralValue,
  method,
  breakdown,
  className = '',
}: ValuationResultProps) {
  return (
    <div
      className={`
        bg-gradient-to-br from-[#1E3A5F] via-[#2563EB] to-[#3B82F6]
        rounded-[var(--radius-xl)]
        p-9
        text-center
        text-white
        ${className}
      `}
    >
      {/* Label */}
      <p className="text-[13px] uppercase tracking-[0.08em] opacity-75 mb-3">
        Fourchette de valorisation
      </p>

      {/* Main Value */}
      <p className="font-mono text-[34px] font-bold tracking-tight mb-2">
        {formatCurrency(lowValue)} – {formatCurrency(highValue)}
      </p>

      {/* Central Value */}
      {centralValue && (
        <p className="text-[15px] opacity-80 mb-4">
          Valeur centrale : <span className="font-semibold">{formatCurrency(centralValue)}</span>
        </p>
      )}

      {/* Method */}
      {method && (
        <p className="text-[13px] opacity-65 mb-6">
          Méthode : {method}
        </p>
      )}

      {/* Breakdown */}
      {breakdown && breakdown.length > 0 && (
        <div className="border-t border-white/15 pt-6 mt-4">
          <div className="flex justify-center gap-8">
            {breakdown.map((item, index) => (
              <div key={index} className="text-center">
                <p className="text-[11px] uppercase tracking-wide opacity-60 mb-1">
                  {item.label}
                </p>
                <p className="font-mono text-[16px] font-semibold">
                  {item.value}
                </p>
                {item.percentage && (
                  <p className="text-[11px] opacity-50 mt-0.5">
                    ({item.percentage})
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for sidebar or smaller spaces
interface ValuationBadgeProps {
  lowValue: number
  highValue: number
  className?: string
}

export function ValuationBadge({ lowValue, highValue, className = '' }: ValuationBadgeProps) {
  return (
    <div
      className={`
        bg-gradient-to-r from-[var(--accent)] to-[#3B82F6]
        rounded-[var(--radius-md)]
        px-4 py-2.5
        text-white
        ${className}
      `}
    >
      <p className="text-[10px] uppercase tracking-wide opacity-75 mb-0.5">
        Valorisation
      </p>
      <p className="font-mono text-[14px] font-bold">
        {formatCurrency(lowValue)} – {formatCurrency(highValue)}
      </p>
    </div>
  )
}

export default ValuationResult
