'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { ConversationContext, Message } from '@/lib/anthropic'
import type { ResultatEvaluation } from '@/lib/evaluation/types'

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a2e',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #c9a227',
    paddingBottom: 20,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoBox: {
    width: 30,
    height: 30,
    backgroundColor: '#c9a227',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 16,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  date: {
    fontSize: 9,
    color: '#999',
    marginTop: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1 solid #e0e0e0',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    color: '#666',
  },
  value: {
    width: '60%',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 8,
  },
  highlight: {
    backgroundColor: '#fff8e6',
    padding: 15,
    borderRadius: 8,
    borderLeft: '4 solid #c9a227',
    marginBottom: 15,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 5,
  },
  highlightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c9a227',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    flex: 1,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e0e0e0',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  anomaly: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  anomalyHigh: {
    backgroundColor: '#fee2e2',
    borderLeft: '3 solid #ef4444',
  },
  anomalyMedium: {
    backgroundColor: '#fef3c7',
    borderLeft: '3 solid #f59e0b',
  },
  anomalyLow: {
    backgroundColor: '#dbeafe',
    borderLeft: '3 solid #3b82f6',
  },
  anomalyTitle: {
    fontWeight: 'bold',
    marginBottom: 3,
    fontSize: 9,
  },
  anomalyText: {
    fontSize: 9,
    color: '#444',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999',
    fontSize: 8,
    borderTop: '1 solid #e0e0e0',
    paddingTop: 10,
  },
  conversationSection: {
    marginTop: 10,
  },
  messageUser: {
    backgroundColor: '#e8f4f8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    marginLeft: 30,
  },
  messageAssistant: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    marginRight: 30,
  },
  messageRole: {
    fontSize: 8,
    color: '#666',
    marginBottom: 3,
    fontWeight: 'bold',
  },
  messageContent: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 40,
    fontSize: 8,
    color: '#999',
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

// Fonction pour formater les nombres en euros
function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

// Fonction pour formater les pourcentages
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function EvaluationReport({ context, messages, evaluation, evaluationDetaille }: EvaluationReportProps) {
  const { entreprise, financials } = context
  const dernierBilan = financials.bilans[0]
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document>
      {/* Page 1 - Couverture et résumé */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>E</Text>
            </View>
            <Text style={styles.brandName}>EvalUp</Text>
          </View>
          <Text style={styles.title}>Rapport d&apos;Évaluation</Text>
          <Text style={styles.subtitle}>{entreprise.nom}</Text>
          <Text style={styles.date}>Généré le {today}</Text>
        </View>

        {/* Estimation de valeur */}
        {evaluation && (
          <View style={styles.highlight}>
            <Text style={styles.highlightTitle}>Estimation de valeur</Text>
            <Text style={styles.highlightValue}>
              {formatEuro(evaluation.valeurBasse)} - {formatEuro(evaluation.valeurHaute)}
            </Text>
            <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>
              Méthode : {evaluation.methode} • Multiple : {evaluation.multiple}x EBITDA
            </Text>
          </View>
        )}

        {/* Informations entreprise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de l&apos;entreprise</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>SIREN</Text>
              <Text style={styles.value}>{entreprise.siren}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Secteur d&apos;activité</Text>
              <Text style={styles.value}>{entreprise.secteur}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Code NAF</Text>
              <Text style={styles.value}>{entreprise.codeNaf}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date de création</Text>
              <Text style={styles.value}>{entreprise.dateCreation}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Effectif</Text>
              <Text style={styles.value}>{entreprise.effectif}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Localisation</Text>
              <Text style={styles.value}>{entreprise.ville}</Text>
            </View>
          </View>
        </View>

        {/* Ratios clés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ratios financiers clés</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Marge nette</Text>
              <Text style={styles.value}>{formatPercent(financials.ratios.margeNette)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Marge EBITDA</Text>
              <Text style={styles.value}>{formatPercent(financials.ratios.margeEbitda)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>EBITDA</Text>
              <Text style={styles.value}>{formatEuro(financials.ratios.ebitda)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>DSO (délai client)</Text>
              <Text style={styles.value}>{financials.ratios.dso.toFixed(0)} jours</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Ratio d&apos;endettement</Text>
              <Text style={styles.value}>{financials.ratios.ratioEndettement.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Ce rapport est fourni à titre indicatif. L&apos;évaluation finale doit être confirmée par un expert.
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* Page 2 - Méthodologie d'évaluation (si évaluation détaillée disponible) */}
      {evaluationDetaille && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Méthodologie d&apos;évaluation</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Secteur identifié : {evaluationDetaille.secteur.nom}</Text>
              <Text style={{ fontSize: 9, color: '#666', marginTop: 5, lineHeight: 1.4 }}>
                {evaluationDetaille.secteur.explicationSecteur}
              </Text>
            </View>
          </View>

          {/* Fourchette de valorisation détaillée */}
          <View style={styles.highlight}>
            <Text style={styles.highlightTitle}>Fourchette de valorisation</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 9, color: '#666' }}>Basse</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a5f' }}>
                  {formatEuro(evaluationDetaille.valorisation.basse)}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 9, color: '#666' }}>Moyenne</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#c9a227' }}>
                  {formatEuro(evaluationDetaille.valorisation.moyenne)}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 9, color: '#666' }}>Haute</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a5f' }}>
                  {formatEuro(evaluationDetaille.valorisation.haute)}
                </Text>
              </View>
            </View>
          </View>

          {/* Détail des méthodes utilisées */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Méthodes d&apos;évaluation appliquées</Text>
            <Text style={{ fontSize: 9, color: '#666', marginBottom: 10 }}>
              {evaluationDetaille.secteur.explicationMethodes}
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Méthode</Text>
                <Text style={styles.tableHeaderCell}>Poids</Text>
                <Text style={styles.tableHeaderCell}>Valeur</Text>
              </View>
              {evaluationDetaille.methodes.map((methode, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <View style={{ flex: 2 }}>
                    <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{methode.nom}</Text>
                    <Text style={{ fontSize: 8, color: '#666' }}>{methode.explication}</Text>
                  </View>
                  <Text style={styles.tableCell}>{methode.poids}%</Text>
                  <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{formatEuro(methode.valeur)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ajustements appliqués */}
          {evaluationDetaille.ajustements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ajustements appliqués</Text>
              {evaluationDetaille.ajustements.map((ajustement, index) => {
                const isPositive = ajustement.impact >= 0
                return (
                  <View
                    key={index}
                    style={[
                      styles.anomaly,
                      isPositive ? styles.anomalyLow : styles.anomalyMedium,
                    ]}
                  >
                    <Text style={styles.anomalyTitle}>
                      {isPositive ? '+' : ''}{(ajustement.impact * 100).toFixed(0)}% - {ajustement.facteur}
                    </Text>
                    <Text style={styles.anomalyText}>{ajustement.raison}</Text>
                  </View>
                )
              })}
            </View>
          )}

          <Text style={styles.footer}>
            Ce rapport est fourni à titre indicatif. L&apos;évaluation finale doit être confirmée par un expert.
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
        </Page>
      )}

      {/* Page 3 - Données financières */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique financier</Text>

          {financials.bilans.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Année</Text>
                <Text style={styles.tableHeaderCell}>CA</Text>
                <Text style={styles.tableHeaderCell}>Résultat Net</Text>
                <Text style={styles.tableHeaderCell}>Trésorerie</Text>
                <Text style={styles.tableHeaderCell}>Capitaux Propres</Text>
              </View>
              {financials.bilans.map((bilan, index) => (
                <View key={bilan.annee} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCell}>{bilan.annee}</Text>
                  <Text style={styles.tableCell}>{formatEuro(bilan.chiffre_affaires)}</Text>
                  <Text style={styles.tableCell}>{formatEuro(bilan.resultat_net)}</Text>
                  <Text style={styles.tableCell}>{formatEuro(bilan.tresorerie)}</Text>
                  <Text style={styles.tableCell}>{formatEuro(bilan.capitaux_propres)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#666', fontStyle: 'italic' }}>Aucun bilan disponible</Text>
          )}
        </View>

        {/* Détail du dernier bilan */}
        {dernierBilan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détail du bilan {dernierBilan.annee}</Text>
            <View style={{ flexDirection: 'row', gap: 15 }}>
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.cardTitle}>Compte de résultat</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Chiffre d&apos;affaires</Text>
                  <Text style={styles.value}>{formatEuro(dernierBilan.chiffre_affaires)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Résultat d&apos;exploitation</Text>
                  <Text style={styles.value}>{formatEuro(dernierBilan.resultat_exploitation)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Résultat net</Text>
                  <Text style={styles.value}>{formatEuro(dernierBilan.resultat_net)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Dotations amort.</Text>
                  <Text style={styles.value}>{formatEuro(dernierBilan.dotations_amortissements)}</Text>
                </View>
              </View>
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.cardTitle}>Bilan</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Stocks</Text>
                  <Text style={styles.value}>{formatEuro(dernierBilan.stocks)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Créances clients</Text>
                  <Text style={styles.value}>{formatEuro(dernierBilan.creances_clients)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Trésorerie</Text>
                  <Text style={styles.value}>{formatEuro(dernierBilan.tresorerie)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Dettes financières</Text>
                  <Text style={styles.value}>{formatEuro(dernierBilan.dettes_financieres)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Anomalies détectées */}
        {financials.anomaliesDetectees.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points d&apos;attention détectés</Text>
            {financials.anomaliesDetectees.map((anomaly, index) => {
              const severityStyle = anomaly.severity === 'high'
                ? styles.anomalyHigh
                : anomaly.severity === 'medium'
                  ? styles.anomalyMedium
                  : styles.anomalyLow
              return (
                <View key={index} style={[styles.anomaly, severityStyle]}>
                  <Text style={styles.anomalyTitle}>{anomaly.categorie}</Text>
                  <Text style={styles.anomalyText}>{anomaly.message}</Text>
                </View>
              )
            })}
          </View>
        )}

        <Text style={styles.footer}>
          Ce rapport est fourni à titre indicatif. L&apos;évaluation finale doit être confirmée par un expert.
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      {/* Page 3+ - Conversation */}
      {messages.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détail de l&apos;évaluation</Text>
            <Text style={{ fontSize: 9, color: '#666', marginBottom: 15 }}>
              Résumé des échanges avec l&apos;assistant IA
            </Text>
            <View style={styles.conversationSection}>
              {messages.slice(0, 20).map((message, index) => (
                <View
                  key={index}
                  style={message.role === 'user' ? styles.messageUser : styles.messageAssistant}
                >
                  <Text style={styles.messageRole}>
                    {message.role === 'user' ? 'Vous' : 'EvalUp'}
                  </Text>
                  <Text style={styles.messageContent}>
                    {message.content.slice(0, 500)}
                    {message.content.length > 500 ? '...' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.footer}>
            Ce rapport est fourni à titre indicatif. L&apos;évaluation finale doit être confirmée par un expert.
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
        </Page>
      )}
    </Document>
  )
}
