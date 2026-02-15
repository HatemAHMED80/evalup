// Assemblage des données pour le rapport professionnel PDF
// Convertit ConversationContext → ProfessionalReportData
// Utilise le calculateur V2 (archétype + multiples Damodaran)

import type { ConversationContext } from '@/lib/anthropic'
import type { BilanAnnuel as BilanV2 } from '@/lib/evaluation/types'
import type { ProfessionalReportData } from './professional-report'
import { calculateValuation, calculateFromEvaluationData } from '@/lib/valuation/calculator-v2'
import type { FinancialData, ValuationResult, Retraitements, QualitativeData } from '@/lib/valuation/calculator-v2'
import { getArchetype } from '@/lib/valuation/archetypes'
import { getMultiplesForArchetype } from '@/lib/valuation/multiples'
import { genererDiagnostic, ajusterScoreDiagnostic } from '@/lib/analyse/diagnostic'
import { calculerRatios, type RatiosFinanciers } from '@/lib/analyse/ratios'
import { getSectorFromNaf, BENCHMARKS, type SectorBenchmarks } from './sector-benchmarks'
import { genererSWOT, genererAnalyseMarche, genererRisques } from './generate-qualitative'
import type { EvaluationData } from '@/lib/evaluation/evaluation-data'

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

/** Contexte du diagnostic pour filtrer forces/vigilances */
interface DiagnosticContext {
  remunerationDirigeant?: number
  revenue?: number
  growth?: number
  masseSalariale?: number
  ebitda?: number
  tresorerie?: number
  recurring?: number
  anciennete?: number
  // SaaS/startup metrics
  churnMensuel?: number
  nrr?: number
  runway?: number
}

function genererPointsForts(ratios: RatiosFinanciers, benchmark: SectorBenchmarks, qual?: QualitativeData, diagCtx?: DiagnosticContext): string[] {
  const points: string[] = []
  // Quand remu=0, les marges et la rentabilité sont fictives (salaire non déduit)
  const remuZero = diagCtx?.remunerationDirigeant === 0
  if (!remuZero && ratios.margeEbitda > benchmark.margeEbitda.median) points.push('Marge EBITDA au-dessus de la mediane sectorielle')
  if (!remuZero && ratios.margeNette > 0.05) points.push('Rentabilite nette satisfaisante')
  if (ratios.ratioEndettement < 0.5) points.push('Faible endettement financier')
  if (!remuZero && ratios.roe > 0.15) points.push('Bonne rentabilite des capitaux propres')
  // Trésorerie solide : ne pas afficher quand EBITDA < 0 (la tréso est du runway, pas une force)
  if (ratios.liquiditeGenerale > 1.5 && !(diagCtx?.ebitda != null && diagCtx.ebitda < 0)) {
    points.push('Tresorerie solide')
  }
  // Gestion des délais clients — pas pertinent quand CA < 100k (DSO sans signification)
  if (!(diagCtx?.revenue != null && diagCtx.revenue < 100_000) && ratios.dso < benchmark.dso.median) {
    points.push('Bonne gestion des delais clients')
  }
  // Forces contextuelles depuis le diagnostic
  if (diagCtx?.growth != null && diagCtx.growth >= 20) {
    points.push(`Croissance forte du chiffre d'affaires (+${Math.round(diagCtx.growth)}%)`)
  }
  if (diagCtx?.recurring != null && diagCtx.recurring >= 60) {
    points.push(`Recurrence elevee (${Math.round(diagCtx.recurring)}% du CA)`)
  }
  if (diagCtx?.revenue != null && diagCtx.revenue > 5_000_000) {
    points.push('Chiffre d\'affaires significatif')
  }
  if (diagCtx?.anciennete != null && diagCtx.anciennete > 10) {
    points.push(`Entreprise etablie (${diagCtx.anciennete} ans d'anciennete)`)
  }
  // Données qualitatives du chat
  if (qual?.contratsCles) points.push('Contrats long terme securises avec les clients cles')
  if (qual?.dependanceDirigeant === 'faible') points.push('Faible dependance au dirigeant, equipe autonome')
  if (qual?.concentrationClients != null && qual.concentrationClients < 15) {
    points.push('Base clients diversifiee (top client < 15% du CA)')
  }
  if (points.length === 0) points.push('Activite en place avec un historique financier')
  return points
}

function genererPointsVigilance(ratios: RatiosFinanciers, benchmark: SectorBenchmarks, qual?: QualitativeData, diagCtx?: DiagnosticContext): string[] {
  const points: string[] = []
  // Pour pré-revenu (CA < 50k), les ratios du bilan sont non-représentatifs (CP estimé, marges extrêmes)
  // → ne pas afficher les vigilances ratio-based qui seraient artificiellement catastrophiques
  const isPreRevenue = diagCtx?.revenue != null && diagCtx.revenue > 0 && diagCtx.revenue < 50_000 && diagCtx?.ebitda != null && diagCtx.ebitda < 0
  if (!isPreRevenue && ratios.margeNette < 0.02) points.push('Marge nette faible')
  if (!isPreRevenue && ratios.ratioEndettement > 1.5) points.push('Endettement financier eleve')
  else if (!isPreRevenue && ratios.ratioEndettement > 0.7) points.push('Endettement financier significatif')
  if (!isPreRevenue && ratios.dso > benchmark.dso.max) points.push('Delais de paiement clients eleves')
  if (!isPreRevenue && ratios.bfrSurCa > 0.25) points.push('BFR important pesant sur la tresorerie')
  if (!isPreRevenue && ratios.margeEbitda < benchmark.margeEbitda.min) points.push('Marge EBITDA sous la moyenne sectorielle')
  // Données qualitatives du chat
  if (qual?.litiges) points.push('Litiges juridiques en cours signales')
  if (qual?.dependanceDirigeant === 'forte') points.push('Forte dependance au dirigeant actuel')
  if (qual?.concentrationClients != null && qual.concentrationClients > 30) {
    points.push(`Concentration clients elevee (top client = ${qual.concentrationClients}% du CA)`)
  }
  // Vigilances obligatoires depuis le diagnostic contextuel
  if (diagCtx?.remunerationDirigeant === 0) {
    points.push('EBITDA non representatif — remuneration dirigeant a 0€')
    if (diagCtx.masseSalariale != null && diagCtx.masseSalariale <= 5) {
      points.push('Activite non transferable en l\'etat (dirigeant = unique producteur)')
    }
  }
  if (diagCtx?.revenue != null && diagCtx.revenue < 100_000 && diagCtx.revenue > 0) {
    points.push('Micro-entreprise (CA < 100k€) — valorisation limitee')
  }
  if (diagCtx?.growth != null && diagCtx.growth <= 0) {
    points.push(`Chiffre d'affaires en stagnation ou decroissance (${diagCtx.growth}%)`)
  }
  // Récurrence faible (quand la donnée est fournie)
  if (diagCtx?.recurring != null && diagCtx.recurring > 0 && diagCtx.recurring < 35) {
    points.push(`Recurrence faible (${Math.round(diagCtx.recurring)}% du CA) — revenus peu previsibles`)
  }
  // Masse salariale élevée
  if (diagCtx?.masseSalariale != null && diagCtx.masseSalariale >= 60) {
    points.push(`Masse salariale elevee (${Math.round(diagCtx.masseSalariale)}% du CA) — marge structurellement faible`)
  }
  // Burn rate et runway pour startups / entreprises en perte
  if (diagCtx?.ebitda != null && diagCtx.ebitda < 0 && diagCtx?.tresorerie != null && diagCtx.tresorerie > 0) {
    const burnAnnuel = Math.abs(diagCtx.ebitda)
    const runwayMois = diagCtx.runway ?? Math.round((diagCtx.tresorerie / burnAnnuel) * 12)
    points.push(`Burn rate annuel de ${Math.round(burnAnnuel / 1000)}k€ — runway estime a ${runwayMois} mois`)
    if (runwayMois < 12) {
      points.push('Runway critique (< 12 mois) — levee de fonds ou restructuration necessaire')
    }
  } else if (diagCtx?.runway != null && diagCtx.runway <= 12) {
    // Runway déclaré explicitement (sans burn rate calculable)
    points.push(`Runway limite (${diagCtx.runway} mois)`)
  }
  // Churn mensuel élevé (SaaS/startup)
  if (diagCtx?.churnMensuel != null && diagCtx.churnMensuel > 10) {
    points.push(`Churn mensuel critique (${diagCtx.churnMensuel}%/mois) — perte de clients rapide`)
  } else if (diagCtx?.churnMensuel != null && diagCtx.churnMensuel > 5) {
    points.push(`Churn mensuel eleve (${diagCtx.churnMensuel}%/mois)`)
  }
  // Net Revenue Retention sous 100% (contraction)
  if (diagCtx?.nrr != null && diagCtx.nrr < 100) {
    points.push(`Net Revenue Retention sous 100% (${diagCtx.nrr}%) — revenus en contraction nette`)
  }
  // Pré-revenu explicite
  if (diagCtx?.revenue != null && diagCtx.revenue > 0 && diagCtx.revenue < 50_000 && diagCtx?.ebitda != null && diagCtx.ebitda < 0) {
    points.push('Pre-revenu — valorisation par multiples non applicable')
  }
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

/**
 * Parse effectif depuis le format Pappers.
 * Gère : nombre direct ("3"), plage ("10 a 19 salaries"), non-employeur, etc.
 */
function parseEffectif(effectifStr?: string | number): number {
  if (effectifStr === undefined || effectifStr === null) return 0
  if (typeof effectifStr === 'number') return effectifStr

  const trimmed = effectifStr.trim()

  // Nombre direct ("3", "12")
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10)

  // Plage : "10 a 19 salaries", "20 à 49", "2-5", etc.
  const rangeMatch = trimmed.match(/(\d+)\s*[-àa]\s*(\d+)/)
  if (rangeMatch) {
    return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2)
  }

  // "Etablissement non employeur" ou "0 salarie"
  if (/non.?employeur/i.test(trimmed) || trimmed === '0') return 1

  // Fallback
  const parsed = parseInt(trimmed.replace(/\s/g, ''), 10)
  return isNaN(parsed) ? 0 : parsed
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

  // Fallback salaireDirigeant depuis le diagnostic (si pas de donnée chat/doc)
  if (!hasDoc && context.diagnosticData?.remunerationDirigeant != null) {
    fromDocs.salaireDirigeant = context.diagnosticData.remunerationDirigeant
    hasDoc = true
  }

  // Données sidebar/chat — prioritaires sur les docs
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
    concentrationClients: fromChat.concentrationClients ?? context.diagnosticData?.concentrationClient,
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
export function assembleReportData(context: ConversationContext, validationWarnings?: string[]): ProfessionalReportData {
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

  // Métriques SaaS/Marketplace depuis le chat
  const saas = context.saasMetrics

  // Pour patrimoine/patrimoine_dominant : total actif depuis les composants du bilan
  // La tréso est un actif (pas un élément du bridge), les immo/stocks/créances aussi
  let assets: number | undefined
  if (archetypeId === 'patrimoine' || archetypeId === 'patrimoine_dominant') {
    assets = (bilanRecent.immobilisationsCorporelles ?? 0)
      + (bilanRecent.stocks ?? 0)
      + (bilanRecent.creancesClients ?? 0)
      + cash
  }

  const financialData: FinancialData = {
    revenue: bilanRecent.chiffreAffaires,
    ebitda: ebitdaComptable,
    netIncome: bilanRecent.resultatNet,
    equity: bilanRecent.capitauxPropres,
    cash,
    debt,
    assets,
    growth: context.diagnosticData?.growth,
    recurring: context.diagnosticData?.recurring,
    retraitements,
    // Métriques SaaS collectées dans le chat → alimentent le calculateur V2
    // Fallback MRR/ARR depuis le diagnostic si pas de données chat
    arr: saas?.arr ?? (saas?.mrr ? saas.mrr * 12 : undefined) ?? (context.diagnosticData?.mrrMensuel ? context.diagnosticData.mrrMensuel * 12 : undefined),
    mrr: saas?.mrr ?? context.diagnosticData?.mrrMensuel,
    // Marketplace : GMV depuis le chat ou dérivé du diagnostic (revenue diagnostic = GMV si ≠ CA Pappers)
    gmv: saas?.gmv ?? (archetypeId === 'marketplace' && context.diagnosticData?.revenue && context.diagnosticData.revenue > bilanRecent.chiffreAffaires
      ? context.diagnosticData.revenue
      : undefined),
  }

  // Construire les données qualitatives (décotes : illiquidité, minoritaire, etc.)
  const qualitativeData = buildQualitativeData(context)

  // 2. Calculer la valorisation V2 (avec retraitements + décotes)
  const valuation = calculateValuation(archetypeId, financialData, qualitativeData)

  // 3. Diagnostic financier + ratios + ajustement contextuel
  const secteurCode = getSectorFromNaf(entreprise.codeNaf)
  const diagnostic = genererDiagnostic(bilanRecent, secteurCode)
  const ratios = calculerRatios(bilanRecent)

  // Ajuster le score avec les données du diagnostic et Pappers
  const bilansCtxForAge = financials.bilans
  // BilanAnnuel n'a pas de date_cloture, on estime l'âge via l'année
  const dernierBilanAnnee = bilansCtxForAge[0]?.annee
  const dernierBilanAge = dernierBilanAnnee
    ? Math.round((new Date().getFullYear() - dernierBilanAnnee) * 12)
    : 0
  const computeEbitdaCtx = (b: typeof bilansCtxForAge[0]) => b.resultat_exploitation + (b.dotations_amortissements ?? 0)
  const ebitdaNegatif2Ans = bilansCtxForAge.length >= 2
    && computeEbitdaCtx(bilansCtxForAge[0]) < 0
    && computeEbitdaCtx(bilansCtxForAge[1]) < 0
  const dateCreation = entreprise.dateCreation ? new Date(entreprise.dateCreation) : null
  const ancienneteAnnees = dateCreation
    ? Math.floor((Date.now() - dateCreation.getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0

  const scoreAjuste = ajusterScoreDiagnostic(
    diagnostic.synthese.score,
    {
      revenue: context.diagnosticData?.revenue,
      ebitda: context.diagnosticData?.ebitda,
      growth: context.diagnosticData?.growth,
      recurring: context.diagnosticData?.recurring,
      masseSalariale: context.diagnosticData?.masseSalariale,
      concentrationClient: context.diagnosticData?.concentrationClient,
      remunerationDirigeant: context.diagnosticData?.remunerationDirigeant,
      dettesFinancieres: context.diagnosticData?.dettesFinancieres ?? debt,
      tresorerieActuelle: context.diagnosticData?.tresorerieActuelle ?? cash,
      mrrMensuel: context.diagnosticData?.mrrMensuel,
    },
    {
      nombreBilans: bilansCtxForAge.length,
      dernierBilanAge,
      ancienneteAnnees,
      ebitdaNegatif2Ans,
    }
  )

  // Utiliser le score ajusté
  diagnostic.synthese.score = scoreAjuste.score
  diagnostic.synthese.noteGlobale = scoreAjuste.grade

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
  let niveauConfiance = mapConfidence(valuation.confidenceScore)
  // Gate 1 : plafonner si retraitements non effectués
  if (!retraitements || Object.keys(retraitements).length === 0) {
    if (niveauConfiance === 'elevee') niveauConfiance = 'moyenne'
  }
  // Gate 2 : EBITDA négatif → incertitude sur la valorisation
  if (ebitdaComptable < 0) {
    if (niveauConfiance === 'elevee') niveauConfiance = 'moyenne'
  }
  // Gate 3 : rému = 0 avec CA significatif → EBITDA non représentatif
  const remuDirigeant = context.diagnosticData?.remunerationDirigeant
  if (remuDirigeant === 0 && bilanRecent.chiffreAffaires > 100_000) {
    if (niveauConfiance === 'elevee') niveauConfiance = 'moyenne'
  }
  // Gate 4 : dégrader la confiance si warnings de validation
  if (validationWarnings && validationWarnings.length >= 2) {
    if (niveauConfiance === 'elevee') niveauConfiance = 'moyenne'
  }
  if (validationWarnings && validationWarnings.length >= 4) {
    niveauConfiance = 'faible'
  }
  // Gate 5 : CA très faible + rému 0 → faible (quasi non valorisable)
  if (remuDirigeant === 0 && bilanRecent.chiffreAffaires < 100_000 && bilanRecent.chiffreAffaires > 0) {
    niveauConfiance = 'faible'
  }
  // Gate 6 : patrimoine — actifs à la valeur comptable (non réévalués) → plafonner à Moyenne
  if ((archetypeId === 'patrimoine' || archetypeId === 'patrimoine_dominant') && niveauConfiance === 'elevee') {
    niveauConfiance = 'moyenne'
  }
  // Gate 7 : concentration client > 50% → incertitude majeure sur pérennité du CA
  const concentrationPct = qualitativeData?.concentrationClients
  if (concentrationPct != null && concentrationPct > 50 && niveauConfiance === 'elevee') {
    niveauConfiance = 'moyenne'
  }

  const diagCtx: DiagnosticContext = {
    remunerationDirigeant: context.diagnosticData?.remunerationDirigeant,
    revenue: context.diagnosticData?.revenue,
    growth: context.diagnosticData?.growth,
    masseSalariale: context.diagnosticData?.masseSalariale,
    ebitda: context.diagnosticData?.ebitda,
    tresorerie: context.diagnosticData?.tresorerieActuelle ?? cash,
    recurring: context.diagnosticData?.recurring,
    anciennete: ancienneteAnnees || undefined,
    churnMensuel: context.saasMetrics?.churnMensuel,
    nrr: context.saasMetrics?.nrr,
    runway: context.saasMetrics?.runway,
  }
  const pointsForts = genererPointsForts(ratios, benchmark, qualitativeData, diagCtx)
  const pointsVigilance = genererPointsVigilance(ratios, benchmark, qualitativeData, diagCtx)

  const swot = genererSWOT({
    pointsForts,
    pointsVigilance,
    ratios,
    secteurCode,
    benchmark,
    qualitativeData,
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
    qualitativeData,
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
      effectif: parseEffectif(entreprise.effectif),
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
    facteursIncertitude: [
      ...genererFacteursIncertitude(valuation),
      ...(validationWarnings || []),
    ],
    validationNotes: validationWarnings,
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
    // Matrice de sensibilité : utiliser la métrique primaire réelle au lieu d'EBITDA
    sensitivityBase: (() => {
      if ((archetypeId === 'saas_hyper' || archetypeId === 'saas_mature') && financialData.arr) {
        return { value: financialData.arr, label: 'ARR' }
      }
      if (archetypeId === 'marketplace') {
        const gmvVal = financialData.gmv ?? financialData.arr
        if (gmvVal) return { value: gmvVal, label: financialData.gmv ? 'GMV' : 'ARR' }
      }
      return undefined
    })(),
    dateGeneration: new Date().toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
    confidentialite: 'Document strictement confidentiel',
  }
}

// ============================================
// ASSEMBLAGE DEPUIS EVALUATIONDATA (Phase 2)
// ============================================

/**
 * Assemble ProfessionalReportData depuis EvaluationData (sidebar source de verite).
 * Utilise le meme calculateur V2 et le meme format de sortie que assembleReportData.
 */
export function assembleFromEvaluationData(
  data: EvaluationData,
  validationWarnings?: string[]
): ProfessionalReportData {
  const sortedBilans = [...data.bilans].sort((a, b) => b.year - a.year)
  const last = sortedBilans[0]
  if (!last) {
    throw new Error('Aucun bilan disponible pour generer le rapport')
  }

  // 1. Calculer la valorisation via le nouvel adaptateur
  const valuation = calculateFromEvaluationData(data)

  // 2. Construire un BilanV2 pour le diagnostic/ratios
  const bilanV2: BilanV2 = {
    annee: last.year,
    chiffreAffaires: last.ca ?? 0,
    resultatNet: last.resultatNet ?? 0,
    resultatExploitation: last.resultatExploitation ?? 0,
    dotationsAmortissements: last.amortissements ?? 0,
    stocks: last.stocks ?? 0,
    creancesClients: last.creancesClients ?? 0,
    disponibilites: last.tresorerie ?? 0,
    capitauxPropres: last.capitauxPropres ?? 0,
    empruntsEtablissementsCredit: last.dettesFinancieres ?? 0,
    dettesFournisseurs: last.dettesFournisseurs ?? 0,
    provisionsRisques: last.provisions ?? 0,
  }

  const archetypeId = data.archetype
  const ebitdaComptable = bilanV2.resultatExploitation + (bilanV2.dotationsAmortissements ?? 0)
  const debt = bilanV2.empruntsEtablissementsCredit ?? 0
  const cash = bilanV2.disponibilites ?? 0

  // 3. Diagnostic + ratios
  const secteurCode = getSectorFromNaf(data.entreprise.nafCode)
  const diagnostic = genererDiagnostic(bilanV2, secteurCode)
  const ratios = calculerRatios(bilanV2)

  // Ajuster le score si on a les donnees qualitatives
  const dernierBilanAge = Math.round((new Date().getFullYear() - last.year) * 12)
  const ebitdaNegatif2Ans =
    sortedBilans.length >= 2 &&
    (sortedBilans[0].ebitda ?? 0) < 0 &&
    (sortedBilans[1].ebitda ?? 0) < 0
  const dateCreation = data.entreprise.dateCreation
    ? new Date(data.entreprise.dateCreation)
    : null
  const ancienneteAnnees = dateCreation
    ? Math.floor((Date.now() - dateCreation.getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0

  const scoreAjuste = ajusterScoreDiagnostic(
    diagnostic.synthese.score,
    {
      revenue: last.ca ?? undefined,
      ebitda: last.ebitda ?? undefined,
      growth: data.qualitative.croissanceActuelle ?? undefined,
      recurring: data.qualitative.recurring ?? undefined,
      concentrationClient: data.qualitative.concentrationTop1 ?? undefined,
      remunerationDirigeant: data.qualitative.remunerationDirigeant ?? undefined,
      dettesFinancieres: last.dettesFinancieres ?? undefined,
      tresorerieActuelle: last.tresorerie ?? undefined,
      mrrMensuel: data.saasMetrics?.mrr ?? undefined,
    },
    {
      nombreBilans: sortedBilans.length,
      dernierBilanAge,
      ancienneteAnnees,
      ebitdaNegatif2Ans,
    }
  )

  diagnostic.synthese.score = scoreAjuste.score
  diagnostic.synthese.noteGlobale = scoreAjuste.grade

  // 4. Evolutions
  const caEvolution =
    sortedBilans.length > 1 &&
    sortedBilans[1].ca != null &&
    sortedBilans[1].ca > 0 &&
    sortedBilans[0].ca != null
      ? (sortedBilans[0].ca - sortedBilans[1].ca) / sortedBilans[1].ca
      : undefined
  const rnEvolution =
    sortedBilans.length > 1 &&
    sortedBilans[1].resultatNet != null &&
    sortedBilans[1].resultatNet !== 0 &&
    sortedBilans[0].resultatNet != null
      ? (sortedBilans[0].resultatNet - sortedBilans[1].resultatNet) /
        Math.abs(sortedBilans[1].resultatNet)
      : undefined

  // 5. Qualitative analysis
  const benchmark = BENCHMARKS[secteurCode] || BENCHMARKS.default
  const qualV2: QualitativeData = {
    dependanceDirigeant: data.qualitative.dependanceDirigeant ?? undefined,
    concentrationClients: data.qualitative.concentrationTop1 ?? undefined,
    participationMinoritaire: data.qualitative.participationMinoritaire ?? undefined,
    litiges: data.qualitative.litiges ?? undefined,
    contratsCles: data.qualitative.contratsCles ?? undefined,
  }

  let niveauConfiance = mapConfidence(valuation.confidenceScore)
  if (data.retraitements.length === 0) {
    if (niveauConfiance === 'elevee') niveauConfiance = 'moyenne'
  }
  if (validationWarnings && validationWarnings.length >= 2) {
    if (niveauConfiance === 'elevee') niveauConfiance = 'moyenne'
  }
  if (validationWarnings && validationWarnings.length >= 4) {
    niveauConfiance = 'faible'
  }
  // Gate patrimoine : actifs à la valeur comptable (non réévalués) → plafonner à Moyenne
  if ((archetypeId === 'patrimoine' || archetypeId === 'patrimoine_dominant') && niveauConfiance === 'elevee') {
    niveauConfiance = 'moyenne'
  }
  // Gate concentration > 50% → incertitude majeure
  const concentrationPctV2 = qualV2?.concentrationClients
  if (concentrationPctV2 != null && concentrationPctV2 > 50 && niveauConfiance === 'elevee') {
    niveauConfiance = 'moyenne'
  }

  const diagCtxV2: DiagnosticContext = {
    remunerationDirigeant: data.qualitative.remunerationDirigeant ?? undefined,
    revenue: last.ca ?? undefined,
    growth: data.qualitative.croissanceActuelle ?? undefined,
    masseSalariale: undefined,
    ebitda: last.ebitda ?? undefined,
    tresorerie: last.tresorerie ?? undefined,
    recurring: data.qualitative.recurring ?? undefined,
    anciennete: ancienneteAnnees || undefined,
    churnMensuel: data.saasMetrics?.churnMensuel ?? undefined,
    nrr: data.saasMetrics?.nrr ?? undefined,
    runway: data.saasMetrics?.runway ?? undefined,
  }
  const pointsForts = genererPointsForts(ratios, benchmark, qualV2, diagCtxV2)
  const pointsVigilance = genererPointsVigilance(ratios, benchmark, qualV2, diagCtxV2)

  const swot = genererSWOT({
    pointsForts,
    pointsVigilance,
    ratios,
    secteurCode,
    benchmark,
    qualitativeData: qualV2,
  })

  const marche = genererAnalyseMarche({
    secteurCode,
    benchmark,
    ratios,
    ca: bilanV2.chiffreAffaires,
    effectif: data.entreprise.effectifLabel,
  })

  const risques = genererRisques({
    ratios,
    secteurCode,
    niveauConfiance,
    benchmark,
    qualitativeData: qualV2,
  })

  // 6. Archetype enrichment
  const archetype = getArchetype(archetypeId)
  const multiples = getMultiplesForArchetype(archetypeId)

  // 7. EBITDA normalise
  const totalRetraitements = valuation.adjustments.reduce((sum, a) => sum + a.impact, 0)

  // 8. Assemble
  return {
    entreprise: {
      nom: data.entreprise.nom,
      siren: data.entreprise.siren,
      secteur: archetype?.name || data.entreprise.secteur,
      codeNaf: data.entreprise.nafCode,
      dateCreation: data.entreprise.dateCreation || '',
      effectif: data.entreprise.effectifEstimation || data.entreprise.effectifLabel,
      localisation: data.entreprise.ville || '',
    },
    financier: {
      ca: bilanV2.chiffreAffaires,
      caEvolution,
      resultatNet: bilanV2.resultatNet,
      resultatNetEvolution: rnEvolution,
      resultatExploitation: bilanV2.resultatExploitation,
      ebitda: ebitdaComptable,
      tresorerie: cash,
      dettes: debt,
      capitauxPropres: bilanV2.capitauxPropres,
      margeNette: ratios.margeNette,
      margeEbitda: ratios.margeEbitda,
      margeBrute: ratios.margeBrute,
      dso: ratios.dso,
      dpo: ratios.dpo,
      ratioEndettement: ratios.ratioEndettement,
      roe: ratios.roe,
      stocks: bilanV2.stocks,
      creancesClients: bilanV2.creancesClients,
      dettesFournisseurs: bilanV2.dettesFournisseurs,
      dotationsAmortissements: bilanV2.dotationsAmortissements,
      margeEbit: ratios.margeEbit,
      detteNetteEbitda: ratios.detteNetteEbitda,
      autonomieFinanciere: ratios.autonomieFinanciere,
      liquiditeGenerale: ratios.liquiditeGenerale,
      bfr:
        (bilanV2.stocks ?? 0) +
        (bilanV2.creancesClients ?? 0) -
        (bilanV2.dettesFournisseurs ?? 0),
      bfrSurCa: ratios.bfrSurCa,
      fcf: ratios.fcf,
      fcfSurCa: ratios.fcfSurCa,
    },
    historique: sortedBilans.map((b) => ({
      annee: b.year,
      ca: b.ca ?? 0,
      resultatNet: b.resultatNet ?? 0,
      tresorerie: b.tresorerie ?? 0,
      ebitda: (b.resultatExploitation ?? 0) + (b.amortissements ?? 0),
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
      retraitements: valuation.adjustments.map((a) => ({
        libelle: a.name,
        montant: a.impact,
      })),
    },
    methodes: [
      {
        nom: valuation.methodUsed,
        valeur: valuation.enterpriseValue.median,
        poids: 100,
        explication:
          archetype?.whyThisMethod || "Methode adaptee au profil de l'entreprise",
      },
    ],
    niveauConfiance,
    facteursIncertitude: [
      ...genererFacteursIncertitude(valuation),
      ...(validationWarnings || []),
    ],
    validationNotes: validationWarnings,
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
      categories: diagnostic.categories.map((cat) => ({
        nom: cat.nom,
        ratios: cat.ratios.map((r) => ({
          nom: r.nom,
          valeur: r.valeur,
          valeurFormatee: r.valeurFormatee,
          evaluation: r.evaluation,
        })),
      })),
    },
    archetypeId,
    archetypeName: archetype?.name,
    archetypeIcon: archetype?.icon,
    archetypeColor: archetype?.color,
    archetypePrimaryMethod: archetype?.primaryMethod,
    archetypeSecondaryMethod: archetype?.secondaryMethod,
    archetypeWhyThisMethod: archetype?.whyThisMethod,
    archetypeCommonMistakes: archetype?.commonMistakes,
    archetypeKeyFactors: archetype?.keyFactors,
    damodaranMultiples: multiples
      ? {
          primaryMultiple: multiples.primaryMultiple,
          secondaryMultiple: multiples.secondaryMultiple,
          damodaranSector: multiples.damodaranSector,
          source: multiples.source,
        }
      : undefined,
    // Matrice de sensibilité : utiliser la métrique primaire réelle au lieu d'EBITDA
    sensitivityBase: (() => {
      const arrValue = data.saasMetrics?.arr ?? (data.saasMetrics?.mrr ? data.saasMetrics.mrr * 12 : undefined)
      if ((archetypeId === 'saas_hyper' || archetypeId === 'saas_mature') && arrValue) {
        return { value: arrValue, label: 'ARR' }
      }
      if (archetypeId === 'marketplace') {
        const gmvVal = data.saasMetrics?.gmv ?? arrValue
        if (gmvVal) return { value: gmvVal, label: data.saasMetrics?.gmv ? 'GMV' : 'ARR' }
      }
      return undefined
    })(),
    dateGeneration: new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    confidentialite: 'Document strictement confidentiel',
  }
}
