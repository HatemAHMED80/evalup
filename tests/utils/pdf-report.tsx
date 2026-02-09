// Générateur de rapport PDF pour les tests E2E
import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToFile } from '@react-pdf/renderer'
import * as fs from 'fs'
import * as path from 'path'

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #c9a227',
    paddingBottom: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 5,
  },
  logoAccent: {
    color: '#c9a227',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  date: {
    fontSize: 10,
    color: '#999999',
    marginTop: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 15,
    borderBottom: '1 solid #e0e0e0',
    paddingBottom: 8,
  },
  summaryBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 4,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#666666',
  },
  summaryValue: {
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  summaryValueSuccess: {
    fontWeight: 'bold',
    color: '#28a745',
  },
  companyCard: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fafafa',
    borderLeft: '3 solid #c9a227',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 5,
  },
  companyMeta: {
    fontSize: 9,
    color: '#888888',
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  infoItem: {
    width: '50%',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 9,
    color: '#888888',
  },
  infoValue: {
    fontSize: 10,
    color: '#333333',
  },
  answersSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1 solid #e0e0e0',
  },
  answerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 8,
  },
  answerItem: {
    fontSize: 9,
    color: '#444444',
    marginBottom: 4,
    paddingLeft: 10,
  },
  badge: {
    backgroundColor: '#28a745',
    color: '#ffffff',
    padding: '3 8',
    borderRadius: 3,
    fontSize: 9,
  },
  badgeWarning: {
    backgroundColor: '#ffc107',
    color: '#333333',
  },
  badgeError: {
    backgroundColor: '#dc3545',
    color: '#ffffff',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #e0e0e0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
  },
  pageNumber: {
    fontSize: 8,
    color: '#999999',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#c9a227',
    borderRadius: 4,
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e0e0e0',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 4,
  },
  tableCellSmall: {
    flex: 0.5,
    fontSize: 9,
    paddingHorizontal: 4,
  },
})

// Interface pour les données du rapport
interface FlowResultData {
  company: string
  siren: string
  objectif: string
  questionsAsked: string[]
  answersGiven: string[]
  questionRelevanceScores: number[]
  valuationDisplayed: boolean
  valuationRange?: { min: number; max: number }
  totalDuration: number
  errors: string[]
  warnings: string[]
}

interface RelevanceReportData {
  totalFlows: number
  successfulFlows: number
  averageRelevanceScore: number
  questionCategories: Record<string, number>
  flowResults: FlowResultData[]
  generatedAt: string
}

// Composant PDF
const TestReportPDF: React.FC<{ data: RelevanceReportData }> = ({ data }) => {
  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#28a745'
    if (score >= 60) return '#ffc107'
    return '#dc3545'
  }

  return (
    <Document>
      {/* Page 1: Résumé */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            Eval<Text style={styles.logoAccent}>Up</Text>
          </Text>
          <Text style={styles.subtitle}>Rapport de Tests E2E - Cas Fictifs</Text>
          <Text style={styles.date}>Généré le {formatDate(data.generatedAt)}</Text>
        </View>

        {/* Résumé Global */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé Global</Text>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nombre de flows testés</Text>
              <Text style={styles.summaryValue}>{data.totalFlows}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Flows réussis</Text>
              <Text style={styles.summaryValueSuccess}>
                {data.successfulFlows} / {data.totalFlows}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taux de réussite</Text>
              <Text style={styles.summaryValueSuccess}>
                {((data.successfulFlows / data.totalFlows) * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Score de pertinence moyen</Text>
              <Text style={[styles.summaryValue, { color: getScoreColor(data.averageRelevanceScore) }]}>
                {data.averageRelevanceScore}%
              </Text>
            </View>
          </View>
        </View>

        {/* Tableau récapitulatif */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif par Entreprise</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Entreprise</Text>
              <Text style={styles.tableCellSmall}>Objectif</Text>
              <Text style={styles.tableCellSmall}>Score</Text>
              <Text style={styles.tableCellSmall}>Durée</Text>
              <Text style={styles.tableCellSmall}>Statut</Text>
            </View>
            {data.flowResults.map((result, index) => {
              const avgScore =
                result.questionRelevanceScores.length > 0
                  ? Math.round(
                      result.questionRelevanceScores.reduce((a, b) => a + b, 0) /
                        result.questionRelevanceScores.length
                    )
                  : 0
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{result.company}</Text>
                  <Text style={styles.tableCellSmall}>{result.objectif}</Text>
                  <Text style={[styles.tableCellSmall, { color: getScoreColor(avgScore) }]}>
                    {avgScore}%
                  </Text>
                  <Text style={styles.tableCellSmall}>{formatDuration(result.totalDuration)}</Text>
                  <Text style={[styles.tableCellSmall, { color: result.valuationDisplayed ? '#28a745' : '#dc3545' }]}>
                    {result.valuationDisplayed ? 'OK' : 'FAIL'}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>EvalUp - Tests E2E Automatisés</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* Pages détaillées par entreprise */}
      {data.flowResults.map((result, index) => {
        const avgScore =
          result.questionRelevanceScores.length > 0
            ? Math.round(
                result.questionRelevanceScores.reduce((a, b) => a + b, 0) / result.questionRelevanceScores.length
              )
            : 0

        return (
          <Page key={index} size="A4" style={styles.page}>
            {/* Header simplifié */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.logo, { fontSize: 18 }]}>
                Eval<Text style={styles.logoAccent}>Up</Text>
              </Text>
            </View>

            {/* Carte entreprise */}
            <View style={styles.companyCard}>
              <Text style={styles.companyName}>{result.company}</Text>
              <Text style={styles.companyMeta}>
                SIREN: {result.siren} | Objectif: {result.objectif}
              </Text>

              {/* Grille d'infos */}
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Score de pertinence</Text>
                  <Text style={[styles.infoValue, { color: getScoreColor(avgScore) }]}>{avgScore}%</Text>
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreBarFill, { width: `${avgScore}%`, backgroundColor: getScoreColor(avgScore) }]} />
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Durée du test</Text>
                  <Text style={styles.infoValue}>{formatDuration(result.totalDuration)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Valorisation affichée</Text>
                  <Text style={[styles.infoValue, { color: result.valuationDisplayed ? '#28a745' : '#dc3545' }]}>
                    {result.valuationDisplayed ? 'Oui' : 'Non'}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Erreurs rencontrées</Text>
                  <Text style={[styles.infoValue, { color: result.errors.length > 0 ? '#dc3545' : '#28a745' }]}>
                    {result.errors.length}
                  </Text>
                </View>
              </View>
            </View>

            {/* Réponses données */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Réponses Fournies</Text>
              {result.answersGiven.map((answer, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 9, color: '#888888', marginBottom: 2 }}>Question {i + 1}</Text>
                  <Text style={{ fontSize: 10, color: '#333333', lineHeight: 1.4 }}>{answer}</Text>
                </View>
              ))}
            </View>

            {/* Scores de pertinence */}
            {result.questionRelevanceScores.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Scores de Pertinence par Question</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {result.questionRelevanceScores.map((score, i) => (
                    <View key={i} style={{ width: '25%', marginBottom: 10 }}>
                      <Text style={{ fontSize: 9, color: '#888888' }}>Q{i + 1}</Text>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: getScoreColor(score) }}>{score}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer} fixed>
              <Text style={styles.footerText}>EvalUp - Tests E2E Automatisés</Text>
              <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
            </View>
          </Page>
        )
      })}
    </Document>
  )
}

// Fonction pour générer le PDF
export async function generateTestReportPDF(reportPath: string, outputPath?: string): Promise<string> {
  // Lire le rapport JSON
  const reportData: RelevanceReportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))

  // Chemin de sortie
  const pdfPath = outputPath || reportPath.replace('.json', '.pdf')

  // Générer le PDF
  await renderToFile(<TestReportPDF data={reportData} />, pdfPath)

  console.log(`PDF généré: ${pdfPath}`)
  return pdfPath
}

// Exécution directe
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    // Chercher le dernier rapport de pertinence
    const reportsDir = path.join(process.cwd(), 'tests', 'reports')
    const files = fs.readdirSync(reportsDir).filter(f => f.startsWith('relevance_report_') && f.endsWith('.json'))
    if (files.length === 0) {
      console.error('Aucun rapport de pertinence trouvé. Lancez d\'abord npm run test:full-flow')
      process.exit(1)
    }
    const latestReport = files.sort().pop()!
    const reportPath = path.join(reportsDir, latestReport)

    generateTestReportPDF(reportPath)
      .then(pdfPath => {
        console.log(`Rapport PDF créé: ${pdfPath}`)
      })
      .catch(err => {
        console.error('Erreur:', err)
        process.exit(1)
      })
  } else {
    generateTestReportPDF(args[0], args[1])
      .then(pdfPath => {
        console.log(`Rapport PDF créé: ${pdfPath}`)
      })
      .catch(err => {
        console.error('Erreur:', err)
        process.exit(1)
      })
  }
}
