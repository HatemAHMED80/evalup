interface MetricChipProps {
  label: string
  value: string
  color: string
  warning?: string
}

export function MetricChip({ label, value, color, warning }: MetricChipProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: '10px 12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.012)',
        border: '1px solid rgba(255,255,255,0.025)',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: '#3d4258',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          lineHeight: 1,
          color,
        }}
      >
        {value}
      </div>
      {warning && (
        <div style={{ fontSize: 9, color: '#3d4258', marginTop: 4 }}>
          {warning}
        </div>
      )}
    </div>
  )
}
