/* eslint-disable react/no-unescaped-entities */
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
import { CompanyPresentation, MarketAnalysis, FinancialAnalysis, RatioDashboard } from './professional-report-pages'

// ============================================
// PAGE: PROFIL D'ENTREPRISE (ARCHÉTYPE)
// ============================================

const ArchetypeProfilePage = ({ data }: { data: ProfessionalReportData }) => {
  if (!data.archetypeId) return null

  const name = data.archetypeName || data.archetypeId
  const color = data.archetypeColor || COLORS.primary
  const primaryMethod = data.archetypePrimaryMethod || 'Multiple d\'EBITDA'
  const secondaryMethod = data.archetypeSecondaryMethod
  const whyThisMethod = data.archetypeWhyThisMethod
  const mistakes = data.archetypeCommonMistakes || []
  const keyFactors = data.archetypeKeyFactors || []

  return (
    <Page size="A4" style={styles.page}>
      <Header title="Votre profil d'entreprise" />

      {/* Archetype identity */}
      <View style={[styles.card, { backgroundColor: color + '15', borderLeftWidth: 5, borderLeftColor: color, padding: 20, marginBottom: 20 }]}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: color, marginBottom: 6 }}>
          {cleanText(name)}
        </Text>
        <Text style={{ fontSize: 11, color: COLORS.gray700, lineHeight: 1.5 }}>
          Methode de valorisation principale : {cleanText(primaryMethod)}
          {secondaryMethod ? `\nMethode secondaire : ${cleanText(secondaryMethod)}` : ''}
        </Text>
      </View>

      {/* Why this method */}
      {whyThisMethod && (
        <View style={[styles.card, styles.cardPrimary, { marginBottom: 15 }]}>
          <Text style={styles.cardTitle}>Pourquoi cette methode ?</Text>
          <Text style={styles.paragraph}>{cleanText(whyThisMethod)}</Text>
        </View>
      )}

      {/* Common mistakes */}
      {mistakes.length > 0 && (
        <>
          <Text style={styles.sectionSubtitle}>3 erreurs frequentes a eviter</Text>
          {mistakes.slice(0, 3).map((m, i) => (
            <View key={i} style={[styles.card, styles.cardDanger, { marginBottom: 8 }]}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.danger, marginBottom: 4 }}>
                {cleanText(m.mistake)}
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.gray700 }}>
                Impact : {cleanText(m.impact)}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* Key factors */}
      {keyFactors.length > 0 && (
        <>
          <Text style={styles.sectionSubtitle}>Facteurs cles de valorisation</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <View style={[styles.card, styles.cardSuccess]}>
                <Text style={styles.cardTitle}>Facteurs de prime</Text>
                {keyFactors.filter(f => f.direction === 'up').slice(0, 4).map((f, i) => (
                  <View key={i} style={styles.bulletPoint}>
                    <Text style={[styles.bullet, { color: COLORS.success }]}>+</Text>
                    <Text style={styles.bulletText}>{cleanText(f.factor)}: {cleanText(f.impact)}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.col2}>
              <View style={[styles.card, styles.cardWarning]}>
                <Text style={styles.cardTitle}>Facteurs de decote</Text>
                {keyFactors.filter(f => f.direction === 'down').slice(0, 4).map((f, i) => (
                  <View key={i} style={styles.bulletPoint}>
                    <Text style={[styles.bullet, { color: COLORS.warning }]}>-</Text>
                    <Text style={styles.bulletText}>{cleanText(f.factor)}: {cleanText(f.impact)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </>
      )}

      <Footer company={data.entreprise.nom} pageNum={3} totalPages={34} />
    </Page>
  )
}

// ============================================
// BENCHMARKS DAMODARAN
// ============================================

const DamodaranBenchmarks = ({ data }: { data: ProfessionalReportData }) => {
  if (!data.damodaranMultiples) return null

  const dm = data.damodaranMultiples

  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={styles.sectionSubtitle}>Benchmarks Damodaran (NYU Stern)</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Multiple</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Bas</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Mediane</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Haut</Text>
        </View>
        <View style={[styles.tableRow, styles.tableRowAlt]}>
          <Text style={[styles.tableCellBold, { flex: 2 }]}>Multiple de {dm.primaryMultiple.metric}</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{dm.primaryMultiple.low}x</Text>
          <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'center', color: COLORS.primary }]}>{dm.primaryMultiple.median}x</Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{dm.primaryMultiple.high}x</Text>
        </View>
        {dm.secondaryMultiple.median > 0 && (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellBold, { flex: 2 }]}>Multiple de {dm.secondaryMultiple.metric}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{dm.secondaryMultiple.low}x</Text>
            <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'center', color: COLORS.primary }]}>{dm.secondaryMultiple.median}x</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{dm.secondaryMultiple.high}x</Text>
          </View>
        )}
      </View>

      <View style={[styles.disclaimer, { marginTop: 8, padding: 10 }]}>
        <Text style={{ fontSize: 8, color: COLORS.gray500, lineHeight: 1.4 }}>
          Secteur Damodaran : {dm.damodaranSector}{'\n'}
          Source : {dm.source}{'\n'}
          Donnees : Damodaran, NYU Stern, janvier 2026. Multiples US ajustes France (-20 a -30%).
        </Text>
      </View>
    </View>
  )
}

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

        <Footer company={data.entreprise.nom} pageNum={17} totalPages={32} />
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

        <Footer company={data.entreprise.nom} pageNum={18} totalPages={32} />
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

        <Footer company={data.entreprise.nom} pageNum={19} totalPages={32} />
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

      <Footer company={data.entreprise.nom} pageNum={20} totalPages={32} />
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

      <Footer company={data.entreprise.nom} pageNum={21} totalPages={32} />
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

      <Footer company={data.entreprise.nom} pageNum={22} totalPages={32} />
    </Page>
  </>
)

// ============================================
// HELPERS
// ============================================

function genererJustificationDefaut(nomMethode: string, poids: number): string {
  const nom = nomMethode.toLowerCase()
  if (nom.includes('ebitda') && poids >= 40)
    return 'Méthode de référence pour les PME avec un EBITDA positif. Poids élevé car c\'est la méthode la plus utilisée dans les transactions M&A de ce type.'
  if (nom.includes('ebitda'))
    return 'Méthode basée sur la rentabilité opérationnelle. Poids ajusté pour refléter la fiabilité de l\'EBITDA comme indicateur de performance.'
  if (nom.includes('ca') || nom.includes('chiffre'))
    return 'Méthode complémentaire utile pour valider la cohérence. Poids modéré car ne tient pas compte de la rentabilité.'
  if (nom.includes('patrimoine') || nom.includes('actif') || nom.includes('anc'))
    return 'Méthode patrimoniale servant de plancher de valorisation. Poids ajusté selon l\'intensité capitalistique du secteur.'
  if (nom.includes('dcf') || nom.includes('flux'))
    return 'Methode intrinsèque basee sur les flux futurs actualises. Poids ajusté selon la qualité des projections disponibles.'
  if (nom.includes('praticien'))
    return 'Méthode mixte combinant approche patrimoniale et rendement. Offre un équilibre entre valeur d\'actif et rentabilité.'
  if (nom.includes('goodwill'))
    return 'Méthode évaluant le surprofit généré au-delà de la rentabilité normale des actifs.'
  if (nom.includes('flotte') || nom.includes('materiel'))
    return 'Méthode sectorielle basée sur la valeur des actifs d\'exploitation spécifiques au secteur.'
  return `Poids de ${poids}% attribué en fonction de la pertinence de cette méthode pour le profil de l'entreprise et son secteur d'activité.`
}

// ============================================
// PAGES 22-25: VALORISATION
// ============================================

const ValuationSection = ({ data }: { data: ProfessionalReportData }) => {
  const secteurCode = getSectorFromNaf(data.entreprise.codeNaf)
  const _benchmark = BENCHMARKS[secteurCode] || BENCHMARKS.default

  return (
    <>
      <Page size="A4" style={styles.page}>
        <Header title="Valorisation" />
        <Text style={styles.sectionTitle}>7. Valorisation{data.archetypeName ? ` — ${cleanText(data.archetypeName)}` : ''}</Text>
        <Text style={styles.sectionSubtitle}>7.1 Methodes utilisees{data.archetypePrimaryMethod ? ` (${cleanText(data.archetypePrimaryMethod)})` : ''}</Text>

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
            <View style={{ backgroundColor: COLORS.bgLight, borderRadius: 4, padding: 8, marginBottom: 6 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: COLORS.primary, marginBottom: 2 }}>
                Justification du poids ({m.poids}%)
              </Text>
              <Text style={{ fontSize: 8, color: COLORS.gray700, lineHeight: 1.4 }}>
                {m.justificationPoids || genererJustificationDefaut(m.nom, m.poids)}
              </Text>
            </View>
            <Text style={{ fontSize: 9, color: COLORS.gray700, lineHeight: 1.4 }}>{cleanText(m.explication)}</Text>
          </View>
        ))}

        <Footer company={data.entreprise.nom} pageNum={23} totalPages={32} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header title="Valorisation" />

        <DamodaranBenchmarks data={data} />

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

        <Footer company={data.entreprise.nom} pageNum={24} totalPages={32} />
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

        <Footer company={data.entreprise.nom} pageNum={25} totalPages={32} />
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

        {data.niveauConfiance && (
          <>
            <Text style={styles.sectionSubtitle}>Niveau de confiance de l'evaluation</Text>
            <View style={[styles.card, {
              borderLeftWidth: 4,
              borderLeftColor: data.niveauConfiance === 'elevee' ? COLORS.success :
                               data.niveauConfiance === 'moyenne' ? COLORS.warning : COLORS.danger,
            }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={styles.cardTitle}>
                  Confiance: {data.niveauConfiance === 'elevee' ? 'Elevee' :
                              data.niveauConfiance === 'moyenne' ? 'Moyenne' : 'Faible'}
                </Text>
                <Text style={{
                  fontSize: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
                  backgroundColor: (data.niveauConfiance === 'elevee' ? COLORS.success :
                                    data.niveauConfiance === 'moyenne' ? COLORS.warning : COLORS.danger) + '20',
                  color: data.niveauConfiance === 'elevee' ? COLORS.success :
                         data.niveauConfiance === 'moyenne' ? COLORS.warning : COLORS.danger,
                }}>
                  {data.niveauConfiance === 'elevee' ? 'Fiabilité haute' :
                   data.niveauConfiance === 'moyenne' ? 'Fiabilité modérée' : 'Fiabilité limitée'}
                </Text>
              </View>
              <Text style={{ fontSize: 9, color: COLORS.gray700, marginBottom: 6 }}>
                {data.niveauConfiance === 'elevee'
                  ? 'Les données disponibles sont suffisantes et cohérentes pour une évaluation fiable.'
                  : data.niveauConfiance === 'moyenne'
                  ? 'L\'evaluation repose sur des données partielles. Les résultats sont indicatifs.'
                  : 'Données limitées ou peu cohérentes. Les résultats doivent être interprétés avec prudence.'}
              </Text>
              {data.facteursIncertitude && data.facteursIncertitude.length > 0 && (
                <>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.gray700, marginBottom: 4 }}>
                    Facteurs d'incertitude:
                  </Text>
                  {data.facteursIncertitude.map((f, i) => (
                    <View key={i} style={styles.bulletPoint}>
                      <Text style={[styles.bullet, { color: COLORS.warning }]}>!</Text>
                      <Text style={styles.bulletText}>{cleanText(f)}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </>
        )}

        {/* Notes de cohérence (Gate 4) */}
        {data.validationNotes && data.validationNotes.length > 0 && (
          <>
            <Text style={styles.sectionSubtitle}>Notes de coherence</Text>
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: COLORS.warning }]}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.gray700, marginBottom: 6 }}>
                Points d'attention identifies lors de la generation :
              </Text>
              {data.validationNotes.map((note, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={[styles.bullet, { color: COLORS.warning }]}>!</Text>
                  <Text style={styles.bulletText}>{cleanText(note)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Footer company={data.entreprise.nom} pageNum={26} totalPages={32} />
      </Page>
    </>
  )
}

// ============================================
// PAGE 27: ANALYSE DE SENSIBILITÉ
// ============================================

const SensitivityAnalysis = ({ data }: { data: ProfessionalReportData }) => {
  // Use ARR for SaaS profiles, EBITDA otherwise
  const baseMetric = data.sensitivityBase?.value ?? data.ebitdaNormalise.ebitdaNormalise
  const metricLabel = data.sensitivityBase?.label ?? 'EBITDA'
  const baseMultiple = data.methodes.find(m => m.multiple)?.multiple
    || (baseMetric > 0 ? data.valeurEntreprise.moyenne / baseMetric : 5)

  const metricVariations = [-0.20, -0.10, 0, 0.10, 0.20]
  const multipleVariations = [-1.0, -0.5, 0, 0.5, 1.0]

  const metricLabels = ['-20%', '-10%', 'Base', '+10%', '+20%']
  const multipleLabels = multipleVariations.map(mv => {
    const m = baseMultiple + mv
    return `${m.toFixed(1)}x`
  })

  return (
    <Page size="A4" style={styles.page}>
      <Header title="Analyse de sensibilite" />
      <Text style={styles.sectionSubtitle}>7.3 Analyse de sensibilite</Text>

      <View style={[styles.card, styles.cardPrimary, { marginBottom: 12 }]}>
        <Text style={styles.cardTitle}>Matrice de sensibilite</Text>
        <Text style={styles.paragraph}>
          Cette matrice illustre l'impact de variations {metricLabel === 'EBITDA' ? "de l'EBITDA normalise" : `de l'${metricLabel}`} et du multiple
          de valorisation sur la Valeur d'Entreprise. La cellule centrale represente le scenario de base.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.col2}>
          <KPICard label={`${metricLabel} (base)`} value={formatCurrency(baseMetric)} />
        </View>
        <View style={styles.col2}>
          <KPICard label="Multiple de base" value={`${baseMultiple.toFixed(1)}x`} />
        </View>
      </View>

      <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.gray700, marginBottom: 6, marginTop: 10 }}>
        Valeur d'Entreprise selon {metricLabel} (lignes) x Multiple (colonnes)
      </Text>

      {/* Matrice 5x5 */}
      <View style={{ borderWidth: 1, borderColor: COLORS.gray200, borderRadius: 4 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', backgroundColor: COLORS.primary }}>
          <View style={{ width: 65, padding: 4, justifyContent: 'center' }}>
            <Text style={{ fontSize: 7, fontWeight: 'bold', color: COLORS.white, textAlign: 'center' }}>
              {metricLabel} \ Mult.
            </Text>
          </View>
          {multipleLabels.map((label, j) => (
            <View key={j} style={{ flex: 1, padding: 4, justifyContent: 'center' }}>
              <Text style={{ fontSize: 7, fontWeight: 'bold', color: COLORS.white, textAlign: 'center' }}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Data rows */}
        {metricVariations.map((ev, i) => (
          <View key={i} style={{
            flexDirection: 'row',
            backgroundColor: i % 2 === 1 ? COLORS.gray50 : COLORS.white,
          }}>
            <View style={{ width: 65, padding: 4, justifyContent: 'center', backgroundColor: COLORS.gray100 }}>
              <Text style={{ fontSize: 7, fontWeight: 'bold', color: COLORS.gray900, textAlign: 'center' }}>
                {metricLabels[i]}
              </Text>
              <Text style={{ fontSize: 6, color: COLORS.gray500, textAlign: 'center' }}>
                {formatCurrency(baseMetric * (1 + ev))}
              </Text>
            </View>
            {multipleVariations.map((mv, j) => {
              const ve = baseMetric * (1 + ev) * Math.max(baseMultiple + mv, 0)
              const isBase = i === 2 && j === 2
              return (
                <View key={j} style={{
                  flex: 1, padding: 4, justifyContent: 'center',
                  backgroundColor: isBase ? COLORS.primary : undefined,
                }}>
                  <Text style={{
                    fontSize: 7, fontWeight: isBase ? 'bold' : 'normal', textAlign: 'center',
                    color: isBase ? COLORS.white : COLORS.gray700,
                  }}>
                    {formatCurrency(ve)}
                  </Text>
                </View>
              )
            })}
          </View>
        ))}
      </View>

      <View style={[styles.disclaimer, { marginTop: 10 }]}>
        <Text style={styles.disclaimerTitle}>Lecture</Text>
        <Text style={styles.disclaimerText}>
          La cellule centrale ({formatCurrency(data.valeurEntreprise.moyenne)}) correspond au scenario de base.
          Une variation de +10% {metricLabel === 'EBITDA' ? "de l'EBITDA" : `de l'${metricLabel}`} avec le meme multiple donnerait {formatCurrency(baseMetric * 1.1 * baseMultiple)}.
          A l'inverse, une baisse du multiple de 0.5x sur {metricLabel === 'EBITDA' ? "l'EBITDA" : `l'${metricLabel}`} de base donnerait {formatCurrency(baseMetric * (baseMultiple - 0.5))}.
        </Text>
      </View>

      <Footer company={data.entreprise.nom} pageNum={27} totalPages={32} />
    </Page>
  )
}

// ============================================
// PAGES 28-29: SWOT
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

      <Footer company={data.entreprise.nom} pageNum={28} totalPages={32} />
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

      <Footer company={data.entreprise.nom} pageNum={29} totalPages={32} />
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

      <Footer company={data.entreprise.nom} pageNum={30} totalPages={32} />
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

      <Footer company={data.entreprise.nom} pageNum={31} totalPages={32} />
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

      <View style={[styles.disclaimer, { marginTop: 20, borderColor: '#DC2626' }]}>
        <Text style={[styles.disclaimerTitle, { color: '#DC2626' }]}>Avertissement legal</Text>
        <Text style={styles.disclaimerText}>
          Ce rapport est fourni a titre indicatif et ne constitue en aucun cas une expertise
          certifiee, un audit financier, un conseil en investissement ou une evaluation opposable.
          Les valorisations sont des estimations generees par intelligence artificielle a partir
          de donnees publiques et declaratives. EvalUp ne se substitue pas a l'intervention d'un
          expert-comptable, d'un commissaire aux comptes ou d'un evaluateur professionnel agree.
          Pour toute decision financiere importante (cession, acquisition, levee de fonds), nous
          recommandons de faire appel a un professionnel qualifie. POSSE decline toute
          responsabilite quant aux decisions prises sur la base de ce document.
        </Text>
      </View>

      <Footer company={data.entreprise.nom} pageNum={32} totalPages={32} />
    </Page>
  </>
)

// ============================================
// DOCUMENT COMPLET
// ============================================

const ProfessionalReport = ({ data }: { data: ProfessionalReportData }) => (
  <Document>
    <CoverPage data={data} />
    {data.archetypeId && <ArchetypeProfilePage data={data} />}
    <TableOfContents data={data} />
    <ExecutiveSummary data={data} />
    <CompanyPresentation data={data} />
    <MarketAnalysis data={data} />
    <FinancialAnalysis data={data} />
    <RatioDashboard data={data} />
    <FinancialDiagnostic data={data} />
    <EBITDARestatements data={data} />
    <ValuationSection data={data} />
    <SensitivityAnalysis data={data} />
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
