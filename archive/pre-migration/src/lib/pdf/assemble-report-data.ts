// Assemblage des données pour le rapport professionnel PDF
// Convertit ConversationContext → ProfessionalReportData

import type { ConversationContext } from '@/lib/anthropic'
import type { BilanAnnuel as BilanV2, DonneesEvaluationV2 } from '@/lib/evaluation/types'
import type { ProfessionalReportData } from './professional-report'
import { evaluerEntrepriseV2 } from '@/lib/evaluation/calculateur-v2'
import { genererDiagnostic } from '@/lib/analyse/diagnostic'
import { calculerRatios } from '@/lib/analyse/ratios'
import { getSectorFromNaf, BENCHMARKS } from './sector-benchmarks'
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
// ASSEMBLAGE PRINCIPAL
// ============================================

/**
 * Assemble ProfessionalReportData depuis le ConversationContext du chat.
 * Exécute le calculateur V2, le diagnostic financier et calcule tous les ratios.
 */
export function assembleReportData(context: ConversationContext): ProfessionalReportData {
  const { entreprise, financials } = context

  // Convertir les bilans snake_case → camelCase
  const bilansV2 = financials.bilans.map(convertBilan)
  const bilanRecent = bilansV2[0]

  if (!bilanRecent) {
    throw new Error('Aucun bilan disponible pour generer le rapport')
  }

  // 1. Exécuter le calculateur V2
  const donneesV2: DonneesEvaluationV2 = {
    siren: entreprise.siren,
    nomEntreprise: entreprise.nom,
    codeNaf: entreprise.codeNaf,
    dateCreation: entreprise.dateCreation,
    effectif: Number(entreprise.effectif) || undefined,
    localisation: entreprise.ville || entreprise.adresse,
    bilans: bilansV2,
    retraitements: {
      salaireDirigeantBrutCharge: 0,
      nombreDirigeants: 1,
    },
  }

  const resultat = evaluerEntrepriseV2(donneesV2)

  // 2. Exécuter le diagnostic financier
  const secteurCode = getSectorFromNaf(entreprise.codeNaf)
  const diagnostic = genererDiagnostic(bilanRecent, secteurCode)

  // 3. Calculer les ratios financiers complets
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
  const niveauConfiance = resultat.niveauConfiance

  const swot = genererSWOT({
    pointsForts: resultat.pointsForts,
    pointsVigilance: resultat.pointsVigilance.length > 0
      ? resultat.pointsVigilance
      : ['Aucun point de vigilance majeur identifie'],
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

  // 6. Assembler ProfessionalReportData
  return {
    entreprise: {
      nom: entreprise.nom,
      siren: entreprise.siren,
      secteur: resultat.secteur.nom,
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
      ebitda: resultat.ebitda.ebitdaComptable,
      tresorerie: bilanRecent.disponibilites ?? 0,
      dettes: bilanRecent.empruntsEtablissementsCredit ?? 0,
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
    valeurEntreprise: resultat.valeurEntreprise,
    prixCession: resultat.prixCession,
    detteNette: {
      totalDettes: resultat.detteNette.totalDettes,
      totalTresorerie: resultat.detteNette.totalTresorerie,
      detteFinanciereNette: resultat.detteNette.detteFinanciereNette,
    },
    ebitdaNormalise: {
      ebitdaComptable: resultat.ebitda.ebitdaComptable,
      totalRetraitements: resultat.ebitda.totalRetraitements,
      ebitdaNormalise: resultat.ebitda.ebitdaNormalise,
      retraitements: resultat.ebitda.retraitements.map(r => ({
        libelle: r.libelle,
        montant: r.montant,
      })),
    },
    methodes: resultat.methodes.map(m => ({
      nom: m.nom,
      valeur: m.valeurEntreprise,
      poids: m.poids,
      explication: m.details.formule,
      multiple: m.details.multiple,
    })),
    niveauConfiance: resultat.niveauConfiance,
    facteursIncertitude: resultat.facteursIncertitude,
    pointsForts: resultat.pointsForts,
    pointsVigilance: resultat.pointsVigilance.length > 0
      ? resultat.pointsVigilance
      : ['Aucun point de vigilance majeur identifie'],
    recommandations: resultat.recommandations.length > 0
      ? resultat.recommandations
      : [
          'Maintenir la croissance du CA',
          'Continuer a optimiser les couts operationnels',
          'Preparer la documentation pour la cession',
        ],
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
    dateGeneration: new Date().toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
    confidentialite: 'Document strictement confidentiel',
  }
}
