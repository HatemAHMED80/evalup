// Pages finales du rapport professionnel EvalUp
import React from 'react'
import { Page, Text, View, Document, pdf } from '@react-pdf/renderer'
import { COLORS } from './styles'
import { formatCurrency, formatPercent, cleanText } from './utils'
import { BENCHMARKS, compareWithBenchmark, getSectorFromNaf } from './sector-benchmarks'
import {
  styles,
  Header,
  Footer,
  KPICard,
  NoteCircle,
  CoverPage,
  TableOfContents,
  ExecutiveSummary,
  type ProfessionalReportData
} from './professional-report'
import { CompanyPresentation, MarketAnalysis, FinancialAnalysis } from './professional-report-pages'

// ============================================
// PAGES 16-18: DIAGNOSTIC FINANCIER
// ============================================

const FinancialDiagnostic = ({ data }: { data: ProfessionalReportData }) => {
  const secteurCode = getSectorFromNaf(data.entreprise.codeNaf)
  const benchmark = BENCHMARKS[secteurCode] || BENCHMARKS.default

  return (
    <>
      {/* Page 16: Notation */}
      <Page size="A4" style={styles.page}>
        <Header title="Diagnostic financier" />
        <Text style={styles.sectionTitle}>5. Diagnostic financier</Text>
        <Text style={styles.sectionSubtitle}>5.1 Notation et scoring</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <NoteCircle note={data.diagnostic.noteGlobale} score={data.diagnostic.score} />
          <View style={{ marginLeft: 20, flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 5 }}>
              Note globale: {data.diagnostic.noteGlobale}
            </Text>
            <Text style={styles.paragraph}>
              {data.diagnostic.noteGlobale === 'A' ? 'Excellente sante financiere. L\'entreprise presente des indicateurs tres solides.' :
               data.diagnostic.noteGlobale === 'B' ? 'Bonne sante financiere. L\'entreprise presente des fondamentaux sains avec quelques points d\'amelioration.' :
               data.diagnostic.noteGlobale === 'C' ? 'Sante financiere correcte. Des efforts sont necessaires sur certains indicateurs.' :
               data.diagnostic.noteGlobale === 'D' ? 'Situation financiere fragile. Plusieurs indicateurs sont preoccupants.' :
               'Situation financiere critique. Une restructuration est recommandee.'}
            </Text>
          </View>
        </View>

        {/* Détail par catégorie */}
        <Text style={styles.sectionSubtitle}>Detail par categorie</Text>
        {data.diagnostic.categories.map((cat, i) => (
          <View key={i} style={[styles.card, { marginBottom: 10 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.cardTitle}>{cat.nom}</Text>
              {cat.score !== undefined && (
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: cat.score >= 70 ? COLORS.success : cat.score >= 50 ? COLORS.warning : COLORS.danger }}>
                  {cat.score}/100
                </Text>
              )}
            </View>
            {cat.ratios.map((r, j) => {
              const statusColor = r.evaluation === 'bon' ? COLORS.success : r.evaluation === 'moyen' ? COLORS.warning : COLORS.danger
              return (
                <View key={j} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: j < cat.ratios.length - 1 ? 1 : 0, borderBottomColor: COLORS.gray100 }}>
                  <Text style={{ fontSize: 9, color: COLORS.gray700, flex: 2 }}>{r.nom}</Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', flex: 1, textAlign: 'right' }}>{r.valeurFormatee}</Text>
                  <View style={{ width: 60, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 8, backgroundColor: statusColor + '20', color: statusColor, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      {r.evaluation === 'bon' ? 'Bon' : r.evaluation === 'moyen' ? 'Moyen' : 'A surveiller'}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        ))}

        <Footer company={data.entreprise.nom} pageNum={16} totalPages={30} />
      </Page>

      {/* Page 17-18: Comparaison sectorielle */}
      <Page size="A4" style={styles.page}>
        <Header title="Diagnostic financier" />
        <Text style={styles.sectionSubtitle}>5.2 Comparaison sectorielle - {benchmark.nom}</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Indicateur</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Votre valeur</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Mediane</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Ecart</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Position</Text>
          </View>
          {[
            { label: 'Marge nette', value: data.financier.margeNette, bench: benchmark.margeNette, format: formatPercent },
            { label: 'Marge EBITDA', value: data.financier.margeEbitda, bench: benchmark.margeEbitda, format: formatPercent },
            { label: 'DSO (jours)', value: data.financier.dso, bench: benchmark.dso, format: (v: number) => `${Math.round(v)} j`, lowerBetter: true },
            { label: 'Croissance CA', value: data.financier.caEvolution || 0, bench: benchmark.croissanceCA, format: formatPercent },
          ].map((item, i) => {
            const status = compareWithBenchmark(item.value, item.bench, !item.lowerBetter)
            const statusColor = status === 'good' ? COLORS.success : status === 'average' ? COLORS.warning : COLORS.danger
            const ecart = ((item.value - item.bench.median) / item.bench.median * 100).toFixed(0)
            return (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { flex: 2 }]}>{item.label}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>{item.format(item.value)}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.format(item.bench.median)}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: Number(ecart) >= 0 ? COLORS.success : COLORS.danger }]}>
                  {Number(ecart) >= 0 ? '+' : ''}{ecart}%
                </Text>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 8, backgroundColor: statusColor + '20', color: statusColor, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
                    {status === 'good' ? 'Superieur' : status === 'average' ? 'Dans la moyenne' : 'Inferieur'}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        <Text style={styles.sectionSubtitle}>Multiples de valorisation du secteur</Text>
        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Multiple EBITDA</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' }}>
                {benchmark.multipleEbitda.min}x - {benchmark.multipleEbitda.max}x
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.gray500, textAlign: 'center', marginTop: 4 }}>
                Fourchette observee sur les transactions
              </Text>
            </View>
          </View>
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Multiple CA</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' }}>
                {benchmark.multipleCA.min}x - {benchmark.multipleCA.max}x
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.gray500, textAlign: 'center', marginTop: 4 }}>
                Fourchette observee sur les transactions
              </Text>
            </View>
          </View>
        </View>

        <Footer company={data.entreprise.nom} pageNum={17} totalPages={30} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header title="Diagnostic financier" />

        <Text style={styles.sectionSubtitle}>Synthese du diagnostic</Text>
        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={[styles.card, styles.cardSuccess]}>
              <Text style={styles.cardTitle}>Indicateurs favorables</Text>
              {data.diagnostic.categories.flatMap(c => c.ratios.filter(r => r.evaluation === 'bon')).slice(0, 5).map((r, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={[styles.bullet, { color: COLORS.success }]}>+</Text>
                  <Text style={styles.bulletText}>{r.nom}: {r.valeurFormatee}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.col2}>
            <View style={[styles.card, styles.cardDanger]}>
              <Text style={styles.cardTitle}>Points d'attention</Text>
              {data.diagnostic.categories.flatMap(c => c.ratios.filter(r => r.evaluation === 'mauvais')).slice(0, 5).map((r, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={[styles.bullet, { color: COLORS.danger }]}>!</Text>
                  <Text style={styles.bulletText}>{r.nom}: {r.valeurFormatee}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Footer company={data.entreprise.nom} pageNum={18} totalPages={30} />
      </Page>
    </>
  )
}

// ============================================
// PAGES 19-21: RETRAITEMENTS EBITDA
// ============================================

const EBITDARestatements = ({ data }: { data: ProfessionalReportData }) => (
  <>
    <Page size="A4" style={styles.page}>
      <Header title="Retraitements de l'EBITDA" />
      <Text style={styles.sectionTitle}>6. Retraitements de l'EBITDA</Text>

      <View style={[styles.card, styles.cardPrimary]}>
        <Text style={styles.cardTitle}>Pourquoi normaliser l'EBITDA ?</Text>
        <Text style={styles.paragraph}>
          L'EBITDA normalise (ou retraite) represente la rentabilite economique reelle de l'entreprise,
          corrigee des elements exceptionnels ou non representatifs de l'exploitation normale.
          Cette normalisation est essentielle pour une valorisation pertinente.
        </Text>
      </View>

      <Text style={styles.sectionSubtitle}>Du EBITDA comptable a l'EBITDA normalise</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Element</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Montant</Text>
        </View>
        <View style={[styles.tableRow, { backgroundColor: COLORS.gray50 }]}>
          <Text style={[styles.tableCellBold, { flex: 3 }]}>EBITDA comptable</Text>
          <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right' }]}>{formatCurrency(data.ebitdaNormalise.ebitdaComptable)}</Text>
        </View>
        {data.ebitdaNormalise.retraitements.map((r, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCell, { flex: 3 }]}>
              {r.montant >= 0 ? '+' : ''} {cleanText(r.libelle)}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', color: r.montant >= 0 ? COLORS.success : COLORS.danger }]}>
              {r.montant >= 0 ? '+' : ''}{formatCurrency(r.montant)}
            </Text>
          </View>
        ))}
        <View style={[styles.tableRow, { backgroundColor: COLORS.primary }]}>
          <Text style={[styles.tableCellBold, { flex: 3, color: COLORS.white }]}>EBITDA normalise</Text>
          <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right', color: COLORS.white }]}>{formatCurrency(data.ebitdaNormalise.ebitdaNormalise)}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col2}>
          <KPICard label="Retraitements totaux" value={formatCurrency(data.ebitdaNormalise.totalRetraitements)} />
        </View>
        <View style={styles.col2}>
          <KPICard label="Impact sur EBITDA" value={`${data.ebitdaNormalise.totalRetraitements >= 0 ? '+' : ''}${((data.ebitdaNormalise.totalRetraitements / data.ebitdaNormalise.ebitdaComptable) * 100).toFixed(1)}%`} />
        </View>
      </View>

      <Footer company={data.entreprise.nom} pageNum={19} totalPages={30} />
    </Page>

    <Page size="A4" style={styles.page}>
      <Header title="Retraitements de l'EBITDA" />
      <Text style={styles.sectionSubtitle}>Detail des retraitements</Text>

      {data.ebitdaNormalise.retraitements.map((r, i) => (
        <View key={i} style={[styles.card, { marginBottom: 10 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text style={styles.cardTitle}>{cleanText(r.libelle)}</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: r.montant >= 0 ? COLORS.success : COLORS.danger }}>
              {r.montant >= 0 ? '+' : ''}{formatCurrency(r.montant)}
            </Text>
          </View>
          {r.explication && (
            <Text style={{ fontSize: 9, color: COLORS.gray500 }}>{cleanText(r.explication)}</Text>
          )}
        </View>
      ))}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Types de retraitements courants</Text>
        <Text style={styles.disclaimerText}>
          - Remuneration du dirigeant: ajustement a la valeur de marche{'\n'}
          - Credit-bail: reintegration des loyers{'\n'}
          - Charges/produits exceptionnels: exclusion des elements non recurrents{'\n'}
          - Loyers immobiliers: normalisation si sous/sur evalues
        </Text>
      </View>

      <Footer company={data.entreprise.nom} pageNum={20} totalPages={30} />
    </Page>

    <Page size="A4" style={styles.page}>
      <Header title="Retraitements de l'EBITDA" />

      <Text style={styles.sectionSubtitle}>Impact sur la valorisation</Text>
      <View style={styles.row}>
        <View style={styles.col2}>
          <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: COLORS.gray300 }]}>
            <Text style={styles.cardTitle}>Avant retraitements</Text>
            <Text style={{ fontSize: 9, color: COLORS.gray500, marginBottom: 5 }}>EBITDA comptable</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.gray700 }}>{formatCurrency(data.ebitdaNormalise.ebitdaComptable)}</Text>
          </View>
        </View>
        <View style={styles.col2}>
          <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: COLORS.primary }]}>
            <Text style={styles.cardTitle}>Apres retraitements</Text>
            <Text style={{ fontSize: 9, color: COLORS.gray500, marginBottom: 5 }}>EBITDA normalise</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.primary }}>{formatCurrency(data.ebitdaNormalise.ebitdaNormalise)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.paragraph}>
        L'EBITDA normalise de {formatCurrency(data.ebitdaNormalise.ebitdaNormalise)} sera utilise comme base
        pour l'application des multiples sectoriels dans le cadre de la valorisation.
      </Text>

      <Footer company={data.entreprise.nom} pageNum={21} totalPages={30} />
    </Page>
  </>
)

// ============================================
// PAGES 22-25: VALORISATION
// ============================================

const ValuationSection = ({ data }: { data: ProfessionalReportData }) => {
  const secteurCode = getSectorFromNaf(data.entreprise.codeNaf)
  const benchmark = BENCHMARKS[secteurCode] || BENCHMARKS.default

  return (
    <>
      <Page size="A4" style={styles.page}>
        <Header title="Valorisation" />
        <Text style={styles.sectionTitle}>7. Valorisation</Text>
        <Text style={styles.sectionSubtitle}>7.1 Methodes utilisees</Text>

        {data.methodes.map((m, i) => (
          <View key={i} style={[styles.card, { marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.cardTitle}>{m.nom}</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.primary }}>{formatCurrency(m.valeur)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 9, color: COLORS.gray500 }}>Poids: </Text>
                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{m.poids}%</Text>
              </View>
              {m.multiple && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, color: COLORS.gray500 }}>Multiple: </Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{m.multiple}x</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 9, color: COLORS.gray700, lineHeight: 1.4 }}>{cleanText(m.explication)}</Text>
          </View>
        ))}

        <Footer company={data.entreprise.nom} pageNum={22} totalPages={30} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header title="Valorisation" />

        <Text style={styles.sectionSubtitle}>Synthese des valorisations</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Methode</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Poids</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Valeur</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Contribution</Text>
          </View>
          {data.methodes.map((m, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>{m.nom}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{m.poids}%</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(m.valeur)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(m.valeur * m.poids / 100)}</Text>
            </View>
          ))}
          <View style={[styles.tableRow, { backgroundColor: COLORS.primary }]}>
            <Text style={[styles.tableCellBold, { flex: 2, color: COLORS.white }]}>Valeur d'Entreprise moyenne</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: COLORS.white }]}>100%</Text>
            <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right', color: COLORS.white }]}>{formatCurrency(data.valeurEntreprise.moyenne)}</Text>
            <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right', color: COLORS.white }]}>{formatCurrency(data.valeurEntreprise.moyenne)}</Text>
          </View>
        </View>

        <Text style={styles.sectionSubtitle}>Fourchette de valorisation</Text>
        <View style={styles.row}>
          <View style={styles.col3}>
            <View style={[styles.card, { alignItems: 'center' }]}>
              <Text style={{ fontSize: 9, color: COLORS.gray500, marginBottom: 5 }}>Hypothese basse</Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.gray700 }}>{formatCurrency(data.valeurEntreprise.basse)}</Text>
            </View>
          </View>
          <View style={styles.col3}>
            <View style={[styles.card, { alignItems: 'center', backgroundColor: COLORS.primary }]}>
              <Text style={{ fontSize: 9, color: COLORS.white, opacity: 0.9, marginBottom: 5 }}>Valeur centrale</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.white }}>{formatCurrency(data.valeurEntreprise.moyenne)}</Text>
            </View>
          </View>
          <View style={styles.col3}>
            <View style={[styles.card, { alignItems: 'center' }]}>
              <Text style={{ fontSize: 9, color: COLORS.gray500, marginBottom: 5 }}>Hypothese haute</Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.gray700 }}>{formatCurrency(data.valeurEntreprise.haute)}</Text>
            </View>
          </View>
        </View>

        <Footer company={data.entreprise.nom} pageNum={23} totalPages={30} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header title="Valorisation" />
        <Text style={styles.sectionSubtitle}>7.2 Bridge Valeur d'Entreprise vers Prix de Cession</Text>

        <View style={styles.bridgeCard}>
          <Text style={styles.bridgeTitle}>Calcul du Prix de Cession</Text>
          <View style={styles.bridgeRow}>
            <Text style={styles.bridgeLabel}>Valeur d'Entreprise (VE)</Text>
            <Text style={styles.bridgeValue}>{formatCurrency(data.valeurEntreprise.moyenne)}</Text>
          </View>
          <View style={styles.bridgeRow}>
            <Text style={styles.bridgeLabel}>- Dettes financieres</Text>
            <Text style={[styles.bridgeValue, { color: COLORS.danger }]}>-{formatCurrency(data.detteNette.totalDettes)}</Text>
          </View>
          <View style={styles.bridgeRow}>
            <Text style={styles.bridgeLabel}>+ Tresorerie disponible</Text>
            <Text style={[styles.bridgeValue, { color: COLORS.success }]}>+{formatCurrency(data.detteNette.totalTresorerie)}</Text>
          </View>
          <View style={styles.bridgeRow}>
            <Text style={styles.bridgeLabel}>= Dette financiere nette</Text>
            <Text style={[styles.bridgeValue, { color: data.detteNette.detteFinanciereNette >= 0 ? COLORS.danger : COLORS.success }]}>
              {data.detteNette.detteFinanciereNette >= 0 ? '-' : '+'}{formatCurrency(Math.abs(data.detteNette.detteFinanciereNette))}
            </Text>
          </View>
          <View style={styles.bridgeFinal}>
            <Text style={styles.bridgeFinalLabel}>= Prix de Cession</Text>
            <Text style={styles.bridgeFinalValue}>{formatCurrency(data.prixCession.moyenne)}</Text>
          </View>
        </View>

        <Text style={styles.sectionSubtitle}>Fourchette du prix de cession</Text>
        <View style={styles.row}>
          <View style={styles.col3}>
            <KPICard label="Prix bas" value={formatCurrency(data.prixCession.basse)} />
          </View>
          <View style={styles.col3}>
            <View style={[styles.kpiCard, { backgroundColor: COLORS.gold + '20' }]}>
              <Text style={styles.kpiLabel}>Prix central</Text>
              <Text style={[styles.kpiValue, { color: COLORS.gold }]}>{formatCurrency(data.prixCession.moyenne)}</Text>
            </View>
          </View>
          <View style={styles.col3}>
            <KPICard label="Prix haut" value={formatCurrency(data.prixCession.haute)} />
          </View>
        </View>

        <Footer company={data.entreprise.nom} pageNum={24} totalPages={30} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header title="Valorisation" />

        <Text style={styles.sectionSubtitle}>Facteurs d'ajustement</Text>
        <View style={styles.card}>
          <Text style={styles.paragraph}>
            La valorisation finale pourra etre ajustee en fonction de plusieurs facteurs:
          </Text>
          {[
            'Qualite et perennite de la clientele',
            'Dependance au dirigeant actuel',
            'Qualite des actifs immobilises',
            'Conditions de la negociation (earn-out, garantie d\'actif/passif)',
            'Contexte du marche M&A au moment de la transaction',
          ].map((f, i) => (
            <View key={i} style={styles.bulletPoint}>
              <Text style={styles.bullet}>-</Text>
              <Text style={styles.bulletText}>{f}</Text>
            </View>
          ))}
        </View>

        <Footer company={data.entreprise.nom} pageNum={25} totalPages={30} />
      </Page>
    </>
  )
}

// ============================================
// PAGES 26-27: SWOT
// ============================================

const SWOTSection = ({ data }: { data: ProfessionalReportData }) => (
  <>
    <Page size="A4" style={styles.page}>
      <Header title="Analyse SWOT" />
      <Text style={styles.sectionTitle}>8. Analyse SWOT</Text>

      <View style={styles.swotGrid}>
        <View style={[styles.swotBox, { backgroundColor: COLORS.bgGreen }]}>
          <Text style={[styles.swotTitle, { color: COLORS.success }]}>Forces (Strengths)</Text>
          {(data.swot?.forces || data.pointsForts).slice(0, 5).map((item, i) => (
            <Text key={i} style={styles.swotItem}>• {cleanText(item)}</Text>
          ))}
        </View>
        <View style={[styles.swotBox, { backgroundColor: COLORS.bgOrange }]}>
          <Text style={[styles.swotTitle, { color: COLORS.warning }]}>Faiblesses (Weaknesses)</Text>
          {(data.swot?.faiblesses || data.pointsVigilance).slice(0, 5).map((item, i) => (
            <Text key={i} style={styles.swotItem}>• {cleanText(item)}</Text>
          ))}
        </View>
        <View style={[styles.swotBox, { backgroundColor: COLORS.bgLight }]}>
          <Text style={[styles.swotTitle, { color: COLORS.primary }]}>Opportunites</Text>
          {data.swot?.opportunites && data.swot.opportunites.length > 0 ? (
            data.swot.opportunites.slice(0, 5).map((item, i) => (
              <Text key={i} style={styles.swotItem}>• {cleanText(item)}</Text>
            ))
          ) : (
            <Text style={styles.swotItem}>A completer lors de l'analyse approfondie</Text>
          )}
        </View>
        <View style={[styles.swotBox, { backgroundColor: COLORS.bgRed }]}>
          <Text style={[styles.swotTitle, { color: COLORS.danger }]}>Menaces</Text>
          {data.swot?.menaces && data.swot.menaces.length > 0 ? (
            data.swot.menaces.slice(0, 5).map((item, i) => (
              <Text key={i} style={styles.swotItem}>• {cleanText(item)}</Text>
            ))
          ) : (
            <Text style={styles.swotItem}>A completer lors de l'analyse approfondie</Text>
          )}
        </View>
      </View>

      <Footer company={data.entreprise.nom} pageNum={26} totalPages={30} />
    </Page>

    <Page size="A4" style={styles.page}>
      <Header title="Facteurs de risque" />
      <Text style={styles.sectionSubtitle}>Analyse des risques</Text>

      {data.risques && data.risques.length > 0 ? data.risques.map((r, i) => {
        const color = r.niveau === 'eleve' ? COLORS.danger : r.niveau === 'moyen' ? COLORS.warning : COLORS.success
        return (
          <View key={i} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: color, marginBottom: 10 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={styles.cardTitle}>{r.titre}</Text>
              <Text style={{ fontSize: 8, backgroundColor: color + '20', color: color, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                Risque {r.niveau}
              </Text>
            </View>
            <Text style={{ fontSize: 9, color: COLORS.gray700 }}>{r.description}</Text>
          </View>
        )
      }) : (
        <View style={styles.card}>
          <Text style={styles.paragraph}>Analyse des risques a completer lors de l'etude approfondie.</Text>
        </View>
      )}

      <Footer company={data.entreprise.nom} pageNum={27} totalPages={30} />
    </Page>
  </>
)

// ============================================
// PAGES 28-29: RECOMMANDATIONS
// ============================================

const RecommendationsSection = ({ data }: { data: ProfessionalReportData }) => (
  <>
    <Page size="A4" style={styles.page}>
      <Header title="Recommandations" />
      <Text style={styles.sectionTitle}>9. Recommandations</Text>

      {data.recommandations.map((reco, i) => (
        <View key={i} style={[styles.card, styles.cardPrimary, { marginBottom: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.white }}>{i + 1}</Text>
            </View>
            <Text style={[styles.paragraph, { flex: 1, marginBottom: 0 }]}>{cleanText(reco)}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionSubtitle}>Actions prioritaires</Text>
      <View style={styles.card}>
        {[
          'Preparer un dossier de presentation structure pour les acquereurs potentiels',
          'Securiser les relations clients cles par des contrats long terme',
          'Documenter les processus operationnels pour faciliter la transition',
          'Anticiper les questions des acquereurs sur les garanties d\'actif-passif',
        ].map((action, i) => (
          <View key={i} style={styles.bulletPoint}>
            <Text style={styles.bullet}>→</Text>
            <Text style={styles.bulletText}>{action}</Text>
          </View>
        ))}
      </View>

      <Footer company={data.entreprise.nom} pageNum={28} totalPages={30} />
    </Page>

    <Page size="A4" style={styles.page}>
      <Header title="Recommandations" />

      <Text style={styles.sectionSubtitle}>Prochaines etapes</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Action</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Priorite</Text>
        </View>
        {[
          { action: 'Validation des retraitements avec l\'expert-comptable', priorite: 'Haute' },
          { action: 'Constitution du dataroom', priorite: 'Haute' },
          { action: 'Identification des cibles acquereurs', priorite: 'Moyenne' },
          { action: 'Preparation des documents juridiques', priorite: 'Moyenne' },
        ].map((item, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableCellBold, { flex: 0.5 }]}>{i + 1}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.action}</Text>
            <Text style={[styles.tableCell, { flex: 1, color: item.priorite === 'Haute' ? COLORS.danger : COLORS.warning }]}>{item.priorite}</Text>
          </View>
        ))}
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Accompagnement EvalUp</Text>
        <Text style={styles.disclaimerText}>
          Notre equipe reste a votre disposition pour vous accompagner dans les prochaines etapes
          de votre projet de cession. N'hesitez pas a nous contacter pour approfondir cette analyse
          ou preparer la mise en marche de votre entreprise.
        </Text>
      </View>

      <Footer company={data.entreprise.nom} pageNum={29} totalPages={30} />
    </Page>
  </>
)

// ============================================
// PAGE 30+: ANNEXES
// ============================================

const Appendices = ({ data }: { data: ProfessionalReportData }) => (
  <>
    <Page size="A4" style={styles.page}>
      <Header title="Annexes" />
      <Text style={styles.sectionTitle}>10. Annexes</Text>

      <Text style={styles.sectionSubtitle}>A. Donnees financieres detaillees</Text>
      {data.historique.length > 0 && (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Annee</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>CA</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>EBITDA</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Resultat Net</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Tresorerie</Text>
          </View>
          {data.historique.map((h, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCellBold, { flex: 1 }]}>{h.annee}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(h.ca)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(h.ebitda || 0)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(h.resultatNet)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{formatCurrency(h.tresorerie)}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionSubtitle}>B. Glossaire</Text>
      {[
        { term: 'EBITDA', def: 'Earnings Before Interest, Taxes, Depreciation and Amortization. Resultat d\'exploitation avant interets, impots et amortissements.' },
        { term: 'VE (Valeur d\'Entreprise)', def: 'Enterprise Value. Valeur de l\'entreprise calculee par les methodes de valorisation, avant ajustement de la dette nette.' },
        { term: 'Dette nette', def: 'Difference entre les dettes financieres et la tresorerie disponible.' },
        { term: 'Multiple EBITDA', def: 'Coefficient applique a l\'EBITDA pour obtenir la valeur d\'entreprise. Varie selon le secteur et la taille.' },
        { term: 'BFR', def: 'Besoin en Fonds de Roulement. Financement necessaire pour couvrir le decalage entre encaissements et decaissements.' },
        { term: 'DSO', def: 'Days Sales Outstanding. Delai moyen de paiement des clients en jours.' },
        { term: 'ROE', def: 'Return on Equity. Rentabilite des capitaux propres (Resultat Net / Capitaux Propres).' },
      ].map((item, i) => (
        <View key={i}>
          <Text style={styles.glossaryTerm}>{item.term}</Text>
          <Text style={styles.glossaryDef}>{item.def}</Text>
        </View>
      ))}

      <Footer company={data.entreprise.nom} pageNum={30} totalPages={30} />
    </Page>
  </>
)

// ============================================
// DOCUMENT COMPLET
// ============================================

const ProfessionalReport = ({ data }: { data: ProfessionalReportData }) => (
  <Document>
    <CoverPage data={data} />
    <TableOfContents data={data} />
    <ExecutiveSummary data={data} />
    <CompanyPresentation data={data} />
    <MarketAnalysis data={data} />
    <FinancialAnalysis data={data} />
    <FinancialDiagnostic data={data} />
    <EBITDARestatements data={data} />
    <ValuationSection data={data} />
    <SWOTSection data={data} />
    <RecommendationsSection data={data} />
    <Appendices data={data} />
  </Document>
)

// ============================================
// FONCTIONS DE GÉNÉRATION
// ============================================

export async function generateProfessionalPDF(data: ProfessionalReportData): Promise<Blob> {
  return await pdf(<ProfessionalReport data={data} />).toBlob()
}

export async function generateProfessionalPDFBuffer(data: ProfessionalReportData): Promise<Buffer> {
  const blob = await generateProfessionalPDF(data)
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export { ProfessionalReport }
