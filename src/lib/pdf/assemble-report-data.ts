// Assemblage des données pour le rapport professionnel PDF
// Convertit ConversationContext → ProfessionalReportData
// Utilise le calculateur V2 (archétype + multiples Damodaran)

import type { ConversationContext } from '@/lib/anthropic'
import type { BilanAnnuel as BilanV2 } from '@/lib/evaluation/types'
import type { ProfessionalReportData } from './professional-report'
import { calculateValuation } from '@/lib/valuation/calculator-v2'
import type { FinancialData, ValuationResult, Retraitements, QualitativeData } from '@/lib/valuation/calculator-v2'
import { getArchetype } from '@/lib/valuation/archetypes'
import { getMultiplesForArchetype } from '@/lib/valuation/multiples'
import { genererDiagnostic } from '@/lib/analyse/diagnostic'
import { calculerRatios, type RatiosFinanciers } from '@/lib/analyse/ratios'
import { getSectorFromNaf, BENCHMARKS, type SectorBenchmarks } from './sector-benchmarks'
import { genererSWOT, genererAnalyseMarche, genererRisques } from './generate-qualitative'

// ============================================
// CONVERSION BILANS (snake_case → camelCase)
// ============================================

type BilanContext = ConversationContext['financials']['bilans'][number]

function convertBilan(b: BilanContext): BilanV2 {
  return {
    annee: b.annee,
    chiffreAffaires: b.chiffre_affaires,
    resultatNet: b.resultat_net,
    resultatExploitation: b.resultat_exploitation,
    dotationsAmortissements: b.dotations_amortissements,
    stocks: b.stocks,
    creancesClients: b.creances_clients,
    disponibilites: b.tresorerie,
    capitauxPropres: b.capitaux_propres,
    empruntsEtablissementsCredit: b.dettes_financieres,
    dettesFournisseurs: b.dettes_fournisseurs,
    provisionsRisques: b.provisions,
    immobilisationsCorporelles: b.immobilisations_corporelles,
  }
}

// ============================================
// HELPERS QUALITATIFS
// ============================================

function genererPointsForts(ratios: RatiosFinanciers, benchmark: SectorBenchmarks): string[] {
  const points: string[] = []
  if (ratios.margeEbitda > benchmark.margeEbitda.median) points.push('Marge EBITDA au-dessus de la mediane sectorielle')
  if (ratios.margeNette > 0.05) points.push('Rentabilite nette satisfaisante')
  if (ratios.ratioEndettement < 0.5) points.push('Faible endettement financier')
  if (ratios.roe > 0.15) points.push('Bonne rentabilite des capitaux propres')
  if (ratios.liquiditeGenerale > 1.5) points.push('Tresorerie solide')
  if (ratios.dso < benchmark.dso.median) points.push('Bonne gestion des delais clients')
  if (points.length === 0) points.push('Activite en place avec un historique financier')
  return points
}

function genererPointsVigilance(ratios: RatiosFinanciers, benchmark: SectorBenchmarks): string[] {
  const points: string[] = []
  if (ratios.margeNette < 0.02) points.push('Marge nette faible')
  if (ratios.ratioEndettement > 1.5) points.push('Endettement financier eleve')
  if (ratios.dso > benchmark.dso.max) points.push('Delais de paiement clients eleves')
  if (ratios.bfrSurCa > 0.25) points.push('BFR important pesant sur la tresorerie')
  if (ratios.margeEbitda < benchmark.margeEbitda.min) points.push('Marge EBITDA sous la moyenne sectorielle')
  if (points.length === 0) points.push('Aucun point de vigilance majeur identifie')
  return points
}

function genererRecommandations(ratios: RatiosFinanciers): string[] {
  const recs: string[] = []
  if (ratios.margeNette < 0.05) recs.push('Optimiser les couts operationnels pour ameliorer la marge nette')
  if (ratios.dso > 60) recs.push('Reduire les delais de paiement clients pour ameliorer la tresorerie')
  if (ratios.ratioEndettement > 1.0) recs.push('Reduire progressivement l\'endettement')
  if (ratios.bfrSurCa > 0.2) recs.push('Optimiser le BFR (stocks, clients, fournisseurs)')
  recs.push('Preparer la documentation pour la cession')
  if (recs.length < 3) recs.push('Maintenir la croissance du chiffre d\'affaires')
  return recs.slice(0, 5)
}

function mapConfidence(score: number): 'elevee' | 'moyenne' | 'faible' {
  if (score >= 70) return 'elevee'
  if (score >= 40) return 'moyenne'
  return 'faible'
}

function genererFacteursIncertitude(valuation: ValuationResult): string[] {
  const facteurs: string[] = []
  if (valuation.confidenceScore < 70) {
    facteurs.push('Donnees financieres limitees ou incompletes')
  }
  if (valuation.adjustments.length === 0) {
    facteurs.push('Retraitements EBITDA non effectues (salaire dirigeant, loyer, etc.)')
  }
  if (valuation.decotes.length > 0) {
    facteurs.push(`${valuation.decotes.length} decote(s) appliquee(s) affectant la valorisation`)
  }
  if (facteurs.length === 0) {
    facteurs.push('Valorisation basee sur les donnees publiques et declarees')
  }
  return facteurs
}

// ============================================
// EXTRACTION RETRAITEMENTS (extractedDocData → V2)
// ============================================

/**
 * Extrait les données de retraitement depuis les documents comptables uploadés.
 * Mappe ExtractedExercice → Retraitements (format V2).
 */
function extractRetraitements(context: ConversationContext): Retraitements | undefined {
  const exercice = context.extractedDocData?.exercices?.[0]
  const fromDocs: Retraitements = {}
  let hasDoc = false

  if (exercice) {
    // Salaire dirigeant → V2 compare au barème normatif et ajuste l'EBITDA
    if (exercice.remuneration_dirigeant != null && exercice.remuneration_dirigeant > 0) {
      fromDocs.salaireDirigeant = exercice.remuneration_dirigeant
      hasDoc = true
    }

    // Crédit-bail → V2 réintègre les loyers dans l'EBITDA
    if (exercice.credit_bail != null && exercice.credit_bail > 0) {
      fromDocs.creditBailAnnuel = exercice.credit_bail
      hasDoc = true
    }
  }

  // Données chat ([DATA_UPDATE]) — prioritaires sur les docs
  const fromChat = context.retraitements
  const hasChat = fromChat && Object.keys(fromChat).length > 0

  if (!hasDoc && !hasChat) return undefined

  return { ...fromDocs, ...fromChat }
}

/**
 * Construit les données qualitatives depuis le contexte de conversation.
 * Utilisé par V2 pour appliquer les décotes (illiquidité, minoritaire, etc.).
 */
function buildQualitativeData(context: ConversationContext): QualitativeData {
  const fromChat = context.qualitativeData || {}
  return {
    // Participation minoritaire : chat > fallback objet/pourcentage
    participationMinoritaire:
      fromChat.participationMinoritaire ??
      (context.objet === 'titres_partiel' && (context.pourcentageParts ?? 100) < 50),
    dependanceDirigeant: fromChat.dependanceDirigeant,
    concentrationClients: fromChat.concentrationClients,
    litiges: fromChat.litiges,
    contratsCles: fromChat.contratsCles,
  }
}

// ============================================
// ASSEMBLAGE PRINCIPAL
// ============================================

/**
 * Assemble ProfessionalReportData depuis le ConversationContext du chat.
 * Utilise le calculateur V2 (archétype), le diagnostic financier et les ratios.
 */
export function assembleReportData(context: ConversationContext): ProfessionalReportData {
  const { entreprise, financials } = context

  // Convertir les bilans snake_case → camelCase
  const bilansV2 = financials.bilans.map(convertBilan)
  const bilanRecent = bilansV2[0]

  if (!bilanRecent) {
    throw new Error('Aucun bilan disponible pour generer le rapport')
  }

  // 1. Préparer les données pour le calculateur V2
  const archetypeId = context.archetype || 'services_recurrents'
  const ebitdaComptable = bilanRecent.resultatExploitation + (bilanRecent.dotationsAmortissements ?? 0)
  const debt = bilanRecent.empruntsEtablissementsCredit ?? 0
  const cash = bilanRecent.disponibilites ?? 0

  // Extraire les retraitements depuis les documents uploadés (si disponibles)
  const retraitements = extractRetraitements(context)

  const financialData: FinancialData = {
    revenue: bilanRecent.chiffreAffaires,
    ebitda: ebitdaComptable,
    netIncome: bilanRecent.resultatNet,
    equity: bilanRecent.capitauxPropres,
    cash,
    debt,
    growth: context.diagnosticData?.growth,
    recurring: context.diagnosticData?.recurring,
    retraitements,
  }

  // Construire les données qualitatives (décotes : illiquidité, minoritaire, etc.)
  const qualitativeData = buildQualitativeData(context)

  // 2. Calculer la valorisation V2 (avec retraitements + décotes)
  const valuation = calculateValuation(archetypeId, financialData, qualitativeData)

  // 3. Diagnostic financier + ratios
  const secteurCode = getSectorFromNaf(entreprise.codeNaf)
  const diagnostic = genererDiagnostic(bilanRecent, secteurCode)
  const ratios = calculerRatios(bilanRecent)

  // 4. Calculer les évolutions annuelles
  const bilansCtx = financials.bilans
  const caEvolution = bilansCtx.length > 1 && bilansCtx[1].chiffre_affaires > 0
    ? (bilansCtx[0].chiffre_affaires - bilansCtx[1].chiffre_affaires) / bilansCtx[1].chiffre_affaires
    : undefined
  const rnEvolution = bilansCtx.length > 1 && bilansCtx[1].resultat_net !== 0
    ? (bilansCtx[0].resultat_net - bilansCtx[1].resultat_net) / Math.abs(bilansCtx[1].resultat_net)
    : undefined

  // 5. Générer les données qualitatives (SWOT, marché, risques)
  const benchmark = BENCHMARKS[secteurCode] || BENCHMARKS.default
  const niveauConfiance = mapConfidence(valuation.confidenceScore)
  const pointsForts = genererPointsForts(ratios, benchmark)
  const pointsVigilance = genererPointsVigilance(ratios, benchmark)

  const swot = genererSWOT({
    pointsForts,
    pointsVigilance,
    ratios,
    secteurCode,
    benchmark,
  })

  const marche = genererAnalyseMarche({
    secteurCode,
    benchmark,
    ratios,
    ca: bilanRecent.chiffreAffaires,
    effectif: entreprise.effectif,
  })

  const risques = genererRisques({
    ratios,
    secteurCode,
    niveauConfiance,
    benchmark,
  })

  // 6. Enrichir avec les données d'archétype
  const archetype = getArchetype(archetypeId)
  const multiples = getMultiplesForArchetype(archetypeId)

  // 7. EBITDA normalisé (retraitements V2)
  const totalRetraitements = valuation.adjustments.reduce((sum, a) => sum + a.impact, 0)

  // 8. Assembler ProfessionalReportData
  return {
    entreprise: {
      nom: entreprise.nom,
      siren: entreprise.siren,
      secteur: archetype?.name || entreprise.secteur,
      codeNaf: entreprise.codeNaf,
      dateCreation: entreprise.dateCreation || '',
      effectif: Number(entreprise.effectif) || 0,
      localisation: entreprise.ville || entreprise.adresse || '',
    },
    financier: {
      ca: bilanRecent.chiffreAffaires,
      caEvolution,
      resultatNet: bilanRecent.resultatNet,
      resultatNetEvolution: rnEvolution,
      resultatExploitation: bilanRecent.resultatExploitation,
      ebitda: ebitdaComptable,
      tresorerie: cash,
      dettes: debt,
      capitauxPropres: bilanRecent.capitauxPropres,
      margeNette: ratios.margeNette,
      margeEbitda: ratios.margeEbitda,
      margeBrute: ratios.margeBrute,
      dso: ratios.dso,
      dpo: ratios.dpo,
      ratioEndettement: ratios.ratioEndettement,
      roe: ratios.roe,
      stocks: bilanRecent.stocks,
      creancesClients: bilanRecent.creancesClients,
      dettesFournisseurs: bilanRecent.dettesFournisseurs,
      // Ratios étendus
      dotationsAmortissements: bilanRecent.dotationsAmortissements,
      margeEbit: ratios.margeEbit,
      detteNetteEbitda: ratios.detteNetteEbitda,
      autonomieFinanciere: ratios.autonomieFinanciere,
      liquiditeGenerale: ratios.liquiditeGenerale,
      bfr: (bilanRecent.stocks ?? 0) + (bilanRecent.creancesClients ?? 0) - (bilanRecent.dettesFournisseurs ?? 0),
      bfrSurCa: ratios.bfrSurCa,
      fcf: ratios.fcf,
      fcfSurCa: ratios.fcfSurCa,
    },
    historique: bilansCtx.map(b => ({
      annee: b.annee,
      ca: b.chiffre_affaires,
      resultatNet: b.resultat_net,
      tresorerie: b.tresorerie,
      ebitda: b.resultat_exploitation + b.dotations_amortissements,
    })),
    valeurEntreprise: {
      basse: valuation.enterpriseValue.low,
      moyenne: valuation.enterpriseValue.median,
      haute: valuation.enterpriseValue.high,
    },
    prixCession: {
      basse: valuation.equityValue.low,
      moyenne: valuation.equityValue.median,
      haute: valuation.equityValue.high,
    },
    detteNette: {
      totalDettes: debt,
      totalTresorerie: cash,
      detteFinanciereNette: valuation.netDebt,
    },
    ebitdaNormalise: {
      ebitdaComptable,
      totalRetraitements,
      ebitdaNormalise: ebitdaComptable + totalRetraitements,
      retraitements: valuation.adjustments.map(a => ({
        libelle: a.name,
        montant: a.impact,
      })),
    },
    methodes: [{
      nom: valuation.methodUsed,
      valeur: valuation.enterpriseValue.median,
      poids: 100,
      explication: archetype?.whyThisMethod || 'Methode adaptee au profil de l\'entreprise',
    }],
    niveauConfiance,
    facteursIncertitude: genererFacteursIncertitude(valuation),
    pointsForts,
    pointsVigilance,
    recommandations: genererRecommandations(ratios),
    swot,
    risques,
    marche: {
      tendances: marche.tendances,
      clientele: marche.clientele,
      fournisseurs: marche.fournisseurs,
    },
    diagnostic: {
      noteGlobale: diagnostic.synthese.noteGlobale,
      score: diagnostic.synthese.score,
      categories: diagnostic.categories.map(cat => ({
        nom: cat.nom,
        ratios: cat.ratios.map(r => ({
          nom: r.nom,
          valeur: r.valeur,
          valeurFormatee: r.valeurFormatee,
          evaluation: r.evaluation,
        })),
      })),
    },
    // Archétype
    archetypeId,
    archetypeName: archetype?.name,
    archetypeIcon: archetype?.icon,
    archetypeColor: archetype?.color,
    archetypePrimaryMethod: archetype?.primaryMethod,
    archetypeSecondaryMethod: archetype?.secondaryMethod,
    archetypeWhyThisMethod: archetype?.whyThisMethod,
    archetypeCommonMistakes: archetype?.commonMistakes,
    archetypeKeyFactors: archetype?.keyFactors,
    // Damodaran multiples
    damodaranMultiples: multiples ? {
      primaryMultiple: multiples.primaryMultiple,
      secondaryMultiple: multiples.secondaryMultiple,
      damodaranSector: multiples.damodaranSector,
      source: multiples.source,
    } : undefined,
    dateGeneration: new Date().toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
    confidentialite: 'Document strictement confidentiel',
  }
}
