// Générateur PDF principal pour les rapports d'évaluation EvalUp
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer'
import { COLORS } from './styles'
import { formatCurrency, formatPercent, formatNumber, cleanText } from './utils'
import { BENCHMARKS, compareWithBenchmark, getSectorFromNaf } from './sector-benchmarks'

// Enregistrer la police Roboto qui supporte les caractères accentués français
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 'bold',
    },
  ],
})

// ============================================
// TYPES
// ============================================

export interface EvaluationData {
  entreprise: {
    nom: string
    siren: string
    secteur: string
    codeNaf: string
    dateCreation: string
    effectif: number | string
    localisation: string
  }
  financier: {
    ca: number
    resultatNet: number
    ebitda: number
    tresorerie: number
    dettes: number
    capitauxPropres: number
    margeNette: number
    margeEbitda: number
    dso: number
    ratioEndettement: number
  }
  historique: {
    annee: number
    ca: number
    resultatNet: number
    tresorerie: number
  }[]
  valorisation: {
    basse: number
    moyenne: number
    haute: number
  }
  methodes: {
    nom: string
    valeur: number
    poids: number
    explication: string
  }[]
  pointsForts: string[]
  pointsVigilance: string[]
  recommandations: string[]
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: COLORS.gray700,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  date: {
    fontSize: 9,
    color: COLORS.gray500,
  },

  // Titre principal
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 20,
  },

  // Carte valorisation principale
  valorisationCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 25,
    marginBottom: 25,
  },
  valorisationLabel: {
    fontSize: 11,
    color: COLORS.white,
    marginBottom: 5,
  },
  valorisationValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 5,
  },
  valorisationRange: {
    fontSize: 12,
    color: COLORS.white,
  },
  valorisationMethod: {
    fontSize: 9,
    color: COLORS.white,
    marginTop: 10,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: 12,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },

  // Grid 2 colonnes
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  col2: {
    flex: 1,
  },

  // Cards d'info
  infoCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 8,
    color: COLORS.gray500,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },

  // Tableau
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gray700,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.gray700,
  },
  tableCellBold: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },

  // Jauges / Indicateurs
  gauge: {
    marginBottom: 12,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gaugeLabel: {
    fontSize: 9,
    color: COLORS.gray700,
  },
  gaugeValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  gaugeBar: {
    height: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 4,
  },
  gaugeFill: {
    height: 8,
    borderRadius: 4,
  },

  // Comparaison secteur
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  comparisonLabel: {
    flex: 2,
    fontSize: 9,
    color: COLORS.gray700,
  },
  comparisonValue: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  comparisonBenchmark: {
    flex: 1,
    fontSize: 8,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  comparisonStatus: {
    flex: 1,
    textAlign: 'center',
  },
  statusGood: {
    backgroundColor: COLORS.bgGreen,
    color: COLORS.success,
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statusAverage: {
    backgroundColor: COLORS.bgOrange,
    color: COLORS.warning,
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statusBad: {
    backgroundColor: COLORS.bgRed,
    color: COLORS.danger,
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },

  // Points forts / vigilance
  pointsCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  pointsCardGreen: {
    backgroundColor: COLORS.bgGreen,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  pointsCardOrange: {
    backgroundColor: COLORS.bgOrange,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  pointsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pointItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  pointBullet: {
    width: 15,
    fontSize: 9,
  },
  pointText: {
    flex: 1,
    fontSize: 9,
    color: COLORS.gray700,
  },

  // Méthodes d'évaluation
  methodCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  methodName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },
  methodValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  methodWeight: {
    fontSize: 8,
    color: COLORS.gray500,
    marginBottom: 5,
  },
  methodExplanation: {
    fontSize: 8,
    color: COLORS.gray700,
    lineHeight: 1.4,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.gray500,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: 10,
  },

  // Page number
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: COLORS.gray500,
  },

  // Disclaimer
  disclaimer: {
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  disclaimerText: {
    fontSize: 8,
    color: COLORS.gray500,
    lineHeight: 1.5,
  },
})

// ============================================
// COMPOSANTS
// ============================================

// Composant Jauge
const Gauge = ({
  label,
  value,
  maxValue,
  color,
  suffix = '',
}: {
  label: string
  value: number
  maxValue: number
  color: string
  suffix?: string
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100)

  return (
    <View style={styles.gauge}>
      <View style={styles.gaugeHeader}>
        <Text style={styles.gaugeLabel}>{label}</Text>
        <Text style={[styles.gaugeValue, { color }]}>
          {typeof value === 'number' ? value.toFixed(1) : value}
          {suffix}
        </Text>
      </View>
      <View style={styles.gaugeBar}>
        <View
          style={[styles.gaugeFill, { width: `${percentage}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  )
}

// Composant Comparaison Secteur
const ComparisonRow = ({
  label,
  value,
  benchmark,
  status,
  format = 'percent',
}: {
  label: string
  value: number
  benchmark: string
  status: 'good' | 'average' | 'bad'
  format?: 'percent' | 'number' | 'days'
}) => {
  const formattedValue =
    format === 'percent'
      ? formatPercent(value)
      : format === 'days'
        ? `${Math.round(value)} j`
        : formatNumber(value)

  const statusStyle =
    status === 'good'
      ? styles.statusGood
      : status === 'average'
        ? styles.statusAverage
        : styles.statusBad

  const statusText =
    status === 'good' ? 'Bon' : status === 'average' ? 'Moyen' : 'A surveiller'

  return (
    <View style={styles.comparisonRow}>
      <Text style={styles.comparisonLabel}>{label}</Text>
      <Text style={styles.comparisonValue}>{formattedValue}</Text>
      <Text style={styles.comparisonBenchmark}>{benchmark}</Text>
      <View style={styles.comparisonStatus}>
        <Text style={statusStyle}>{statusText}</Text>
      </View>
    </View>
  )
}

// ============================================
// DOCUMENT PDF PRINCIPAL
// ============================================

const EvaluationReport = ({ data }: { data: EvaluationData }) => {
  const secteurCode = getSectorFromNaf(data.entreprise.codeNaf)
  const benchmark = BENCHMARKS[secteurCode] || BENCHMARKS.default

  return (
    <Document>
      {/* PAGE 1 : Synthèse */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>EvalUp</Text>
          <Text style={styles.date}>
            Genere le {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {/* Titre */}
        <Text style={styles.mainTitle}>{cleanText(data.entreprise.nom)}</Text>
        <Text style={styles.subtitle}>
          Rapport d&apos;evaluation - {data.entreprise.secteur}
        </Text>

        {/* Carte Valorisation */}
        <View style={styles.valorisationCard}>
          <Text style={styles.valorisationLabel}>
            Estimation de valeur d&apos;entreprise
          </Text>
          <Text style={styles.valorisationValue}>
            {formatCurrency(data.valorisation.moyenne)}
          </Text>
          <Text style={styles.valorisationRange}>
            Fourchette : {formatCurrency(data.valorisation.basse)} -{' '}
            {formatCurrency(data.valorisation.haute)}
          </Text>
          <Text style={styles.valorisationMethod}>
            Methode principale : Multiple EBITDA
          </Text>
        </View>

        {/* Infos entreprise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de l&apos;entreprise</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>SIREN</Text>
                <Text style={styles.infoValue}>{data.entreprise.siren}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Date de creation</Text>
                <Text style={styles.infoValue}>{data.entreprise.dateCreation}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Effectif</Text>
                <Text style={styles.infoValue}>{data.entreprise.effectif} salaries</Text>
              </View>
            </View>
            <View style={styles.col2}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Secteur</Text>
                <Text style={styles.infoValue}>{data.entreprise.secteur}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Code NAF</Text>
                <Text style={styles.infoValue}>{data.entreprise.codeNaf}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Localisation</Text>
                <Text style={styles.infoValue}>{data.entreprise.localisation}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ratios clés avec jauges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs financiers</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Gauge
                label="Marge nette"
                value={data.financier.margeNette * 100}
                maxValue={15}
                color={data.financier.margeNette >= benchmark.margeNette.median ? COLORS.success : COLORS.warning}
                suffix="%"
              />
              <Gauge
                label="Marge EBITDA"
                value={data.financier.margeEbitda * 100}
                maxValue={25}
                color={data.financier.margeEbitda >= benchmark.margeEbitda.median ? COLORS.success : COLORS.warning}
                suffix="%"
              />
            </View>
            <View style={styles.col2}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Chiffre d&apos;affaires</Text>
                <Text style={styles.infoValue}>{formatCurrency(data.financier.ca)}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>EBITDA</Text>
                <Text style={styles.infoValue}>{formatCurrency(data.financier.ebitda)}</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Resultat net</Text>
                <Text style={styles.infoValue}>
                  {formatCurrency(data.financier.resultatNet)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer page 1 */}
        <View style={styles.footer}>
          <Text>Ce rapport est fourni a titre indicatif.</Text>
          <Text>EvalUp 2026</Text>
        </View>
        <Text style={styles.pageNumber}>1 / 3</Text>
      </Page>

      {/* PAGE 2 : Analyse & Comparaison */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>EvalUp</Text>
          <Text style={styles.date}>{cleanText(data.entreprise.nom)}</Text>
        </View>

        {/* Comparaison avec le secteur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Comparaison avec le secteur {benchmark.nom}
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Indicateur</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>
                Votre valeur
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>
                Mediane secteur
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>
                Position
              </Text>
            </View>

            <ComparisonRow
              label="Marge nette"
              value={data.financier.margeNette}
              benchmark={formatPercent(benchmark.margeNette.median)}
              status={compareWithBenchmark(data.financier.margeNette, benchmark.margeNette)}
            />
            <ComparisonRow
              label="Marge EBITDA"
              value={data.financier.margeEbitda}
              benchmark={formatPercent(benchmark.margeEbitda.median)}
              status={compareWithBenchmark(data.financier.margeEbitda, benchmark.margeEbitda)}
            />
            <ComparisonRow
              label="Delai client (DSO)"
              value={data.financier.dso}
              benchmark={`${benchmark.dso.median} j`}
              status={compareWithBenchmark(data.financier.dso, benchmark.dso, false)}
              format="days"
            />
          </View>
        </View>

        {/* Points forts et vigilance */}
        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={[styles.pointsCard, styles.pointsCardGreen]}>
              <Text style={[styles.pointsTitle, { color: COLORS.success }]}>
                Points forts
              </Text>
              {data.pointsForts.slice(0, 5).map((point, i) => (
                <View key={i} style={styles.pointItem}>
                  <Text style={styles.pointBullet}>+</Text>
                  <Text style={styles.pointText}>{cleanText(point)}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.col2}>
            <View style={[styles.pointsCard, styles.pointsCardOrange]}>
              <Text style={[styles.pointsTitle, { color: COLORS.warning }]}>
                Points de vigilance
              </Text>
              {data.pointsVigilance.slice(0, 5).map((point, i) => (
                <View key={i} style={styles.pointItem}>
                  <Text style={styles.pointBullet}>!</Text>
                  <Text style={styles.pointText}>{cleanText(point)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Historique financier */}
        {data.historique.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolution sur 3 ans</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Annee</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>
                  CA
                </Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>
                  Resultat net
                </Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>
                  Tresorerie
                </Text>
              </View>
              {data.historique.map((annee, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCellBold, { flex: 1 }]}>{annee.annee}</Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>
                    {formatCurrency(annee.ca)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>
                    {formatCurrency(annee.resultatNet)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>
                    {formatCurrency(annee.tresorerie)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Ce rapport est fourni a titre indicatif.</Text>
          <Text>EvalUp 2026</Text>
        </View>
        <Text style={styles.pageNumber}>2 / 3</Text>
      </Page>

      {/* PAGE 3 : Méthodologie & Recommandations */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>EvalUp</Text>
          <Text style={styles.date}>{cleanText(data.entreprise.nom)}</Text>
        </View>

        {/* Méthodes d'évaluation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Methodes d&apos;evaluation utilisees</Text>

          {data.methodes.map((methode, i) => (
            <View key={i} style={styles.methodCard}>
              <View style={styles.methodHeader}>
                <Text style={styles.methodName}>{methode.nom}</Text>
                <Text style={styles.methodValue}>{formatCurrency(methode.valeur)}</Text>
              </View>
              <Text style={styles.methodWeight}>Poids : {methode.poids}%</Text>
              <Text style={styles.methodExplanation}>{cleanText(methode.explication)}</Text>
            </View>
          ))}
        </View>

        {/* Recommandations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nos recommandations</Text>
          <View
            style={[
              styles.pointsCard,
              { backgroundColor: COLORS.bgLight, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
            ]}
          >
            {data.recommandations.map((reco, i) => (
              <View key={i} style={[styles.pointItem, { marginBottom: 8 }]}>
                <Text
                  style={[styles.pointBullet, { fontWeight: 'bold', color: COLORS.primary }]}
                >
                  {i + 1}.
                </Text>
                <Text style={styles.pointText}>{cleanText(reco)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Ce rapport est fourni a titre indicatif et ne constitue pas un conseil
            financier. L&apos;evaluation definitive doit etre validee par un expert-comptable
            ou un conseil en cession d&apos;entreprise. Les donnees financieres proviennent
            des sources publiques (Pappers/INPI) et des informations declarees.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Ce rapport est fourni a titre indicatif.</Text>
          <Text>EvalUp 2026</Text>
        </View>
        <Text style={styles.pageNumber}>3 / 3</Text>
      </Page>
    </Document>
  )
}

// ============================================
// FONCTION DE GÉNÉRATION
// ============================================

export async function generateEvaluationPDF(data: EvaluationData): Promise<Blob> {
  return await pdf(<EvaluationReport data={data} />).toBlob()
}

export async function generateEvaluationPDFBuffer(data: EvaluationData): Promise<Buffer> {
  const blob = await generateEvaluationPDF(data)
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
