'use client'

import { useState, useRef, useCallback, type RefCallback } from 'react'

interface FieldRowProps {
  label: string
  value: number | string | boolean | null
  onChange: (value: number | string | boolean | null) => void
  type: 'currency' | 'percent' | 'number' | 'boolean' | 'select'
  unit?: string
  source?: 'pappers' | 'doc' | 'ia' | 'manuel'
  pappersValue?: number | null
  options?: { value: string; label: string }[]
  required?: boolean
  highlighted?: boolean
  inputRef?: RefCallback<HTMLInputElement>
}

const fmt = new Intl.NumberFormat('fr-FR')

function formatDisplay(v: number): string {
  return fmt.format(v)
}

function parseInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(/,/g, '.')
  if (cleaned === '' || cleaned === '-') return null
  const n = Number(cleaned)
  return isNaN(n) ? null : n
}

export function FieldRow({
  label,
  value,
  onChange,
  type,
  unit,
  source,
  pappersValue,
  options,
  required,
  highlighted,
  inputRef,
}: FieldRowProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [editValue, setEditValue] = useState('')
  const localRef = useRef<HTMLInputElement>(null)

  // Status bar color
  const numValue = typeof value === 'number' ? value : null
  const isPappers = source === 'pappers'
  const isPappersUnchanged = isPappers && pappersValue != null && numValue === pappersValue
  const isEdited = value != null && (typeof value === 'boolean' ? true : typeof value === 'string' ? value !== '' : true)

  let barColor = 'rgba(255,255,255,0.03)'
  let badge: { text: string; color: string } | null = null

  if (isPappersUnchanged) {
    barColor = 'var(--dp-blue)'
    badge = { text: 'AUTO', color: '#556699' }
  } else if (isEdited && !isPappersUnchanged) {
    barColor = 'var(--dp-green)'
    badge = { text: 'EDIT', color: '#448855' }
  } else if (required && value == null) {
    barColor = 'var(--dp-orange)'
    badge = { text: '\u2022', color: '#997744' }
  }

  // Label color
  const labelColor = isFocused
    ? 'var(--dp-text-focus)'
    : required && value == null
      ? '#bb9944'
      : 'var(--dp-text-dim)'

  // Placeholder
  const placeholder = pappersValue != null ? formatDisplay(pappersValue) : '\u2014'

  // Unit display
  const unitText = unit || (type === 'currency' ? '\u20ac' : type === 'percent' ? '%' : '')

  // Focus handlers for numeric inputs
  const handleFocus = useCallback(() => {
    setIsFocused(true)
    if (type === 'currency' || type === 'number' || type === 'percent') {
      const num = typeof value === 'number' ? value : null
      setEditValue(num != null ? String(num) : '')
    }
  }, [type, value])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    if (type === 'currency' || type === 'number' || type === 'percent') {
      const parsed = parseInput(editValue)
      onChange(parsed)
    }
  }, [type, editValue, onChange])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
  }, [])

  // Display value for numeric types
  const displayValue = (() => {
    if (type === 'currency' || type === 'number') {
      if (isFocused) return editValue
      return numValue != null ? formatDisplay(numValue) : ''
    }
    if (type === 'percent') {
      if (isFocused) return editValue
      return numValue != null ? String(numValue) : ''
    }
    return ''
  })()

  const setRef = useCallback((el: HTMLInputElement | null) => {
    (localRef as React.MutableRefObject<HTMLInputElement | null>).current = el
    inputRef?.(el)
  }, [inputRef])

  // Row background
  const rowBg = highlighted
    ? 'rgba(68,102,238,0.06)'
    : isFocused
      ? 'rgba(100,130,255,0.035)'
      : 'transparent'

  // ─── Boolean ───
  if (type === 'boolean') {
    const boolVal = typeof value === 'boolean' ? value : null
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 42,
          borderBottom: '1px solid var(--dp-line)',
          padding: '2px 6px',
          background: rowBg,
          transition: 'background 0.15s',
        }}
      >
        <div style={{ width: 2.5, height: 20, borderRadius: 1, marginRight: 14, flexShrink: 0, background: barColor }} />
        <span style={{ flex: '0 0 155px', fontSize: 12, fontWeight: 500, color: labelColor }}>{label}</span>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          {(['Oui', 'Non'] as const).map((opt) => {
            const active = opt === 'Oui' ? boolVal === true : boolVal === false
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt === 'Oui')}
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: active ? (opt === 'Oui' ? 'rgba(68,170,102,0.12)' : 'rgba(204,85,68,0.12)') : 'rgba(255,255,255,0.03)',
                  color: active ? (opt === 'Oui' ? '#44aa66' : '#cc5544') : 'var(--dp-text-faint)',
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>
        <div style={{ minWidth: 40, textAlign: 'right' }}>
          {badge && (
            <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1, color: badge.color, textTransform: 'uppercase' }}>
              {badge.text}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ─── Select ───
  if (type === 'select' && options) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 42,
          borderBottom: '1px solid var(--dp-line)',
          padding: '2px 6px',
          background: rowBg,
          transition: 'background 0.15s',
        }}
      >
        <div style={{ width: 2.5, height: 20, borderRadius: 1, marginRight: 14, flexShrink: 0, background: barColor }} />
        <span style={{ flex: '0 0 155px', fontSize: 12, fontWeight: 500, color: labelColor }}>{label}</span>
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || null)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            padding: '4px 0',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            textAlign: 'right',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            color: value ? 'var(--dp-input)' : 'var(--dp-placeholder)',
            cursor: 'pointer',
            direction: 'rtl',
          }}
        >
          <option value="" style={{ background: '#0d0f15', color: '#606580' }}>{'\u2014'}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value} style={{ background: '#0d0f15', color: '#dde0ee', direction: 'ltr' }}>
              {o.label}
            </option>
          ))}
        </select>
        <div style={{ minWidth: 40, textAlign: 'right' }}>
          {badge && (
            <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1, color: badge.color, textTransform: 'uppercase' }}>
              {badge.text}
            </span>
          )}
        </div>
      </div>
    )
  }

  // ─── Numeric (currency / number / percent) ───
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 42,
        borderBottom: '1px solid var(--dp-line)',
        padding: '2px 6px',
        background: rowBg,
        transition: 'background 0.15s',
      }}
    >
      <div style={{ width: 2.5, height: 20, borderRadius: 1, marginRight: 14, flexShrink: 0, background: barColor }} />
      <span style={{ flex: '0 0 155px', fontSize: 12, fontWeight: 500, color: labelColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
      <input
        ref={setRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          flex: 1,
          minWidth: 0,
          padding: '4px 0',
          border: 'none',
          background: isFocused ? 'rgba(120,140,255,0.03)' : 'transparent',
          outline: 'none',
          textAlign: 'right',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: 'var(--dp-input)',
          borderRadius: 4,
        }}
      />
      {unitText && (
        <span style={{ fontSize: 10, color: 'var(--dp-text-faint)', minWidth: 24, textAlign: 'right', fontFamily: 'var(--font-mono)', marginLeft: 2 }}>
          {unitText}
        </span>
      )}
      <div style={{ minWidth: 40, textAlign: 'right' }}>
        {badge && (
          <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1, color: badge.color, textTransform: 'uppercase' }}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  )
}
