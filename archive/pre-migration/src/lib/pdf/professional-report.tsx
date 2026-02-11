// Générateur PDF professionnel pour les rapports d'évaluation EvalUp (25-40 pages)
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
import { formatCurrency, formatPercent, formatNumber, cleanText, formatVariation, calculateVariation } from './utils'
import { BENCHMARKS, compareWithBenchmark, getSectorFromNaf } from './sector-benchmarks'

// Enregistrer la police Roboto
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
})

// ============================================
// TYPES ÉTENDUS
// ============================================

export interface ProfessionalReportData {
  entreprise: {
    nom: string
    siren: string
    siret?: string
    secteur: string
    codeNaf: string
    libelleNaf?: string
    dateCreation: string
    formeJuridique?: string
    capital?: number
    effectif: number | string
    trancheEffectif?: string
    localisation: string
    adresse?: string
    codePostal?: string
    ville?: string
    dirigeants?: { nom: string; fonction: string; dateNomination?: string }[]
    activite?: string
  }
  financier: {
    ca: number
    caEvolution?: number
    resultatNet: number
    resultatNetEvolution?: number
    resultatExploitation?: number
    ebitda: number
    ebitdaEvolution?: number
    tresorerie: number
    dettes: number
    capitauxPropres: number
    totalBilan?: number
    margeNette: number
    margeEbitda: number
    margeBrute?: number
    dso: number
    dpo?: number
    bfr?: number
    bfrJours?: number
    ratioEndettement: number
    ratioCouverture?: number
    roe?: number
    roce?: number
    stocks?: number
    creancesClients?: number
    dettesFournisseurs?: number
    // Ratios étendus pour tableau de bord
    margeEbit?: number
    detteNetteEbitda?: number
    autonomieFinanciere?: number
    liquiditeGenerale?: number
    fcf?: number
    fcfSurCa?: number
    bfrSurCa?: number
    dotationsAmortissements?: number
  }
  historique: {
    annee: number
    ca: number
    resultatNet: number
    ebitda?: number
    tresorerie: number
    capitauxPropres?: number
    effectif?: number
  }[]
  // Valorisation V2
  valeurEntreprise: { basse: number; moyenne: number; haute: number }
  prixCession: { basse: number; moyenne: number; haute: number }
  detteNette: {
    totalDettes: number
    totalTresorerie: number
    detteFinanciereNette: number
  }
  ebitdaNormalise: {
    ebitdaComptable: number
    totalRetraitements: number
    ebitdaNormalise: number
    retraitements: { libelle: string; montant: number; explication?: string }[]
  }
  methodes: {
    nom: string
    valeur: number
    poids: number
    explication: string
    multiple?: number
    justificationPoids?: string
  }[]
  // Analyse qualitative
  pointsForts: string[]
  pointsVigilance: string[]
  recommandations: string[]
  swot?: {
    forces: string[]
    faiblesses: string[]
    opportunites: string[]
    menaces: string[]
  }
  risques?: { titre: string; description: string; niveau: 'faible' | 'moyen' | 'eleve' }[]
  // Niveau de confiance
  niveauConfiance?: 'elevee' | 'moyenne' | 'faible'
  facteursIncertitude?: string[]
  // Diagnostic
  diagnostic: {
    noteGlobale: 'A' | 'B' | 'C' | 'D' | 'E'
    score: number
    categories: {
      nom: string
      score?: number
      ratios: { nom: string; valeur: number; valeurFormatee: string; evaluation: 'bon' | 'moyen' | 'mauvais' }[]
    }[]
  }
  // Marché
  marche?: {
    tailleMarcheLocal?: string
    tendances?: string[]
    concurrents?: { nom: string; position?: string }[]
    partsMarche?: string
    clientele?: string
    fournisseurs?: string
  }
  // Métadonnées
  dateGeneration: string
  analyste?: string
  confidentialite?: string
}

// ============================================
// STYLES PROFESSIONNELS
// ============================================

const styles = StyleSheet.create({
  // Page de base
  page: { padding: 50, fontFamily: 'Roboto', fontSize: 10, color: COLORS.gray700 },
  pageNoPadding: { padding: 0, fontFamily: 'Roboto', fontSize: 10, color: COLORS.gray700 },

  // Cover page
  coverPage: { flex: 1, backgroundColor: COLORS.primary },
  coverHeader: { height: 80, backgroundColor: COLORS.white, paddingHorizontal: 50, justifyContent: 'center' },
  coverLogo: { fontSize: 28, fontWeight: 'bold', color: COLORS.gold },
  coverMain: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 50 },
  coverTitle: { fontSize: 36, fontWeight: 'bold', color: COLORS.white, textAlign: 'center', marginBottom: 10 },
  coverSubtitle: { fontSize: 18, color: COLORS.white, textAlign: 'center', marginBottom: 40, opacity: 0.9 },
  coverCompany: { fontSize: 24, fontWeight: 'bold', color: COLORS.gold, textAlign: 'center', marginBottom: 8 },
  coverSiren: { fontSize: 14, color: COLORS.white, textAlign: 'center', opacity: 0.8 },
  coverFooter: { height: 100, backgroundColor: COLORS.primaryDark, paddingHorizontal: 50, justifyContent: 'center' },
  coverDate: { fontSize: 12, color: COLORS.white, opacity: 0.8 },
  coverConfidential: { fontSize: 10, color: COLORS.gold, marginTop: 5 },

  // Headers
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: COLORS.gold },
  headerLogo: { fontSize: 16, fontWeight: 'bold', color: COLORS.gold },
  headerTitle: { fontSize: 10, color: COLORS.gray500 },

  // Sections
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 15, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  sectionSubtitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.gray900, marginTop: 15, marginBottom: 10 },

  // Table des matières
  tocItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  tocNumber: { fontSize: 11, color: COLORS.primary, fontWeight: 'bold', width: 30 },
  tocLabel: { fontSize: 11, color: COLORS.gray700, flex: 1 },
  tocPage: { fontSize: 11, color: COLORS.gray500, width: 30, textAlign: 'right' },
  tocSub: { paddingLeft: 30 },

  // Cards
  card: { backgroundColor: COLORS.gray50, borderRadius: 8, padding: 15, marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 8 },
  cardPrimary: { backgroundColor: COLORS.bgLight, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardSuccess: { backgroundColor: COLORS.bgGreen, borderLeftWidth: 4, borderLeftColor: COLORS.success },
  cardWarning: { backgroundColor: COLORS.bgOrange, borderLeftWidth: 4, borderLeftColor: COLORS.warning },
  cardDanger: { backgroundColor: COLORS.bgRed, borderLeftWidth: 4, borderLeftColor: COLORS.danger },

  // Executive Summary - Valorisation principale
  valuationMain: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 25, marginBottom: 20, alignItems: 'center' },
  valuationLabel: { fontSize: 12, color: COLORS.white, opacity: 0.9, marginBottom: 5 },
  valuationValue: { fontSize: 42, fontWeight: 'bold', color: COLORS.white, marginBottom: 5 },
  valuationRange: { fontSize: 12, color: COLORS.white, opacity: 0.8 },

  // Grilles
  row: { flexDirection: 'row', gap: 12 },
  col2: { flex: 1 },
  col3: { flex: 1 },

  // KPI Cards
  kpiCard: { backgroundColor: COLORS.gray50, borderRadius: 8, padding: 12, marginBottom: 8 },
  kpiLabel: { fontSize: 8, color: COLORS.gray500, textTransform: 'uppercase', marginBottom: 4 },
  kpiValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray900 },
  kpiChange: { fontSize: 9, marginTop: 4 },
  kpiChangePositive: { color: COLORS.success },
  kpiChangeNegative: { color: COLORS.danger },

  // Tables
  table: { marginBottom: 15 },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 12, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  tableHeaderCell: { fontSize: 9, fontWeight: 'bold', color: COLORS.white },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
  tableRowAlt: { backgroundColor: COLORS.gray50 },
  tableCell: { fontSize: 9, color: COLORS.gray700 },
  tableCellBold: { fontSize: 9, fontWeight: 'bold', color: COLORS.gray900 },

  // Footer
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: COLORS.gray500, borderTopWidth: 1, borderTopColor: COLORS.gray200, paddingTop: 10 },
  pageNumber: { position: 'absolute', bottom: 30, right: 50, fontSize: 9, color: COLORS.gray500 },

  // Bridge VE → Prix
  bridgeCard: { backgroundColor: COLORS.gray50, borderRadius: 8, padding: 20, marginBottom: 20 },
  bridgeTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.gray900, marginBottom: 15, textAlign: 'center' },
  bridgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray200 },
  bridgeLabel: { fontSize: 10, color: COLORS.gray700 },
  bridgeValue: { fontSize: 11, fontWeight: 'bold', color: COLORS.gray900 },
  bridgeFinal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primary, marginTop: 10, marginHorizontal: -20, marginBottom: -20, padding: 15, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  bridgeFinalLabel: { fontSize: 12, fontWeight: 'bold', color: COLORS.white },
  bridgeFinalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },

  // Note/Score
  noteCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  noteText: { fontSize: 28, fontWeight: 'bold', color: COLORS.white },
  noteLabel: { fontSize: 9, color: COLORS.gray500, marginTop: 4 },

  // SWOT
  swotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swotBox: { width: '48%', borderRadius: 8, padding: 12, minHeight: 120 },
  swotTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 8 },
  swotItem: { fontSize: 9, color: COLORS.gray700, marginBottom: 4, paddingLeft: 10 },

  // Paragraphes
  paragraph: { fontSize: 10, color: COLORS.gray700, lineHeight: 1.6, marginBottom: 10 },
  bulletPoint: { flexDirection: 'row', marginBottom: 6 },
  bullet: { width: 15, fontSize: 10, color: COLORS.primary },
  bulletText: { flex: 1, fontSize: 10, color: COLORS.gray700, lineHeight: 1.5 },

  // Charts simulés (barres horizontales)
  barChart: { marginBottom: 15 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  barLabel: { width: 80, fontSize: 9, color: COLORS.gray700 },
  barContainer: { flex: 1, height: 16, backgroundColor: COLORS.gray100, borderRadius: 4 },
  barFill: { height: 16, borderRadius: 4 },
  barValue: { width: 60, fontSize: 9, fontWeight: 'bold', textAlign: 'right', marginLeft: 8 },

  // Disclaimer
  disclaimer: { backgroundColor: COLORS.gray100, borderRadius: 8, padding: 15, marginTop: 20 },
  disclaimerTitle: { fontSize: 10, fontWeight: 'bold', color: COLORS.gray700, marginBottom: 5 },
  disclaimerText: { fontSize: 8, color: COLORS.gray500, lineHeight: 1.5 },

  // Glossaire
  glossaryTerm: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 },
  glossaryDef: { fontSize: 9, color: COLORS.gray700, marginLeft: 10, lineHeight: 1.4 },
})

// ============================================
// COMPOSANTS RÉUTILISABLES
// ============================================

const Header = ({ title }: { title: string }) => (
  <View style={styles.header}>
    <Text style={styles.headerLogo}>EvalUp</Text>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
)

const Footer = ({ company, pageNum, totalPages }: { company: string; pageNum: number; totalPages: number }) => (
  <>
    <View style={styles.footer}>
      <Text>Document confidentiel - {cleanText(company)}</Text>
      <Text>EvalUp {new Date().getFullYear()}</Text>
    </View>
    <Text style={styles.pageNumber}>{pageNum} / {totalPages}</Text>
  </>
)

const KPICard = ({ label, value, change, positive }: { label: string; value: string; change?: string; positive?: boolean }) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={styles.kpiValue}>{value}</Text>
    {change && (
      <Text style={[styles.kpiChange, positive ? styles.kpiChangePositive : styles.kpiChangeNegative]}>
        {change}
      </Text>
    )}
  </View>
)

const NoteCircle = ({ note, score }: { note: string; score: number }) => {
  const bgColor = note === 'A' ? COLORS.success : note === 'B' ? '#22C55E' : note === 'C' ? COLORS.warning : note === 'D' ? '#F97316' : COLORS.danger
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.noteCircle, { backgroundColor: bgColor }]}>
        <Text style={styles.noteText}>{note}</Text>
      </View>
      <Text style={styles.noteLabel}>Score: {score}/100</Text>
    </View>
  )
}

const BarChart = ({ data, maxValue }: { data: { label: string; value: number; color?: string }[]; maxValue: number }) => (
  <View style={styles.barChart}>
    {data.map((item, i) => (
      <View key={i} style={styles.barRow}>
        <Text style={styles.barLabel}>{item.label}</Text>
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { width: `${Math.min((item.value / maxValue) * 100, 100)}%`, backgroundColor: item.color || COLORS.primary }]} />
        </View>
        <Text style={styles.barValue}>{formatCurrency(item.value)}</Text>
      </View>
    ))}
  </View>
)

// ============================================
// PAGE 1: COUVERTURE
// ============================================

const CoverPage = ({ data }: { data: ProfessionalReportData }) => (
  <Page size="A4" style={styles.pageNoPadding}>
    <View style={styles.coverPage}>
      <View style={styles.coverHeader}>
        <Text style={styles.coverLogo}>EvalUp</Text>
      </View>
      <View style={styles.coverMain}>
        <Text style={styles.coverTitle}>Rapport d'Evaluation</Text>
        <Text style={styles.coverSubtitle}>Analyse financiere et valorisation d'entreprise</Text>
        <Text style={styles.coverCompany}>{cleanText(data.entreprise.nom)}</Text>
        <Text style={styles.coverSiren}>SIREN {data.entreprise.siren}</Text>
      </View>
      <View style={styles.coverFooter}>
        <Text style={styles.coverDate}>Genere le {data.dateGeneration}</Text>
        <Text style={styles.coverConfidential}>{data.confidentialite || 'Document strictement confidentiel'}</Text>
      </View>
    </View>
  </Page>
)

// ============================================
// PAGE 2: SOMMAIRE
// ============================================

const TableOfContents = ({ data }: { data: ProfessionalReportData }) => (
  <Page size="A4" style={styles.page}>
    <Header title="Sommaire" />
    <Text style={styles.sectionTitle}>Sommaire</Text>

    {[
      { num: '1', label: 'Synthese executive', page: '3' },
      { num: '2', label: 'Presentation de l\'entreprise', page: '5' },
      { num: '2.1', label: 'Identite et informations legales', page: '5', sub: true },
      { num: '2.2', label: 'Historique et activite', page: '6', sub: true },
      { num: '2.3', label: 'Organisation et gouvernance', page: '7', sub: true },
      { num: '3', label: 'Analyse du marche', page: '8' },
      { num: '3.1', label: 'Secteur d\'activite', page: '8', sub: true },
      { num: '3.2', label: 'Positionnement concurrentiel', page: '9', sub: true },
      { num: '4', label: 'Analyse financiere', page: '11' },
      { num: '4.1', label: 'Evolution du chiffre d\'affaires', page: '11', sub: true },
      { num: '4.2', label: 'Rentabilite et marges', page: '12', sub: true },
      { num: '4.3', label: 'Structure du bilan', page: '13', sub: true },
      { num: '4.4', label: 'BFR et tresorerie', page: '14', sub: true },
      { num: '4.5', label: 'Flux de tresorerie', page: '15', sub: true },
      { num: '4.6', label: 'Tableau de bord des ratios', page: '16', sub: true },
      { num: '5', label: 'Diagnostic financier', page: '17' },
      { num: '5.1', label: 'Notation et scoring', page: '17', sub: true },
      { num: '5.2', label: 'Comparaison sectorielle', page: '18', sub: true },
      { num: '6', label: 'Retraitements de l\'EBITDA', page: '20' },
      { num: '7', label: 'Valorisation', page: '23' },
      { num: '7.1', label: 'Methodes utilisees', page: '23', sub: true },
      { num: '7.2', label: 'Bridge VE vers Prix', page: '25', sub: true },
      { num: '7.3', label: 'Analyse de sensibilite', page: '27', sub: true },
      { num: '8', label: 'Analyse SWOT', page: '28' },
      { num: '9', label: 'Recommandations', page: '30' },
      { num: '10', label: 'Annexes', page: '32' },
    ].map((item, i) => (
      <View key={i} style={[styles.tocItem, item.sub ? styles.tocSub : {}]}>
        <Text style={styles.tocNumber}>{item.num}</Text>
        <Text style={styles.tocLabel}>{item.label}</Text>
        <Text style={styles.tocPage}>{item.page}</Text>
      </View>
    ))}

    <Footer company={data.entreprise.nom} pageNum={2} totalPages={32} />
  </Page>
)

// ============================================
// PAGES 3-4: SYNTHÈSE EXECUTIVE
// ============================================

const ExecutiveSummary = ({ data }: { data: ProfessionalReportData }) => {
  const secteurCode = getSectorFromNaf(data.entreprise.codeNaf)
  const benchmark = BENCHMARKS[secteurCode] || BENCHMARKS.default

  return (
    <>
      <Page size="A4" style={styles.page}>
        <Header title="Synthese executive" />
        <Text style={styles.sectionTitle}>1. Synthese executive</Text>

        {/* Valorisation principale */}
        <View style={styles.valuationMain}>
          <Text style={styles.valuationLabel}>Prix de cession estime</Text>
          <Text style={styles.valuationValue}>{formatCurrency(data.prixCession.moyenne)}</Text>
          <Text style={styles.valuationRange}>
            Fourchette: {formatCurrency(data.prixCession.basse)} - {formatCurrency(data.prixCession.haute)}
          </Text>
        </View>

        {/* KPIs principaux */}
        <View style={styles.row}>
          <View style={styles.col3}>
            <KPICard
              label="Chiffre d'affaires"
              value={formatCurrency(data.financier.ca)}
              change={data.financier.caEvolution ? formatVariation(data.financier.caEvolution) : undefined}
              positive={data.financier.caEvolution ? data.financier.caEvolution > 0 : undefined}
            />
          </View>
          <View style={styles.col3}>
            <KPICard
              label="EBITDA normalise"
              value={formatCurrency(data.ebitdaNormalise.ebitdaNormalise)}
            />
          </View>
          <View style={styles.col3}>
            <KPICard
              label="Resultat net"
              value={formatCurrency(data.financier.resultatNet)}
              change={data.financier.resultatNetEvolution ? formatVariation(data.financier.resultatNetEvolution) : undefined}
              positive={data.financier.resultatNetEvolution ? data.financier.resultatNetEvolution > 0 : undefined}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col3}>
            <KPICard label="Marge EBITDA" value={formatPercent(data.financier.margeEbitda)} />
          </View>
          <View style={styles.col3}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>NOTE GLOBALE</Text>
              <NoteCircle note={data.diagnostic.noteGlobale} score={data.diagnostic.score} />
            </View>
          </View>
          <View style={styles.col3}>
            {data.niveauConfiance ? (
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>CONFIANCE</Text>
                <View style={{
                  backgroundColor: data.niveauConfiance === 'elevee' ? COLORS.success + '20' :
                                   data.niveauConfiance === 'moyenne' ? COLORS.warning + '20' : COLORS.danger + '20',
                  borderRadius: 8, padding: 6, alignItems: 'center', marginTop: 4,
                }}>
                  <Text style={{
                    fontSize: 12, fontWeight: 'bold',
                    color: data.niveauConfiance === 'elevee' ? COLORS.success :
                           data.niveauConfiance === 'moyenne' ? COLORS.warning : COLORS.danger,
                  }}>
                    {data.niveauConfiance === 'elevee' ? 'Elevee' :
                     data.niveauConfiance === 'moyenne' ? 'Moyenne' : 'Faible'}
                  </Text>
                </View>
              </View>
            ) : (
              <KPICard label="Tresorerie nette" value={formatCurrency(data.financier.tresorerie - data.financier.dettes)} />
            )}
          </View>
        </View>

        {/* Points clés */}
        <Text style={styles.sectionSubtitle}>Points cles de l'analyse</Text>
        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={[styles.card, styles.cardSuccess]}>
              <Text style={styles.cardTitle}>Points forts</Text>
              {data.pointsForts.slice(0, 4).map((point, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={[styles.bullet, { color: COLORS.success }]}>+</Text>
                  <Text style={styles.bulletText}>{cleanText(point)}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.col2}>
            <View style={[styles.card, styles.cardWarning]}>
              <Text style={styles.cardTitle}>Points de vigilance</Text>
              {data.pointsVigilance.slice(0, 4).map((point, i) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={[styles.bullet, { color: COLORS.warning }]}>!</Text>
                  <Text style={styles.bulletText}>{cleanText(point)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Footer company={data.entreprise.nom} pageNum={3} totalPages={32} />
      </Page>

      {/* Page 4: Suite synthèse */}
      <Page size="A4" style={styles.page}>
        <Header title="Synthese executive" />

        {/* Bridge VE → Prix */}
        <View style={styles.bridgeCard}>
          <Text style={styles.bridgeTitle}>De la Valeur d'Entreprise au Prix de Cession</Text>
          <View style={styles.bridgeRow}>
            <Text style={styles.bridgeLabel}>Valeur d'Entreprise (VE)</Text>
            <Text style={styles.bridgeValue}>{formatCurrency(data.valeurEntreprise.moyenne)}</Text>
          </View>
          {data.detteNette.totalDettes > 0 && (
            <View style={styles.bridgeRow}>
              <Text style={styles.bridgeLabel}>- Dettes financieres</Text>
              <Text style={[styles.bridgeValue, { color: COLORS.danger }]}>-{formatCurrency(data.detteNette.totalDettes)}</Text>
            </View>
          )}
          {data.detteNette.totalTresorerie > 0 && (
            <View style={styles.bridgeRow}>
              <Text style={styles.bridgeLabel}>+ Tresorerie disponible</Text>
              <Text style={[styles.bridgeValue, { color: COLORS.success }]}>+{formatCurrency(data.detteNette.totalTresorerie)}</Text>
            </View>
          )}
          <View style={styles.bridgeFinal}>
            <Text style={styles.bridgeFinalLabel}>= Prix de Cession</Text>
            <Text style={styles.bridgeFinalValue}>{formatCurrency(data.prixCession.moyenne)}</Text>
          </View>
        </View>

        {/* Méthodes utilisées - aperçu */}
        <Text style={styles.sectionSubtitle}>Methodes de valorisation appliquees</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Methode</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Poids</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Valeur</Text>
          </View>
          {data.methodes.map((m, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCellBold, { flex: 2 }]}>{m.nom}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{m.poids}%</Text>
              <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right' }]}>{formatCurrency(m.valeur)}</Text>
            </View>
          ))}
        </View>

        {/* Comparaison sectorielle rapide */}
        <Text style={styles.sectionSubtitle}>Position vs secteur ({benchmark.nom})</Text>
        <View style={styles.row}>
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Marge EBITDA</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: data.financier.margeEbitda >= benchmark.margeEbitda.median ? COLORS.success : COLORS.warning }}>
                {formatPercent(data.financier.margeEbitda)}
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.gray500 }}>Mediane secteur: {formatPercent(benchmark.margeEbitda.median)}</Text>
            </View>
          </View>
          <View style={styles.col2}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Marge nette</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: data.financier.margeNette >= benchmark.margeNette.median ? COLORS.success : COLORS.warning }}>
                {formatPercent(data.financier.margeNette)}
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.gray500 }}>Mediane secteur: {formatPercent(benchmark.margeNette.median)}</Text>
            </View>
          </View>
        </View>

        <Footer company={data.entreprise.nom} pageNum={4} totalPages={32} />
      </Page>
    </>
  )
}

// Export partiel - suite dans le prochain fichier
export { CoverPage, TableOfContents, ExecutiveSummary, Header, Footer, KPICard, NoteCircle, BarChart, styles }
