'use client'

type DataSource = 'pappers' | 'corrected' | 'declaratif'

interface RecapData {
  companyName: string
  siren: string
  activityType: string
  revenue: number | null
  ebitda: number | null
  growth: number
  recurring: number
  masseSalariale: number
  effectif: string
  hasPatrimoine: boolean | null
  loyersNets: number | null
  remunerationDirigeant: number | null
  dettesFinancieres: number | null
  tresorerieActuelle: number | null
  concentrationClient: number
  mrrMensuel: number | null
}

interface StepFinalRecapProps {
  data: RecapData
  dataSources: Record<string, DataSource>
  companyName: string
  onSubmit: () => void
  onEdit: (step: number) => void
}

const ACTIVITY_LABELS: Record<string, string> = {
  saas: 'SaaS / Logiciel',
  marketplace: 'Marketplace',
  ecommerce: 'E-commerce',
  conseil: 'Conseil / Services',
  services: 'Services recurrents',
  commerce: 'Commerce / Retail',
  industrie: 'Industrie / BTP',
  immobilier: 'Immobilier',
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

const SOURCE_COLORS: Record<DataSource, { bg: string; color: string }> = {
  pappers: { bg: 'rgba(68,102,238,0.1)', color: '#7799cc' },
  corrected: { bg: 'rgba(200,150,60,0.1)', color: '#aa9966' },
  declaratif: { bg: 'rgba(255,255,255,0.04)', color: 'var(--dg-text-faint)' },
}

function SourceBadge({ source }: { source?: DataSource }) {
  if (!source) return null
  const labels: Record<DataSource, string> = {
    pappers: 'Pappers',
    corrected: 'Corrigé',
    declaratif: 'Déclaratif',
  }
  const c = SOURCE_COLORS[source]
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 6,
      fontSize: 10, fontWeight: 600, background: c.bg, color: c.color,
    }}>
      {labels[source]}
    </span>
  )
}

function RecapRow({
  label,
  value,
  source,
  step,
  onEdit,
}: {
  label: string
  value: string
  source?: DataSource
  step: number
  onEdit: (step: number) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onEdit(step)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '10px 14px', borderRadius: 8,
        background: 'transparent', border: 'none', cursor: 'pointer',
        textAlign: 'left', transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: 'var(--dg-text-muted)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dg-text)', fontFamily: 'var(--font-mono)' }}>
            {value}
          </span>
          <SourceBadge source={source} />
        </div>
      </div>
      <span style={{ fontSize: 11, color: 'var(--dg-text-faint)', marginLeft: 8, flexShrink: 0 }}>
        ✎
      </span>
    </button>
  )
}

function RecapSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 style={{
        fontSize: 11, fontWeight: 700, color: 'var(--dg-text-faint)',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, paddingLeft: 14,
      }}>
        {title}
      </h3>
      <div style={{
        background: 'var(--dg-card)', border: '1px solid var(--dg-card-border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

export function StepFinalRecap({
  data,
  dataSources,
  companyName,
  onSubmit,
  onEdit,
}: StepFinalRecapProps) {
  const showSaaS = ['saas', 'marketplace'].includes(data.activityType)
  const showPatrimoine = data.hasPatrimoine === true || data.activityType === 'immobilier'

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--dg-text)', letterSpacing: -0.5 }}>
          {companyName}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--dg-text-muted)', marginTop: 4 }}>
          Vérifiez avant de lancer
        </p>
      </div>

      <div className="space-y-4">
        {/* Identité */}
        <RecapSection title="Identité">
          <RecapRow
            label="Activité"
            value={ACTIVITY_LABELS[data.activityType] || data.activityType}
            step={1}
            onEdit={onEdit}
          />
          <RecapRow
            label="Effectif"
            value={data.effectif || 'Non renseigné'}
            step={7}
            onEdit={onEdit}
          />
        </RecapSection>

        {/* Données financières */}
        <RecapSection title="Données financières">
          <RecapRow
            label="Chiffre d'affaires"
            value={data.revenue != null ? `${formatNumber(data.revenue)} €` : 'Non renseigné'}
            source={dataSources.revenue}
            step={2}
            onEdit={onEdit}
          />
          <RecapRow
            label="EBITDA"
            value={data.ebitda != null ? `${formatNumber(data.ebitda)} €` : 'Non renseigné'}
            source={dataSources.ebitda}
            step={3}
            onEdit={onEdit}
          />
          <RecapRow
            label="Croissance"
            value={`${data.growth}%`}
            source={dataSources.growth}
            step={4}
            onEdit={onEdit}
          />
          <RecapRow
            label="Récurrence"
            value={`${data.recurring}%`}
            step={5}
            onEdit={onEdit}
          />
        </RecapSection>

        {/* Structure */}
        <RecapSection title="Structure">
          <RecapRow
            label="Masse salariale"
            value={`${data.masseSalariale}% du CA`}
            step={6}
            onEdit={onEdit}
          />
          <RecapRow
            label="Rémunération dirigeant"
            value={
              data.remunerationDirigeant != null
                ? `${formatNumber(data.remunerationDirigeant)} €/an`
                : 'Non renseigné'
            }
            source={dataSources.remunerationDirigeant}
            step={10}
            onEdit={onEdit}
          />
          <RecapRow
            label="Trésorerie"
            value={
              data.tresorerieActuelle != null
                ? `${formatNumber(data.tresorerieActuelle)} €`
                : 'Non renseigné'
            }
            source={dataSources.tresorerieActuelle}
            step={12}
            onEdit={onEdit}
          />
          <RecapRow
            label="Dettes financières"
            value={
              data.dettesFinancieres != null
                ? `${formatNumber(data.dettesFinancieres)} €`
                : 'Non renseigné'
            }
            source={dataSources.dettesFinancieres}
            step={11}
            onEdit={onEdit}
          />
        </RecapSection>

        {/* Profil */}
        <RecapSection title="Profil">
          <RecapRow
            label="Concentration client"
            value={`${data.concentrationClient}%`}
            source={dataSources.concentrationClient}
            step={13}
            onEdit={onEdit}
          />
          {showPatrimoine && (
            <RecapRow
              label="Loyers nets"
              value={
                data.loyersNets != null
                  ? `${formatNumber(data.loyersNets)} €/an`
                  : 'Non renseigné'
              }
              step={9}
              onEdit={onEdit}
            />
          )}
          {showSaaS && (
            <RecapRow
              label="MRR"
              value={
                data.mrrMensuel != null
                  ? `${formatNumber(data.mrrMensuel)} €/mois`
                  : 'Non renseigné'
              }
              step={14}
              onEdit={onEdit}
            />
          )}
        </RecapSection>

        <button
          type="button"
          onClick={onSubmit}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            background: 'linear-gradient(135deg, #3355cc, #4466ee)', color: '#fff',
            boxShadow: '0 4px 24px rgba(51,85,204,0.25)',
          }}
        >
          Voir mon diagnostic
        </button>
      </div>
    </div>
  )
}
