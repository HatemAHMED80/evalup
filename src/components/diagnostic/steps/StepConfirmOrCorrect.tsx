'use client'

import { useState } from 'react'

interface StepConfirmOrCorrectProps {
  title: string
  description: string
  label: string
  pappersValue: number | null
  pappersLabel?: string
  unit?: string
  allowNegative?: boolean
  onValidate: (value: number, source: 'pappers' | 'corrected' | 'declaratif') => void
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

export function StepConfirmOrCorrect({
  title,
  label,
  pappersValue,
  pappersLabel,
  unit = '€',
  onValidate,
}: StepConfirmOrCorrectProps) {
  const [mode, setMode] = useState<'confirm' | 'edit'>(pappersValue != null ? 'confirm' : 'edit')
  const [editValue, setEditValue] = useState<number | null>(null)

  const hasPappers = pappersValue != null

  // Divergence warning
  const showWarning =
    hasPappers && editValue != null && pappersValue !== 0 &&
    Math.abs((editValue - pappersValue) / pappersValue) > 0.5

  const showDangerWarning =
    hasPappers && editValue != null && pappersValue !== 0 &&
    Math.abs((editValue - pappersValue) / pappersValue) > 5

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
          {title}
        </h1>
      </div>

      {hasPappers && mode === 'confirm' && (
        <div className="space-y-4">
          {/* Pappers value display */}
          <div style={{
            background: 'var(--dg-card)', border: '1px solid var(--dg-card-border)',
            borderRadius: 14, padding: 20,
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--dg-text-muted)', marginBottom: 4 }}>
                {label} {pappersLabel && `(${pappersLabel})`}
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', fontFamily: 'var(--font-mono)' }}>
                {formatNumber(pappersValue!)} {unit}
              </p>
              <p style={{ fontSize: 11, color: 'var(--dg-text-faint)', marginTop: 4 }}>Source : Pappers</p>
            </div>
          </div>

          {/* Confirm / Correct buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => onValidate(pappersValue!, 'pappers')}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                background: 'linear-gradient(135deg, #3355cc, #4466ee)', color: '#fff',
                boxShadow: '0 4px 20px rgba(51,85,204,0.2)',
              }}
            >
              Correct
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
              Corriger
            </button>
          </div>
        </div>
      )}

      {(mode === 'edit' || !hasPappers) && (
        <div className="space-y-4">
          {hasPappers && (
            <p style={{ fontSize: 12, color: 'var(--dg-text-muted)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
              Pappers : {formatNumber(pappersValue!)} {unit}
            </p>
          )}
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
              value={editValue != null ? editValue : ''}
              onChange={(e) =>
                setEditValue(e.target.value === '' ? null : Number(e.target.value))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editValue != null) {
                  onValidate(editValue, hasPappers ? 'corrected' : 'declaratif')
                }
              }}
              style={{
                flex: 1, padding: '16px 0', border: 'none', background: 'transparent',
                outline: 'none', color: 'var(--dg-input-text)', fontSize: 20, fontWeight: 600,
                fontFamily: 'var(--font-mono)',
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--dg-text-muted)', fontWeight: 500, marginLeft: 8 }}>{unit}</span>
          </div>

          {showDangerWarning && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, fontSize: 12, textAlign: 'center',
              background: 'var(--dg-danger-bg)',
              border: '1px solid var(--dg-danger-border)',
              color: 'var(--dg-danger)',
              maxWidth: 400, margin: '8px auto 0',
            }}>
              ↕ Ecart très important — vérifiez mensuel vs annuel
            </div>
          )}

          {showWarning && !showDangerWarning && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, fontSize: 12, textAlign: 'center',
              background: 'var(--dg-warn-bg)',
              border: '1px solid var(--dg-warn-border)',
              color: 'var(--dg-warn)',
              maxWidth: 400, margin: '8px auto 0',
            }}>
              ↕ Pappers : {formatNumber(pappersValue!)} {unit} — écart significatif
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, maxWidth: 400, margin: '0 auto' }}>
            {hasPappers && (
              <button
                type="button"
                onClick={() => {
                  setMode('confirm')
                  setEditValue(null)
                }}
                style={{ background: 'none', border: 'none', color: 'var(--dg-text-muted)', fontSize: 13, cursor: 'pointer' }}
              >
                Annuler
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (editValue != null) {
                  onValidate(editValue, hasPappers ? 'corrected' : 'declaratif')
                }
              }}
              disabled={editValue == null}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                fontSize: 14, fontWeight: 700,
                cursor: editValue != null ? 'pointer' : 'default',
                ...(editValue != null
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
