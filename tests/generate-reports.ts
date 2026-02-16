// Génération des 15 rapports PDF — un par archétype
// Usage : npx tsx tests/generate-reports.ts

import { SCENARIOS, type TestScenario } from './fixtures/scenarios'
import { assembleReportData } from '../src/lib/pdf/assemble-report-data'
import { generateProfessionalPDFBuffer } from '../src/lib/pdf/professional-report-final'
import type { ConversationContext, BilanAnnuel } from '../src/lib/anthropic'
import { detectArchetype, type DiagnosticInput } from '../src/lib/valuation/archetypes'
import { calculerRatios } from '../src/lib/analyse/ratios'
import * as fs from 'fs'
import * as path from 'path'

// ═══════════════════════════════════════════════════════════
// Mapping archetype IDs scenarios.ts → archetype IDs réels
// ═══════════════════════════════════════════════════════════
const ARCHETYPE_MAP: Record<string, string> = {
  saas_hyper: 'saas_hyper',
  saas_mature: 'saas_mature',
  marketplace: 'marketplace',
  ecommerce_d2c: 'ecommerce',
  conseil_expertise: 'conseil',
  services_recurrents: 'services_recurrents',
  masse_salariale_lourde: 'masse_salariale_lourde',
  commerce_retail: 'commerce_retail',
  commerce_gros: 'commerce_gros',
  industrie_asset_heavy: 'industrie',
  immobilier_fonciere: 'patrimoine',
  micro_rentable: 'micro_solo',
  micro_solo: 'micro_solo',
  holding_gestion: 'patrimoine_dominant',
  startup_prerevenu: 'pre_revenue',
}

// Mapping activityType → sector pour detectArchetype
const SECTOR_MAP: Record<string, string> = {
  saas: 'saas',
  marketplace: 'marketplace',
  ecommerce: 'ecommerce',
  conseil: 'conseil',
  services: 'services',
  commerce: 'commerce',
  industrie: 'industrie',
  immobilier: 'immobilier',
}

function buildConversationContext(scenario: TestScenario): ConversationContext {
  const p = scenario.pappers
  const d = scenario.diagnostic

  // Build the bilan from pappers data
  const bilan: BilanAnnuel = {
    annee: p.lastYear,
    chiffre_affaires: p.ca ?? 0,
    resultat_net: p.resultatNet ?? 0,
    resultat_exploitation: p.resultatExploitation ?? 0,
    dotations_amortissements: Math.round(Math.abs(p.resultatExploitation ?? 0) * 0.15), // estimé
    stocks: 0,
    creances_clients: Math.round((p.ca ?? 0) * 0.08),
    tresorerie: p.tresorerie ?? 0,
    capitaux_propres: Math.round((p.ca ?? 0) * 0.3),
    dettes_financieres: p.dettesFinancieres ?? 0,
    dettes_fournisseurs: Math.round((p.ca ?? 0) * 0.05),
    provisions: 0,
  }

  // Detect real archetype
  const diagInput: DiagnosticInput = {
    sector: SECTOR_MAP[d.activityType] || d.activityType,
    revenue: d.revenue,
    ebitda: d.ebitda,
    growth: d.growth,
    recurring: d.recurring,
    masseSalariale: d.masseSalariale,
    hasMRR: d.mrrMensuel != null && d.mrrMensuel > 0,
    hasPatrimoine: d.hasPatrimoine,
    loyersNets: d.loyersNets,
    nafCode: p.naf,
  }

  const realArchetypeId = ARCHETYPE_MAP[scenario.archetype] || detectArchetype(diagInput).id

  // Parse concentration client
  let concentrationClient: number | undefined
  if (d.concentrationClient === '<10%') concentrationClient = 5
  else if (d.concentrationClient === '10-30%') concentrationClient = 20
  else if (d.concentrationClient === '30-50%') concentrationClient = 40
  else if (d.concentrationClient === '>50%') concentrationClient = 60

  // Build ratios for the context
  const bilanV2 = {
    annee: bilan.annee,
    chiffreAffaires: bilan.chiffre_affaires,
    resultatNet: bilan.resultat_net,
    resultatExploitation: bilan.resultat_exploitation,
    dotationsAmortissements: bilan.dotations_amortissements,
    stocks: bilan.stocks,
    creancesClients: bilan.creances_clients,
    disponibilites: bilan.tresorerie,
    capitauxPropres: bilan.capitaux_propres,
    empruntsEtablissementsCredit: bilan.dettes_financieres,
    dettesFournisseurs: bilan.dettes_fournisseurs,
  }
  const ratios = calculerRatios(bilanV2)

  const context: ConversationContext = {
    entreprise: {
      siren: p.siren,
      nom: p.nom,
      secteur: d.activityType,
      codeNaf: p.naf,
      dateCreation: p.creation,
      effectif: d.effectif,
      adresse: '',
      ville: p.ville,
    },
    financials: {
      bilans: [bilan],
      ratios: {
        margeNette: ratios.margeNette,
        margeEbitda: ratios.margeEbitda,
        ebitda: ratios.margeEbitda * bilan.chiffre_affaires,
        dso: ratios.dso,
        ratioEndettement: ratios.ratioEndettement,
      },
      anomaliesDetectees: [],
    },
    documents: [],
    responses: {},
    evaluationProgress: {
      step: 10,
      completedTopics: ['diagnostic', 'financier', 'qualitatif'],
      pendingTopics: [],
    },
    archetype: realArchetypeId,
    diagnosticData: {
      revenue: d.revenue,
      ebitda: d.ebitda,
      growth: d.growth,
      recurring: d.recurring,
      masseSalariale: d.masseSalariale,
      effectif: d.effectif,
      remunerationDirigeant: d.remunerationDirigeant,
      dettesFinancieres: d.dettesFinancieres,
      tresorerieActuelle: d.tresorerieActuelle,
      concentrationClient,
      mrrMensuel: d.mrrMensuel,
    },
    // SaaS metrics if applicable
    saasMetrics: d.mrrMensuel ? {
      mrr: d.mrrMensuel,
      arr: d.mrrMensuel * 12,
      churnMensuel: d.churn,
      nrr: d.nrr,
      cac: d.cac,
      runway: d.runway,
    } : undefined,
  }

  return context
}

async function generateAllReports() {
  const outputDir = path.join(__dirname, 'output', 'reports')
  fs.mkdirSync(outputDir, { recursive: true })

  console.log('═══════════════════════════════════════════════════════')
  console.log('  GÉNÉRATION DES 15 RAPPORTS PDF')
  console.log('═══════════════════════════════════════════════════════\n')

  let success = 0
  let errors = 0

  for (const scenario of SCENARIOS) {
    const label = `${scenario.id.padEnd(25)} — ${scenario.nom}`
    process.stdout.write(`  Génération : ${label}...`)

    try {
      // 1. Build context
      const context = buildConversationContext(scenario)

      // 2. Assemble report data
      const reportData = assembleReportData(context)

      // 3. Save report data as JSON (for inspection)
      const jsonPath = path.join(outputDir, `${scenario.id}.json`)
      fs.writeFileSync(jsonPath, JSON.stringify({
        id: scenario.id,
        nom: scenario.nom,
        archetype: reportData.archetypeId,
        archetypeName: reportData.archetypeName,
        diagnostic: {
          note: reportData.diagnostic.noteGlobale,
          score: reportData.diagnostic.score,
        },
        niveauConfiance: reportData.niveauConfiance,
        valeurEntreprise: reportData.valeurEntreprise,
        prixCession: reportData.prixCession,
        detteNette: reportData.detteNette,
        ebitdaNormalise: reportData.ebitdaNormalise,
        methodes: reportData.methodes,
        pointsForts: reportData.pointsForts,
        pointsVigilance: reportData.pointsVigilance,
        recommandations: reportData.recommandations,
        swot: reportData.swot,
        risques: reportData.risques,
        expected: scenario.expected,
      }, null, 2))

      // 4. Generate PDF
      const pdfBuffer = await generateProfessionalPDFBuffer(reportData)
      const pdfPath = path.join(outputDir, `${scenario.id}.pdf`)
      fs.writeFileSync(pdfPath, pdfBuffer)

      const sizeMB = (pdfBuffer.length / 1024 / 1024).toFixed(1)
      console.log(` ✅ (${sizeMB} MB) — Note ${reportData.diagnostic.noteGlobale} | Confiance ${reportData.niveauConfiance}`)
      console.log(`     Valorisation : ${fmt(reportData.prixCession.basse)} – ${fmt(reportData.prixCession.moyenne)} – ${fmt(reportData.prixCession.haute)}`)
      success++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(` ❌ ERREUR`)
      console.log(`     → ${msg}`)
      errors++
    }
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`  Résultat : ${success} OK, ${errors} erreurs`)
  console.log(`  Dossier  : ${outputDir}`)
  console.log('═══════════════════════════════════════════════════════\n')

  if (errors > 0) process.exit(1)
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k€`
  return `${n}€`
}

generateAllReports().catch(err => {
  console.error('Erreur fatale:', err)
  process.exit(1)
})
