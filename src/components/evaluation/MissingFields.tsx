interface MissingFieldsProps {
  fields: { label: string; id: string }[]
  onFocus: (id: string) => void
}

export function MissingFields({ fields, onFocus }: MissingFieldsProps) {
  if (fields.length === 0) {
    return (
      <div
        style={{
          border: '1px solid rgba(42,68,51,0.15)',
          background: 'rgba(42,68,51,0.04)',
          borderRadius: 10,
          padding: '10px 14px',
          textAlign: 'center',
          marginTop: 8,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: '#2a4433' }}>
          {'\u2713'} Complet
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        border: '1px solid rgba(187,136,51,0.06)',
        background: 'rgba(187,136,51,0.02)',
        borderRadius: 10,
        padding: '10px 14px',
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {fields.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFocus(f.id)}
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 5,
              background: 'rgba(187,136,51,0.06)',
              color: '#997744',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              transition: 'background 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
