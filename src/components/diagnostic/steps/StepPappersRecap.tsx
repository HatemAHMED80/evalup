'use client'

import { useState } from 'react'

interface StepPappersRecapProps {
  companyName: string
  pappersCA: number | null
  pappersEBITDA: number | null
  pappersTresorerie: number | null
  pappersDettes: number | null
  pappersEffectif: string
  bilanAnnee: number | null
  onConfirm: () => void
  onUpdate: (data: {
    revenue: number
    ebitda: number
    tresorerieActuelle: number | null
    dettesFinancieres: number | null
  }) => void
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function MetricCard({
  label,
  value,
  unit = '€',
}: {
  label: string
  value: number | null
  unit?: string
}) {
  return (
    <div style={{
      background: 'var(--dg-card)', border: '1px solid var(--dg-card-border)',
      borderRadius: 10, padding: 14, textAlign: 'center',
    }}>
      <p style={{ fontSize: 11, color: 'var(--dg-text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--dg-text)', fontFamily: 'var(--font-mono)' }}>
        {value != null ? `${formatNumber(value)} ${unit}` : 'N/A'}
      </p>
    </div>
  )
}

export function StepPappersRecap({
  companyName,
  pappersCA,
  pappersEBITDA,
  pappersTresorerie,
  pappersDettes,
  pappersEffectif,
  bilanAnnee,
  onConfirm,
  onUpdate,
}: StepPappersRecapProps) {
  const [mode, setMode] = useState<'recap' | 'edit'>('recap')
  const [editCA, setEditCA] = useState<number | null>(pappersCA)
  const [editEBITDA, setEditEBITDA] = useState<number | null>(pappersEBITDA)
  const [editTreso, setEditTreso] = useState<number | null>(pappersTresorerie)
  const [editDettes, setEditDettes] = useState<number | null>(pappersDettes)

  const handleUpdate = () => {
    if (editCA != null && editEBITDA != null) {
      onUpdate({
        revenue: editCA,
        ebitda: editEBITDA,
        tresorerieActuelle: editTreso,
        dettesFinancieres: editDettes,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
          {companyName}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--dg-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
          {bilanAnnee ? `Bilan ${bilanAnnee} — Pappers` : 'Source : Pappers'}
        </p>
      </div>

      {mode === 'recap' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Chiffre d'affaires" value={pappersCA} />
            <MetricCard label="EBITDA" value={pappersEBITDA} />
            <MetricCard label="Trésorerie" value={pappersTresorerie} />
            <MetricCard label="Dettes financières" value={pappersDettes} />
          </div>

          {pappersEffectif && pappersEffectif !== 'Non renseigne' && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--dg-text-muted)' }}>
              Effectif : {pappersEffectif}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onConfirm}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                background: 'linear-gradient(135deg, #3355cc, #4466ee)', color: '#fff',
                boxShadow: '0 4px 20px rgba(51,85,204,0.2)',
              }}
            >
              C&apos;est correct
            </button>
            <button
              type="button"
              onClick={() => setMode('edit')}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)', color: 'var(--dg-text-dim)',
              }}
            >
              Chiffres plus récents
            </button>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div className="space-y-3">
          {[
            { label: "Chiffre d'affaires", value: editCA, onChange: setEditCA },
            { label: 'EBITDA', value: editEBITDA, onChange: setEditEBITDA },
            { label: 'Trésorerie', value: editTreso, onChange: setEditTreso },
            { label: 'Dettes financières', value: editDettes, onChange: setEditDettes },
          ].map((field) => (
            <div key={field.label}>
              <p style={{ fontSize: 11, color: 'var(--dg-text-muted)', marginBottom: 4, marginLeft: 4 }}>
                {field.label}
              </p>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--dg-input-bg)',
                border: '1px solid var(--dg-input-border)',
                borderRadius: 10, padding: '0 12px',
              }}>
                <input
                  type="number"
                  value={field.value != null ? field.value : ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? null : Number(e.target.value))
                  }
                  style={{
                    flex: 1, padding: '12px 0', border: 'none', background: 'transparent',
                    outline: 'none', color: 'var(--dg-input-text)', fontSize: 16, fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--dg-text-muted)', marginLeft: 8 }}>€</span>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => {
                setMode('recap')
                setEditCA(pappersCA)
                setEditEBITDA(pappersEBITDA)
                setEditTreso(pappersTresorerie)
                setEditDettes(pappersDettes)
              }}
              style={{ background: 'none', border: 'none', color: 'var(--dg-text-muted)', fontSize: 13, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={editCA == null || editEBITDA == null}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                fontSize: 14, fontWeight: 700,
                cursor: editCA != null && editEBITDA != null ? 'pointer' : 'default',
                ...(editCA != null && editEBITDA != null
                  ? { background: 'linear-gradient(135deg, #3355cc, #4466ee)', color: '#fff', boxShadow: '0 4px 20px rgba(51,85,204,0.2)' }
                  : { background: 'rgba(255,255,255,0.03)', color: '#2a2e44' }),
              }}
            >
              Valider
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
