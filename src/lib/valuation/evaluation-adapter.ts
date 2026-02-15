// Adaptateur : EvaluationData → FinancialData + QualitativeData (inputs du calculateur V2)
// Temporaire — à terme calculator-v2.ts lira directement EvaluationData.

import type { EvaluationData } from '../evaluation/evaluation-data'
import type { FinancialData, QualitativeData, Retraitements } from './calculator-v2'

// Note : On passe le raw EBITDA (last.ebitda) + retraitements au calculateur,
// qui applique sa propre normalisation via normaliserEbitda(). Le champ
// data.ebitdaNormalise est un pre-calcul pour affichage (DataPanel) uniquement.
export function evaluationDataToFinancialData(data: EvaluationData): FinancialData {
  const sortedBilans = [...data.bilans].sort((a, b) => b.year - a.year)
  const last = sortedBilans[0]
  const prev = sortedBilans[1]

  // Croissance calculee depuis les bilans si pas declaree
  const growth =
    data.qualitative.croissanceActuelle ??
    (last?.ca && prev?.ca && prev.ca > 0
      ? ((last.ca - prev.ca) / prev.ca) * 100
      : undefined)

  // Convertir les retraitements structures vers le format V2
  const retraitements: Retraitements = {}
  for (const r of data.retraitements) {
    switch (r.type) {
      case 'salaire_dirigeant':
        retraitements.salaireDirigeant = r.montantActuel
        break
      case 'loyer':
        retraitements.loyerAnnuel = r.montantActuel
        retraitements.loyerMarche = r.montantRetraite
        retraitements.loyerAppartientDirigeant = true
        break
      case 'credit_bail':
        retraitements.creditBailAnnuel = r.montantActuel
        break
      case 'charge_exceptionnelle':
        retraitements.chargesExceptionnelles = r.montantActuel
        break
      case 'produit_exceptionnel':
        retraitements.produitsExceptionnels = r.montantActuel
        break
      case 'salaire_famille_excessif':
        retraitements.salairesExcessifsFamille = r.montantActuel
        break
      case 'salaire_famille_insuffisant':
        retraitements.salairesInsuffisantsFamille = r.montantRetraite
        break
      default:
        break
    }
  }

  // Pour patrimoine/patrimoine_dominant : total actif depuis les composants du bilan
  let assets: number | undefined
  if (data.archetype === 'patrimoine' || data.archetype === 'patrimoine_dominant') {
    assets = (last?.stocks ?? 0) + (last?.creancesClients ?? 0) + (last?.tresorerie ?? 0)
  }

  return {
    revenue: last?.ca ?? 0,
    ebitda: last?.ebitda ?? 0,
    netIncome: last?.resultatNet ?? 0,
    equity: last?.capitauxPropres ?? 0,
    cash: last?.tresorerie ?? 0,
    debt: last?.dettesFinancieres ?? 0,
    assets,
    growth: growth ?? undefined,
    recurring: data.qualitative.recurring ?? undefined,
    retraitements: Object.keys(retraitements).length > 0 ? retraitements : undefined,
    // SaaS
    arr: data.saasMetrics?.arr ?? undefined,
    mrr: data.saasMetrics?.mrr ?? undefined,
    gmv: data.saasMetrics?.gmv ?? undefined,
  }
}

export function evaluationDataToQualitativeData(data: EvaluationData): QualitativeData {
  return {
    dependanceDirigeant: data.qualitative.dependanceDirigeant ?? undefined,
    concentrationClients: data.qualitative.concentrationTop1 ?? undefined,
    participationMinoritaire: data.qualitative.participationMinoritaire ?? undefined,
    litiges: data.qualitative.litiges ?? undefined,
    contratsCles: data.qualitative.contratsCles ?? undefined,
  }
}
