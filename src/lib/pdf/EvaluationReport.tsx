'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { ConversationContext, Message } from '@/lib/anthropic'
import type { ResultatEvaluation } from '@/lib/evaluation/types'
import { COLORS } from './styles'
import { formatCurrency, formatPercent, cleanText, formatNumber } from './utils'
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

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: COLORS.gray700,
  },
  header: {
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {},
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.gray500,
  },
  date: {
    fontSize: 9,
    color: COLORS.gray500,
    textAlign: 'right',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col2: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: COLORS.gray500,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },
  card: {
    backgroundColor: COLORS.gray50,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gray900,
    marginBottom: 8,
  },
  highlight: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  highlightLabel: {
    fontSize: 10,
    color: COLORS.white,
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  highlightRange: {
    fontSize: 11,
    color: COLORS.white,
  },
  highlightMethod: {
    fontSize: 9,
    color: COLORS.white,
    marginTop: 8,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gray700,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
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
  // Jauges
  gauge: {
    marginBottom: 10,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
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
    height: 6,
    backgroundColor: COLORS.gray200,
    borderRadius: 3,
  },
  gaugeFill: {
    height: 6,
    borderRadius: 3,
  },
  // Status badges
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
  // Points cards
  pointsCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  pointsCardGreen: {
    backgroundColor: COLORS.bgGreen,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  pointsCardOrange: {
    backgroundColor: COLORS.bgOrange,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  pointsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  pointItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  pointBullet: {
    width: 12,
    fontSize: 9,
  },
  pointText: {
    flex: 1,
    fontSize: 9,
    color: COLORS.gray700,
    lineHeight: 1.4,
  },
  // Anomalies
  anomaly: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  anomalyHigh: {
    backgroundColor: COLORS.bgRed,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  anomalyMedium: {
    backgroundColor: COLORS.bgOrange,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  anomalyLow: {
    backgroundColor: COLORS.bgLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryLight,
  },
  anomalyTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 9,
  },
  anomalyText: {
    fontSize: 9,
    color: COLORS.gray700,
    lineHeight: 1.3,
  },
  // Method cards
  methodCard: {
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
    marginBottom: 4,
  },
  methodExplanation: {
    fontSize: 8,
    color: COLORS.gray700,
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.gray500,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: 8,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 25,
    right: 40,
    fontSize: 8,
    color: COLORS.gray500,
  },
  disclaimer: {
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },
  disclaimerText: {
    fontSize: 8,
    color: COLORS.gray500,
    lineHeight: 1.5,
  },
})

interface EvaluationReportProps {
  context: ConversationContext
  messages: Message[]
  evaluation?: {
    valeurBasse: number
    valeurHaute: number
    methode: string
    multiple: number
  }
  evaluationDetaille?: ResultatEvaluation
}

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

// Composant ligne de comparaison
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

  const statusText = status === 'good' ? 'Bon' : status === 'average' ? 'Moyen' : 'A surveiller'

  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, { flex: 2 }]}>{label}</Text>
      <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'center' }]}>{formattedValue}</Text>
      <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{benchmark}</Text>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={statusStyle}>{statusText}</Text>
      </View>
    </View>
  )
}

export function EvaluationReport({
  context,
  messages,
  evaluation,
  evaluationDetaille,
}: EvaluationReportProps) {
  const { entreprise, financials } = context
  const dernierBilan = financials.bilans[0]
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Obtenir les benchmarks du secteur
  const secteurCode = getSectorFromNaf(entreprise.codeNaf)
  const benchmark = BENCHMARKS[secteurCode] || BENCHMARKS.default

  // Extraire points forts et vigilance de l'évaluation détaillée
  const pointsForts = evaluationDetaille?.ajustements
    .filter((a) => a.impact > 0)
    .map((a) => `${a.facteur}: ${a.raison}`) || []

  const pointsVigilance = evaluationDetaille?.ajustements
    .filter((a) => a.impact < 0)
    .map((a) => `${a.facteur}: ${a.raison}`) || []

  return (
    <Document>
      {/* Page 1 - Synthese */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>EvalUp</Text>
            <Text style={styles.title}>{cleanText(entreprise.nom)}</Text>
            <Text style={styles.subtitle}>Rapport d&apos;evaluation - {entreprise.secteur}</Text>
          </View>
          <Text style={styles.date}>Genere le {today}</Text>
        </View>

        {/* Estimation de valeur */}
        {evaluation && (
          <View style={styles.highlight}>
            <Text style={styles.highlightLabel}>Estimation de valeur d&apos;entreprise</Text>
            <Text style={styles.highlightValue}>
              {formatCurrency((evaluation.valeurBasse + evaluation.valeurHaute) / 2)}
            </Text>
            <Text style={styles.highlightRange}>
              Fourchette : {formatCurrency(evaluation.valeurBasse)} - {formatCurrency(evaluation.valeurHaute)}
            </Text>
            <Text style={styles.highlightMethod}>
              Methode : {evaluation.methode} - Multiple : {evaluation.multiple}x EBITDA
            </Text>
          </View>
        )}

        {/* Informations entreprise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de l&apos;entreprise</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <View style={styles.card}>
                <Text style={styles.label}>SIREN</Text>
                <Text style={styles.value}>{entreprise.siren}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.label}>Date de creation</Text>
                <Text style={styles.value}>{entreprise.dateCreation}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.label}>Effectif</Text>
                <Text style={styles.value}>{entreprise.effectif} salaries</Text>
              </View>
            </View>
            <View style={styles.col2}>
              <View style={styles.card}>
                <Text style={styles.label}>Secteur</Text>
                <Text style={styles.value}>{entreprise.secteur}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.label}>Code NAF</Text>
                <Text style={styles.value}>{entreprise.codeNaf}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.label}>Localisation</Text>
                <Text style={styles.value}>{entreprise.ville}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Indicateurs financiers avec jauges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs financiers</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Gauge
                label="Marge nette"
                value={financials.ratios.margeNette}
                maxValue={15}
                color={financials.ratios.margeNette >= benchmark.margeNette.median * 100 ? COLORS.success : COLORS.warning}
                suffix="%"
              />
              <Gauge
                label="Marge EBITDA"
                value={financials.ratios.margeEbitda}
                maxValue={25}
                color={financials.ratios.margeEbitda >= benchmark.margeEbitda.median * 100 ? COLORS.success : COLORS.warning}
                suffix="%"
              />
            </View>
            <View style={styles.col2}>
              <View style={styles.card}>
                <Text style={styles.label}>Chiffre d&apos;affaires</Text>
                <Text style={styles.value}>{formatCurrency(dernierBilan?.chiffre_affaires)}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.label}>EBITDA</Text>
                <Text style={styles.value}>{formatCurrency(financials.ratios.ebitda)}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.label}>Resultat net</Text>
                <Text style={styles.value}>{formatCurrency(dernierBilan?.resultat_net)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Ce rapport est fourni a titre indicatif.</Text>
          <Text>EvalUp 2026</Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Page 2 - Comparaison sectorielle */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>EvalUp</Text>
            <Text style={styles.subtitle}>{cleanText(entreprise.nom)}</Text>
          </View>
        </View>

        {/* Comparaison avec le secteur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparaison avec le secteur {benchmark.nom}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Indicateur</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Votre valeur</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Mediane secteur</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Position</Text>
            </View>
            <ComparisonRow
              label="Marge nette"
              value={financials.ratios.margeNette / 100}
              benchmark={formatPercent(benchmark.margeNette.median)}
              status={compareWithBenchmark(financials.ratios.margeNette / 100, benchmark.margeNette)}
            />
            <ComparisonRow
              label="Marge EBITDA"
              value={financials.ratios.margeEbitda / 100}
              benchmark={formatPercent(benchmark.margeEbitda.median)}
              status={compareWithBenchmark(financials.ratios.margeEbitda / 100, benchmark.margeEbitda)}
            />
            <ComparisonRow
              label="Delai client (DSO)"
              value={financials.ratios.dso}
              benchmark={`${benchmark.dso.median} j`}
              status={compareWithBenchmark(financials.ratios.dso, benchmark.dso, false)}
              format="days"
            />
          </View>
        </View>

        {/* Points forts et vigilance */}
        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={[styles.pointsCard, styles.pointsCardGreen]}>
              <Text style={[styles.pointsTitle, { color: COLORS.success }]}>Points forts</Text>
              {pointsForts.length > 0 ? (
                pointsForts.slice(0, 4).map((point, i) => (
                  <View key={i} style={styles.pointItem}>
                    <Text style={styles.pointBullet}>+</Text>
                    <Text style={styles.pointText}>{cleanText(point)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.pointText}>Analyse en cours...</Text>
              )}
            </View>
          </View>
          <View style={styles.col2}>
            <View style={[styles.pointsCard, styles.pointsCardOrange]}>
              <Text style={[styles.pointsTitle, { color: COLORS.warning }]}>Points de vigilance</Text>
              {pointsVigilance.length > 0 ? (
                pointsVigilance.slice(0, 4).map((point, i) => (
                  <View key={i} style={styles.pointItem}>
                    <Text style={styles.pointBullet}>!</Text>
                    <Text style={styles.pointText}>{cleanText(point)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.pointText}>Aucun point de vigilance majeur</Text>
              )}
            </View>
          </View>
        </View>

        {/* Historique financier */}
        {financials.bilans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolution sur 3 ans</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Annee</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>CA</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Resultat net</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Tresorerie</Text>
              </View>
              {financials.bilans.map((bilan, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCellBold, { flex: 1 }]}>{bilan.annee}</Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>
                    {formatCurrency(bilan.chiffre_affaires)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>
                    {formatCurrency(bilan.resultat_net)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>
                    {formatCurrency(bilan.tresorerie)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Anomalies détectées */}
        {financials.anomaliesDetectees.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points d&apos;attention detectes</Text>
            {financials.anomaliesDetectees.slice(0, 4).map((anomaly, index) => {
              const severityStyle =
                anomaly.severity === 'high'
                  ? styles.anomalyHigh
                  : anomaly.severity === 'medium'
                    ? styles.anomalyMedium
                    : styles.anomalyLow
              return (
                <View key={index} style={[styles.anomaly, severityStyle]}>
                  <Text style={styles.anomalyTitle}>{anomaly.categorie}</Text>
                  <Text style={styles.anomalyText}>{cleanText(anomaly.message)}</Text>
                </View>
              )
            })}
          </View>
        )}

        <View style={styles.footer}>
          <Text>Ce rapport est fourni a titre indicatif.</Text>
          <Text>EvalUp 2026</Text>
        </View>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>

      {/* Page 3 - Methodologie (si evaluation detaillee) */}
      {evaluationDetaille && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.logo}>EvalUp</Text>
              <Text style={styles.subtitle}>{cleanText(entreprise.nom)}</Text>
            </View>
          </View>

          {/* Méthodes d'évaluation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Methodes d&apos;evaluation utilisees</Text>
            <Text style={{ fontSize: 9, color: COLORS.gray500, marginBottom: 12 }}>
              {cleanText(evaluationDetaille.secteur.explicationMethodes || '')}
            </Text>

            {evaluationDetaille.methodes.map((methode, i) => (
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

          {/* Fourchette de valorisation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fourchette de valorisation</Text>
            <View style={styles.row}>
              <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
                <Text style={styles.label}>Basse</Text>
                <Text style={[styles.value, { color: COLORS.gray700 }]}>
                  {formatCurrency(evaluationDetaille.valorisation.basse)}
                </Text>
              </View>
              <View style={[styles.card, { flex: 1, alignItems: 'center', backgroundColor: COLORS.bgGold }]}>
                <Text style={styles.label}>Moyenne</Text>
                <Text style={[styles.value, { color: COLORS.gold, fontSize: 16 }]}>
                  {formatCurrency(evaluationDetaille.valorisation.moyenne)}
                </Text>
              </View>
              <View style={[styles.card, { flex: 1, alignItems: 'center' }]}>
                <Text style={styles.label}>Haute</Text>
                <Text style={[styles.value, { color: COLORS.gray700 }]}>
                  {formatCurrency(evaluationDetaille.valorisation.haute)}
                </Text>
              </View>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Ce rapport est fourni a titre indicatif et ne constitue pas un conseil financier.
              L&apos;evaluation definitive doit etre validee par un expert-comptable ou un conseil en
              cession d&apos;entreprise. Les donnees financieres proviennent des sources publiques
              (Pappers/INPI) et des informations declarees.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text>Ce rapport est fourni a titre indicatif.</Text>
            <Text>EvalUp 2026</Text>
          </View>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
            fixed
          />
        </Page>
      )}
    </Document>
  )
}
