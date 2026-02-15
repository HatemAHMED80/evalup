'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import type { ConversationContext, UploadedDocument } from '@/lib/anthropic'
import { FieldRow } from './FieldRow'
import { SectionCard } from './SectionCard'
import { MetricChip } from './MetricChip'
import { MissingFields } from './MissingFields'
import { DocumentUploadZone } from './DocumentUploadZone'
import { GenerateButton } from './GenerateButton'
import { ARCHETYPES } from '@/lib/valuation/archetypes'
import {
  contextToPanel,
  panelToContext,
  computeCompleteness,
  computeOverallCompleteness,
  type DataPanelState,
  type EditableBilan,
} from './dataPanelBridge'

const OBJECTIF_OPTIONS = [
  { value: 'vente', label: 'Vendre mon entreprise' },
  { value: 'achat', label: 'Racheter cette entreprise' },
  { value: 'associe', label: "Rachat / sortie d'associe" },
  { value: 'divorce', label: 'Separation de patrimoine' },
  { value: 'transmission', label: 'Donation familiale' },
  { value: 'conflit', label: 'Litige entre associes' },
  { value: 'financement', label: 'Banque, levee de fonds' },
  { value: 'pilotage', label: 'Comprendre ma valeur' },
]

interface DataPanelProps {
  context: ConversationContext
  onContextChange: React.Dispatch<React.SetStateAction<ConversationContext>>
  evaluationId?: string
  className?: string
  onClose?: () => void
  highlightedFields?: string[]
  onFieldChange?: (label: string, value: string) => void
}

const fmt = new Intl.NumberFormat('fr-FR')

function formatNumber(value: number): string {
  return fmt.format(value)
}

type Tab = 'financier' | 'qualitatif' | 'saas'

// Color helpers
function completenessColor(pct: number): string {
  if (pct >= 70) return '#44aa66'
  if (pct >= 40) return '#5577ee'
  return '#bb8833'
}

function margeColor(value: number, threshold: number): string {
  if (value > threshold) return '#44aa66'
  if (value > 0) return '#bb9933'
  return '#cc5544'
}

// Critical fields for "required" status
const CRITICAL_KEYS: (keyof EditableBilan)[] = [
  'chiffre_affaires', 'resultat_net', 'resultat_exploitation',
]

export function DataPanel({
  context,
  onContextChange,
  evaluationId,
  className = '',
  onClose,
  highlightedFields,
  onFieldChange,
}: DataPanelProps) {
  const panel = useMemo(() => contextToPanel(context), [context])
  const [activeTab, setActiveTab] = useState<Tab>('financier')
  const fieldRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Years
  const years = Object.keys(panel.financials).map(Number).sort((a, b) => b - a).slice(0, 4)
  const pappersBilans = context.financials?.bilans || []
  const pappersYears = pappersBilans.map((b) => b.annee).sort((a, b) => b - a)
  const currentYear = new Date().getFullYear()
  const defaultYear = currentYear - 1
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear)

  // Update helpers (unchanged)
  const updateBilan = useCallback(
    (year: number, field: keyof EditableBilan, value: number | null) => {
      onContextChange((prev) => {
        const currentPanel = contextToPanel(prev)
        const updated: DataPanelState = {
          ...currentPanel,
          financials: { ...currentPanel.financials, [year]: { ...currentPanel.financials[year], [field]: value } },
        }
        return panelToContext(updated, prev)
      })
    },
    [onContextChange]
  )

  const updateRetraitement = useCallback(
    (field: keyof DataPanelState['retraitements'], value: number | boolean | null) => {
      onContextChange((prev) => {
        const currentPanel = contextToPanel(prev)
        const updated: DataPanelState = { ...currentPanel, retraitements: { ...currentPanel.retraitements, [field]: value } }
        return panelToContext(updated, prev)
      })
    },
    [onContextChange]
  )

  const updateQualitative = useCallback(
    (field: keyof DataPanelState['qualitativeData'], value: string | number | boolean | null) => {
      onContextChange((prev) => {
        const currentPanel = contextToPanel(prev)
        const updated: DataPanelState = { ...currentPanel, qualitativeData: { ...currentPanel.qualitativeData, [field]: value } }
        return panelToContext(updated, prev)
      })
    },
    [onContextChange]
  )

  const updateSaaS = useCallback(
    (field: keyof DataPanelState['saasMetrics'], value: number | null) => {
      onContextChange((prev) => {
        const currentPanel = contextToPanel(prev)
        const updated: DataPanelState = { ...currentPanel, saasMetrics: { ...currentPanel.saasMetrics, [field]: value } }
        return panelToContext(updated, prev)
      })
    },
    [onContextChange]
  )

  const handleDocumentAdded = useCallback(
    (doc: UploadedDocument) => {
      onContextChange((prev) => ({ ...prev, documents: [...prev.documents, doc] }))
    },
    [onContextChange]
  )

  const handleObjectifChange = useCallback(
    (value: string) => {
      onContextChange((prev) => ({ ...prev, objectif: (value || undefined) as ConversationContext['objectif'] }))
    },
    [onContextChange]
  )

  // Completeness
  const archetype = context.archetype
  const overall = computeOverallCompleteness(panel, archetype)
  const showSaaS = archetype?.startsWith('saas_') || archetype === 'marketplace'
  const finComp = computeCompleteness(panel, 'financier', archetype)
  const qualComp = computeCompleteness(panel, 'qualitatif', archetype)
  const saasComp = showSaaS ? computeCompleteness(panel, 'saas', archetype) : 0

  // Pappers reference
  const pappersForYear = (year: number) => pappersBilans.find((b) => b.annee === year)

  // Calculated ratios
  const bilan = panel.financials[selectedYear]
  const ca = bilan?.chiffre_affaires
  const re = bilan?.resultat_exploitation
  const amort = bilan?.dotations_amortissements
  const rn = bilan?.resultat_net
  const ebitda = re != null && amort != null ? re + amort : null
  const margeEbitda = ebitda != null && ca != null && ca > 0 ? (ebitda / ca) * 100 : null
  const margeNette = rn != null && ca != null && ca > 0 ? (rn / ca) * 100 : null

  // SaaS calculated
  const mrr = panel.saasMetrics.mrr
  const churn = panel.saasMetrics.churnMensuel
  const arr = mrr != null ? mrr * 12 : null
  const ltv = mrr != null && churn != null && churn > 0 ? mrr / (churn / 100) : null
  const cac = panel.saasMetrics.cac
  const ltvCac = ltv != null && cac != null && cac > 0 ? ltv / cac : null
  const clientLifetime = churn != null && churn > 0 ? Math.round(1 / (churn / 100)) : null

  // Field definitions
  const CR_FIELDS: { key: keyof EditableBilan; label: string; type: 'currency' | 'number' }[] = [
    { key: 'chiffre_affaires', label: "Chiffre d'affaires", type: 'currency' },
    { key: 'resultat_exploitation', label: "Resultat d'exploitation", type: 'currency' },
    { key: 'resultat_net', label: 'Resultat net', type: 'currency' },
    { key: 'dotations_amortissements', label: 'Amortissements', type: 'currency' },
  ]

  const BILAN_FIELDS: { key: keyof EditableBilan; label: string; type: 'currency' | 'number' }[] = [
    { key: 'tresorerie', label: 'Tresorerie', type: 'currency' },
    { key: 'dettes_financieres', label: 'Dettes financieres', type: 'currency' },
    { key: 'capitaux_propres', label: 'Capitaux propres', type: 'currency' },
    { key: 'creances_clients', label: 'Creances clients', type: 'currency' },
    { key: 'dettes_fournisseurs', label: 'Dettes fournisseurs', type: 'currency' },
    { key: 'stocks', label: 'Stocks', type: 'currency' },
    { key: 'provisions', label: 'Provisions', type: 'currency' },
  ]

  // Missing fields
  const missingFinancier = useMemo(() => {
    if (!bilan) return []
    return [...CR_FIELDS, ...BILAN_FIELDS]
      .filter(f => CRITICAL_KEYS.includes(f.key) && bilan[f.key] == null)
      .map(f => ({ label: f.label, id: `${selectedYear}-${f.key}` }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bilan, selectedYear])

  // Scroll-to-focus
  const scrollToField = useCallback((id: string) => {
    const el = fieldRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus()
    }
  }, [])

  const registerRef = useCallback((id: string) => (el: HTMLInputElement | null) => {
    fieldRefs.current[id] = el
  }, [])

  // Subtitle
  const objLabel = OBJECTIF_OPTIONS.find(o => o.value === context.objectif)?.label
  const archLabel = archetype && ARCHETYPES[archetype] ? ARCHETYPES[archetype].name : ''
  const subtitle = [objLabel, archLabel].filter(Boolean).join(' \u00b7 ')

  // Filled counts
  const crFilled = bilan ? CR_FIELDS.filter(f => bilan[f.key] != null).length : 0
  const bilanFilled = bilan ? BILAN_FIELDS.filter(f => bilan[f.key] != null).length : 0

  // Category tabs
  const categoryTabs = useMemo(() => {
    const tabs: { id: Tab; label: string; comp: number }[] = [
      { id: 'financier', label: 'Financier', comp: finComp },
      { id: 'qualitatif', label: 'Qualitatif', comp: qualComp },
    ]
    if (showSaaS) tabs.push({ id: 'saas', label: 'SaaS', comp: saasComp })
    return tabs
  }, [finComp, qualComp, saasComp, showSaaS])

  return (
    <div className={`panel-dark h-full flex flex-col ${className}`} style={{ background: 'var(--dp-bg)' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ flexShrink: 0, padding: '14px 16px 0' }}>

        {/* Row 1: Name + % + close */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--dp-text)', letterSpacing: -0.5, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {context.entreprise?.nom || 'Donnees'}
            </h2>
            {subtitle && (
              <p style={{ fontSize: 10, color: 'var(--dp-text-muted)', letterSpacing: 0.5, marginTop: 2 }}>
                {subtitle}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: -1, color: completenessColor(overall) }}>
              {overall}
            </span>
            <span style={{ fontSize: 13, color: 'var(--dp-text-faint)' }}>%</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{ marginLeft: 8, padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dp-text-dim)', borderRadius: 4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress bar — ultra-thin 1.5px */}
        <div style={{ height: 1.5, background: 'rgba(255,255,255,0.025)', marginTop: 10, borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${overall}%`, background: completenessColor(overall), transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)', borderRadius: 1 }} />
        </div>

        {/* Upload compact */}
        <div style={{ marginTop: 8 }}>
          <DocumentUploadZone
            evaluationId={evaluationId}
            context={context}
            onDocumentAdded={handleDocumentAdded}
            compact
          />
        </div>

        {/* Objectif dropdown — dark */}
        <select
          value={context.objectif || ''}
          onChange={(e) => handleObjectifChange(e.target.value)}
          style={{
            width: '100%', marginTop: 8, padding: '6px 8px', fontSize: 10,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 8, color: context.objectif ? 'var(--dp-text-dim)' : 'var(--dp-text-faint)',
            outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="" style={{ background: '#0d0f15' }}>Objectif...</option>
          {OBJECTIF_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} style={{ background: '#0d0f15' }}>{o.label}</option>
          ))}
        </select>

        {/* Year tabs */}
        {years.length > 1 && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.025)', marginTop: 8 }}>
            {years.map((y) => {
              const isActive = y === selectedYear
              const hasPappers = pappersYears.includes(y)
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => setSelectedYear(y)}
                  style={{
                    flex: 1, padding: '8px 0 10px', fontSize: 12, border: 'none', cursor: 'pointer',
                    background: 'transparent', fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--dp-text)' : '#333855',
                    borderBottom: isActive ? '2px solid var(--dp-blue)' : '2px solid transparent',
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}
                >
                  {y}
                  {hasPappers && (
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#6688dd' : '#2a3355' }} />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Category tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
          {categoryTabs.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '8px 0 10px', border: 'none', cursor: 'pointer', background: 'transparent',
                  fontSize: 11, letterSpacing: 0.3, textTransform: 'capitalize',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#b0b4cc' : '#2d3250',
                  borderBottom: isActive ? '2px solid #7799ff' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ BODY (scrollable) ═══ */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ padding: '8px 10px' }}>

        {/* ─── FINANCIER TAB ─── */}
        {activeTab === 'financier' && (
          <>
            <SectionCard title="COMPTE DE RESULTAT" filled={crFilled} total={CR_FIELDS.length}>
              {bilan && CR_FIELDS.map(({ key, label, type }) => {
                const pappers = pappersForYear(selectedYear)
                const fieldId = `${selectedYear}-${key}`
                return (
                  <FieldRow
                    key={fieldId}
                    label={label}
                    value={bilan[key] as number | null}
                    onChange={(v) => {
                      updateBilan(selectedYear, key, v as number | null)
                      if (v != null && onFieldChange) {
                        onFieldChange(label, typeof v === 'number' ? formatNumber(v) + ' \u20ac' : String(v))
                      }
                    }}
                    type={type}
                    source={pappers && pappers[key as keyof typeof pappers] != null ? 'pappers' : undefined}
                    pappersValue={pappers ? (pappers[key as keyof typeof pappers] as number | undefined) ?? null : null}
                    required={CRITICAL_KEYS.includes(key)}
                    highlighted={highlightedFields?.includes(label)}
                    inputRef={registerRef(fieldId)}
                  />
                )
              })}
            </SectionCard>

            {/* Metric chips */}
            {(margeEbitda != null || margeNette != null) && (
              <div style={{ display: 'flex', gap: 8, margin: '6px 0' }}>
                {margeEbitda != null && (
                  <MetricChip
                    label="MARGE EBITDA"
                    value={`${margeEbitda.toFixed(1)}%`}
                    color={margeColor(margeEbitda, 15)}
                  />
                )}
                {margeNette != null && (
                  <MetricChip
                    label="MARGE NETTE"
                    value={`${margeNette.toFixed(1)}%`}
                    color={margeColor(margeNette, 10)}
                    warning={margeNette > 100 ? '\u26a0 Elements exceptionnels ?' : undefined}
                  />
                )}
              </div>
            )}

            <SectionCard title="BILAN" filled={bilanFilled} total={BILAN_FIELDS.length}>
              {bilan && BILAN_FIELDS.map(({ key, label, type }) => {
                const pappers = pappersForYear(selectedYear)
                const fieldId = `${selectedYear}-${key}`
                return (
                  <FieldRow
                    key={fieldId}
                    label={label}
                    value={bilan[key] as number | null}
                    onChange={(v) => {
                      updateBilan(selectedYear, key, v as number | null)
                      if (v != null && onFieldChange) {
                        onFieldChange(label, typeof v === 'number' ? formatNumber(v) + ' \u20ac' : String(v))
                      }
                    }}
                    type={type}
                    source={pappers && pappers[key as keyof typeof pappers] != null ? 'pappers' : undefined}
                    pappersValue={pappers ? (pappers[key as keyof typeof pappers] as number | undefined) ?? null : null}
                    highlighted={highlightedFields?.includes(label)}
                    inputRef={registerRef(fieldId)}
                  />
                )
              })}
            </SectionCard>

            <MissingFields fields={missingFinancier} onFocus={scrollToField} />
          </>
        )}

        {/* ─── QUALITATIF TAB ─── */}
        {activeTab === 'qualitatif' && (
          <>
            <SectionCard title="RETRAITEMENTS" filled={
              [panel.retraitements.salaireDirigeant, panel.retraitements.loyerAnnuel, panel.retraitements.chargesExceptionnelles]
                .filter(v => v != null).length
            } total={3}>
              <FieldRow label="Salaire dirigeant" value={panel.retraitements.salaireDirigeant ?? null} onChange={(v) => updateRetraitement('salaireDirigeant', v as number | null)} type="currency" required />
              <FieldRow label="Loyer annuel" value={panel.retraitements.loyerAnnuel ?? null} onChange={(v) => updateRetraitement('loyerAnnuel', v as number | null)} type="currency" required />
              <FieldRow label="Loyer marche" value={panel.retraitements.loyerMarche ?? null} onChange={(v) => updateRetraitement('loyerMarche', v as number | null)} type="currency" />
              <FieldRow label="Local du dirigeant" value={panel.retraitements.loyerAppartientDirigeant ?? null} onChange={(v) => updateRetraitement('loyerAppartientDirigeant', v as boolean | null)} type="boolean" />
              <FieldRow label="Credit-bail annuel" value={panel.retraitements.creditBailAnnuel ?? null} onChange={(v) => updateRetraitement('creditBailAnnuel', v as number | null)} type="currency" />
              <FieldRow label="Credit-bail restant" value={panel.retraitements.creditBailRestant ?? null} onChange={(v) => updateRetraitement('creditBailRestant', v as number | null)} type="currency" />
              <FieldRow label="Charges except." value={panel.retraitements.chargesExceptionnelles ?? null} onChange={(v) => updateRetraitement('chargesExceptionnelles', v as number | null)} type="currency" required />
              <FieldRow label="Produits except." value={panel.retraitements.produitsExceptionnels ?? null} onChange={(v) => updateRetraitement('produitsExceptionnels', v as number | null)} type="currency" />
              <FieldRow label="Salaires excessifs" value={panel.retraitements.salairesExcessifsFamille ?? null} onChange={(v) => updateRetraitement('salairesExcessifsFamille', v as number | null)} type="currency" />
              <FieldRow label="Salaires insuffisants" value={panel.retraitements.salairesInsuffisantsFamille ?? null} onChange={(v) => updateRetraitement('salairesInsuffisantsFamille', v as number | null)} type="currency" />
            </SectionCard>

            <SectionCard title="DONNEES QUALITATIVES" filled={
              [panel.qualitativeData.dependanceDirigeant, panel.qualitativeData.concentrationClients]
                .filter(v => v != null).length
            } total={2}>
              <FieldRow label="Dependance dirigeant" value={panel.qualitativeData.dependanceDirigeant ?? null} onChange={(v) => updateQualitative('dependanceDirigeant', v as string | null)} type="select" options={[{ value: 'faible', label: 'Faible' }, { value: 'moyenne', label: 'Moyenne' }, { value: 'forte', label: 'Forte' }]} required />
              <FieldRow label="Concentration clients" value={panel.qualitativeData.concentrationClients ?? null} onChange={(v) => updateQualitative('concentrationClients', v as number | null)} type="percent" required />
              <FieldRow label="Participation minoritaire" value={panel.qualitativeData.participationMinoritaire ?? null} onChange={(v) => updateQualitative('participationMinoritaire', v as boolean | null)} type="boolean" />
              <FieldRow label="Litiges en cours" value={panel.qualitativeData.litiges ?? null} onChange={(v) => updateQualitative('litiges', v as boolean | null)} type="boolean" />
              <FieldRow label="Contrats cles" value={panel.qualitativeData.contratsCles ?? null} onChange={(v) => updateQualitative('contratsCles', v as boolean | null)} type="boolean" />
            </SectionCard>
          </>
        )}

        {/* ─── SAAS TAB ─── */}
        {activeTab === 'saas' && showSaaS && (
          <>
            <SectionCard title="METRIQUES SAAS" filled={
              [panel.saasMetrics.mrr, panel.saasMetrics.churnMensuel, panel.saasMetrics.nrr, panel.saasMetrics.cac]
                .filter(v => v != null).length
            } total={4}>
              <FieldRow label="MRR" value={panel.saasMetrics.mrr ?? null} onChange={(v) => updateSaaS('mrr', v as number | null)} type="currency" unit="\u20ac/mois" required />
              <FieldRow label="Churn mensuel" value={panel.saasMetrics.churnMensuel ?? null} onChange={(v) => updateSaaS('churnMensuel', v as number | null)} type="percent" required />
              <FieldRow label="NRR" value={panel.saasMetrics.nrr ?? null} onChange={(v) => updateSaaS('nrr', v as number | null)} type="percent" required />
              <FieldRow label="CAC" value={panel.saasMetrics.cac ?? null} onChange={(v) => updateSaaS('cac', v as number | null)} type="currency" required />
              <FieldRow label="CAC Payback" value={panel.saasMetrics.cacPayback ?? null} onChange={(v) => updateSaaS('cacPayback', v as number | null)} type="number" unit="mois" />
              <FieldRow label="Runway" value={panel.saasMetrics.runway ?? null} onChange={(v) => updateSaaS('runway', v as number | null)} type="number" unit="mois" />
              <FieldRow label="GMV" value={panel.saasMetrics.gmv ?? null} onChange={(v) => updateSaaS('gmv', v as number | null)} type="currency" />
            </SectionCard>

            {/* SaaS metric chips */}
            {(arr != null || ltv != null || ltvCac != null || clientLifetime != null) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {arr != null && (
                  <MetricChip label="ARR" value={`${formatNumber(arr)} \u20ac`} color="var(--dp-text)" />
                )}
                {clientLifetime != null && (
                  <MetricChip
                    label="DUREE DE VIE"
                    value={`${clientLifetime}m`}
                    color={clientLifetime >= 24 ? '#44aa66' : clientLifetime >= 12 ? '#bb9933' : '#cc5544'}
                  />
                )}
                {ltv != null && (
                  <MetricChip label="LTV" value={`${formatNumber(Math.round(ltv))} \u20ac`} color="var(--dp-text)" />
                )}
                {ltvCac != null && (
                  <MetricChip
                    label="LTV / CAC"
                    value={`${ltvCac.toFixed(1)}x`}
                    color={ltvCac >= 3 ? '#44aa66' : ltvCac >= 1 ? '#bb9933' : '#cc5544'}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ FOOTER ═══ */}
      <GenerateButton context={context} completeness={overall} />
    </div>
  )
}
