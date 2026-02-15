'use client'

interface StepMRRProps {
  mrrMensuel: number | null
  pappersCA: number | null
  onChange: (mrr: number | null) => void
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

export function StepMRR({ mrrMensuel, pappersCA, onChange }: StepMRRProps) {
  const arr = mrrMensuel != null ? mrrMensuel * 12 : null

  const showWarning =
    arr != null && pappersCA != null && pappersCA > 0 && arr > pappersCA * 3

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
          MRR mensuel
        </h1>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--dg-input-bg)',
        border: '1px solid var(--dg-input-border)',
        borderRadius: 12, padding: '0 16px',
        maxWidth: 400, margin: '0 auto',
      }}>
        <input
          type="number"
          autoFocus
          value={mrrMensuel != null ? mrrMensuel : ''}
          onChange={(e) =>
            onChange(e.target.value === '' ? null : Number(e.target.value))
          }
          style={{
            flex: 1, padding: '16px 0', border: 'none', background: 'transparent',
            outline: 'none', color: 'var(--dg-input-text)', fontSize: 20, fontWeight: 600,
            fontFamily: 'var(--font-mono)',
          }}
        />
        <span style={{ fontSize: 13, color: 'var(--dg-text-muted)', fontWeight: 500, marginLeft: 8 }}>€/mois</span>
      </div>

      {arr != null && (
        <div style={{
          background: 'var(--dg-card)', border: '1px solid var(--dg-card-border)',
          borderRadius: 14, padding: 16, textAlign: 'center',
          maxWidth: 400, margin: '0 auto',
        }}>
          <p style={{ fontSize: 12, color: 'var(--dg-text-muted)', marginBottom: 4 }}>ARR estimé</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--dg-text)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(arr)} €/an
          </p>
        </div>
      )}

      {showWarning && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, fontSize: 12, textAlign: 'center',
          background: 'var(--dg-warn-bg)',
          border: '1px solid var(--dg-warn-border)',
          color: 'var(--dg-warn)',
          maxWidth: 400, margin: '0 auto',
        }}>
          ↕ ARR ({formatNumber(arr!)} €) dépasse largement le CA Pappers ({formatNumber(pappersCA!)} €)
        </div>
      )}
    </div>
  )
}
