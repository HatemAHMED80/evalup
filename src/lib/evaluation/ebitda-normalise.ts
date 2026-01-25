// Module de calcul de l'EBITDA normalisé
// Conforme aux règles de l'art : retraitements pour obtenir l'EBITDA économique

import {
  BilanAnnuel,
  DonneesRetraitements,
  EbitdaNormalise,
  RetraitementEbitda,
  CategorieRetraitement,
} from './types'

// ============================================
// SALAIRES NORMATIFS PAR TAILLE D'ENTREPRISE
// ============================================

interface TrancheCA {
  min: number
  max: number
  salaireNormatif: number // Salaire brut chargé annuel
}

const TRANCHES_SALAIRE_DIRIGEANT: TrancheCA[] = [
  { min: 0, max: 500_000, salaireNormatif: 45_000 },
  { min: 500_000, max: 1_000_000, salaireNormatif: 60_000 },
  { min: 1_000_000, max: 2_000_000, salaireNormatif: 80_000 },
  { min: 2_000_000, max: 5_000_000, salaireNormatif: 100_000 },
  { min: 5_000_000, max: 10_000_000, salaireNormatif: 130_000 },
  { min: 10_000_000, max: 20_000_000, salaireNormatif: 160_000 },
  { min: 20_000_000, max: Infinity, salaireNormatif: 200_000 },
]

/**
 * Retourne le salaire normatif d'un dirigeant en fonction du CA
 * Utilisé pour retraiter les rémunérations excessives ou insuffisantes
 */
export function getSalaireNormatifDirigeant(chiffreAffaires: number): number {
  const tranche = TRANCHES_SALAIRE_DIRIGEANT.find(
    (t) => chiffreAffaires >= t.min && chiffreAffaires < t.max
  )
  return tranche?.salaireNormatif ?? 80_000 // Défaut si non trouvé
}

// ============================================
// CALCUL EBITDA COMPTABLE
// ============================================

/**
 * Calcule l'EBITDA comptable à partir du bilan
 * EBITDA = Résultat d'exploitation + Dotations amortissements + Dotations provisions
 */
export function calculerEbitdaComptable(bilan: BilanAnnuel): number {
  const resultatExploitation = bilan.resultatExploitation ?? 0
  const dotationsAmortissements = bilan.dotationsAmortissements ?? 0
  const dotationsProvisions = bilan.dotationsProvisions ?? 0

  return resultatExploitation + dotationsAmortissements + dotationsProvisions
}

/**
 * Calcule l'EBITDA comptable moyen sur plusieurs années
 * Pondère l'année la plus récente plus fortement
 */
export function calculerEbitdaComptableMoyen(bilans: BilanAnnuel[]): number {
  if (bilans.length === 0) return 0
  if (bilans.length === 1) return calculerEbitdaComptable(bilans[0])

  // Trier par année décroissante (plus récent en premier)
  const bilansTries = [...bilans].sort((a, b) => b.annee - a.annee)

  // Pondération : 50% année N, 30% année N-1, 20% année N-2
  const poids = [0.5, 0.3, 0.2]
  let somme = 0
  let totalPoids = 0

  for (let i = 0; i < Math.min(bilansTries.length, 3); i++) {
    const ebitda = calculerEbitdaComptable(bilansTries[i])
    somme += ebitda * poids[i]
    totalPoids += poids[i]
  }

  return somme / totalPoids
}

// ============================================
// RETRAITEMENTS INDIVIDUELS
// ============================================

/**
 * Retraitement de la rémunération du dirigeant
 * Si le dirigeant est sur/sous-payé par rapport au marché, on ajuste
 */
export function calculerRetraitementRemuneration(
  chiffreAffaires: number,
  retraitements: DonneesRetraitements
): RetraitementEbitda | null {
  const salaireActuel = retraitements.salaireDirigeantBrutCharge
  const nombreDirigeants = retraitements.nombreDirigeants ?? 1

  if (!salaireActuel) return null

  const salaireNormatif = getSalaireNormatifDirigeant(chiffreAffaires) * nombreDirigeants
  const difference = salaireActuel - salaireNormatif

  // Seuil de matérialité : 10% du salaire normatif
  if (Math.abs(difference) < salaireNormatif * 0.1) return null

  if (difference > 0) {
    // Dirigeant sur-payé → on ajoute la différence à l'EBITDA
    return {
      id: 'remuneration_excess',
      libelle: `Rémunération dirigeant excessive`,
      categorie: 'remuneration',
      montant: difference, // Positif = ajoute à l'EBITDA
      justification: `Salaire actuel (${formatK(salaireActuel)}) supérieur au normatif marché (${formatK(salaireNormatif)})`,
      source: 'utilisateur',
    }
  } else {
    // Dirigeant sous-payé → on retire la différence de l'EBITDA
    return {
      id: 'remuneration_insuffisant',
      libelle: `Rémunération dirigeant insuffisante`,
      categorie: 'remuneration',
      montant: difference, // Négatif = retire de l'EBITDA
      justification: `Salaire actuel (${formatK(salaireActuel)}) inférieur au normatif marché (${formatK(salaireNormatif)})`,
      source: 'utilisateur',
    }
  }
}

/**
 * Retraitement du loyer (si locaux appartiennent au dirigeant)
 */
export function calculerRetraitementLoyer(
  retraitements: DonneesRetraitements
): RetraitementEbitda | null {
  if (!retraitements.loyerAppartientDirigeant) return null
  if (!retraitements.loyerAnnuel || !retraitements.loyerEstimeMarche) return null

  const difference = retraitements.loyerAnnuel - retraitements.loyerEstimeMarche

  // Seuil de matérialité : 10% du loyer marché
  if (Math.abs(difference) < retraitements.loyerEstimeMarche * 0.1) return null

  if (difference > 0) {
    // Loyer au-dessus du marché → on ajoute la différence
    return {
      id: 'loyer_excessif',
      libelle: `Loyer supérieur au marché`,
      categorie: 'loyer',
      montant: difference,
      justification: `Loyer payé (${formatK(retraitements.loyerAnnuel)}) supérieur au marché (${formatK(retraitements.loyerEstimeMarche)})`,
      source: 'utilisateur',
    }
  } else {
    // Loyer en-dessous du marché → on retire la différence
    return {
      id: 'loyer_insuffisant',
      libelle: `Loyer inférieur au marché`,
      categorie: 'loyer',
      montant: difference,
      justification: `Loyer payé (${formatK(retraitements.loyerAnnuel)}) inférieur au marché (${formatK(retraitements.loyerEstimeMarche)})`,
      source: 'utilisateur',
    }
  }
}

/**
 * Retraitement du crédit-bail
 * Les loyers de crédit-bail sont retirés et remplacés par une dépréciation économique
 */
export function calculerRetraitementCreditBail(
  retraitements: DonneesRetraitements
): RetraitementEbitda | null {
  const loyersCreditBail = retraitements.loyersCreditBailAnnuels

  if (!loyersCreditBail || loyersCreditBail === 0) return null

  // On ajoute les loyers de crédit-bail à l'EBITDA
  // (car ils seront traités comme de la dette dans le calcul de la dette nette)
  return {
    id: 'creditbail_reintegration',
    libelle: `Réintégration loyers crédit-bail`,
    categorie: 'creditbail',
    montant: loyersCreditBail,
    justification: `Les loyers de crédit-bail (${formatK(loyersCreditBail)}) sont réintégrés car traités comme dette`,
    source: 'utilisateur',
  }
}

/**
 * Retraitement des éléments exceptionnels (charges)
 */
export function calculerRetraitementChargesExceptionnelles(
  retraitements: DonneesRetraitements
): RetraitementEbitda | null {
  const charges = retraitements.chargesExceptionnelles

  if (!charges || charges === 0) return null

  return {
    id: 'charges_exceptionnelles',
    libelle: `Neutralisation charges exceptionnelles`,
    categorie: 'exceptionnel',
    montant: charges, // Positif = on annule la charge
    justification: retraitements.descriptionChargesExceptionnelles
      ? `Charges non récurrentes : ${retraitements.descriptionChargesExceptionnelles}`
      : `Charges exceptionnelles non récurrentes (${formatK(charges)})`,
    source: 'utilisateur',
  }
}

/**
 * Retraitement des éléments exceptionnels (produits)
 */
export function calculerRetraitementProduitsExceptionnels(
  retraitements: DonneesRetraitements
): RetraitementEbitda | null {
  const produits = retraitements.produitsExceptionnels

  if (!produits || produits === 0) return null

  return {
    id: 'produits_exceptionnels',
    libelle: `Neutralisation produits exceptionnels`,
    categorie: 'exceptionnel',
    montant: -produits, // Négatif = on annule le produit
    justification: retraitements.descriptionProduitsExceptionnels
      ? `Produits non récurrents : ${retraitements.descriptionProduitsExceptionnels}`
      : `Produits exceptionnels non récurrents (${formatK(produits)})`,
    source: 'utilisateur',
  }
}

/**
 * Retraitement des salaires famille (excessifs)
 */
export function calculerRetraitementSalairesFamilleExcessifs(
  retraitements: DonneesRetraitements
): RetraitementEbitda | null {
  const salaires = retraitements.salairesExcessifsFamille

  if (!salaires || salaires === 0) return null

  return {
    id: 'salaires_famille_excessifs',
    libelle: `Salaires famille excessifs`,
    categorie: 'famille',
    montant: salaires, // Positif = on ajoute car charge excessive
    justification: `Partie excessive des salaires versés à la famille (${formatK(salaires)})`,
    source: 'utilisateur',
  }
}

/**
 * Retraitement des salaires famille (insuffisants)
 */
export function calculerRetraitementSalairesFamilleInsuffisants(
  retraitements: DonneesRetraitements
): RetraitementEbitda | null {
  const salaires = retraitements.salairesInsuffisantsFamille

  if (!salaires || salaires === 0) return null

  return {
    id: 'salaires_famille_insuffisants',
    libelle: `Salaires famille insuffisants`,
    categorie: 'famille',
    montant: -salaires, // Négatif = on retire car travail non rémunéré
    justification: `Travail familial non/sous-rémunéré équivalent à (${formatK(salaires)})`,
    source: 'utilisateur',
  }
}

// ============================================
// CALCUL EBITDA NORMALISÉ COMPLET
// ============================================

/**
 * Calcule l'EBITDA normalisé avec tous les retraitements
 */
export function calculerEbitdaNormalise(
  bilans: BilanAnnuel[],
  retraitements: DonneesRetraitements
): EbitdaNormalise {
  // EBITDA comptable (moyenne pondérée)
  const ebitdaComptable = calculerEbitdaComptableMoyen(bilans)

  // Récupérer le CA pour le calcul du salaire normatif
  const bilanRecent = [...bilans].sort((a, b) => b.annee - a.annee)[0]
  const chiffreAffaires = bilanRecent?.chiffreAffaires ?? 0

  // Calculer tous les retraitements
  const retraitementsCalcules: RetraitementEbitda[] = []

  const ajouterSiPresent = (r: RetraitementEbitda | null) => {
    if (r) retraitementsCalcules.push(r)
  }

  // Rémunération dirigeant
  ajouterSiPresent(calculerRetraitementRemuneration(chiffreAffaires, retraitements))

  // Loyer
  ajouterSiPresent(calculerRetraitementLoyer(retraitements))

  // Crédit-bail
  ajouterSiPresent(calculerRetraitementCreditBail(retraitements))

  // Éléments exceptionnels
  ajouterSiPresent(calculerRetraitementChargesExceptionnelles(retraitements))
  ajouterSiPresent(calculerRetraitementProduitsExceptionnels(retraitements))

  // Salaires famille
  ajouterSiPresent(calculerRetraitementSalairesFamilleExcessifs(retraitements))
  ajouterSiPresent(calculerRetraitementSalairesFamilleInsuffisants(retraitements))

  // Total des retraitements
  const totalRetraitements = retraitementsCalcules.reduce((sum, r) => sum + r.montant, 0)

  // EBITDA normalisé
  const ebitdaNormalise = ebitdaComptable + totalRetraitements

  // Générer l'explication
  const explication = genererExplicationRetraitements(
    ebitdaComptable,
    retraitementsCalcules,
    ebitdaNormalise
  )

  return {
    ebitdaComptable,
    retraitements: retraitementsCalcules,
    totalRetraitements,
    ebitdaNormalise,
    explicationRetraitements: explication,
  }
}

// ============================================
// UTILITAIRES
// ============================================

function formatK(montant: number): string {
  if (Math.abs(montant) >= 1_000_000) {
    return `${(montant / 1_000_000).toFixed(1)}M€`
  }
  if (Math.abs(montant) >= 1_000) {
    return `${(montant / 1_000).toFixed(0)}k€`
  }
  return `${montant.toFixed(0)}€`
}

function genererExplicationRetraitements(
  ebitdaComptable: number,
  retraitements: RetraitementEbitda[],
  ebitdaNormalise: number
): string {
  const lignes: string[] = []

  lignes.push(`**EBITDA Comptable** : ${formatK(ebitdaComptable)}`)
  lignes.push('')

  if (retraitements.length === 0) {
    lignes.push('Aucun retraitement appliqué.')
    lignes.push('')
    lignes.push(`**EBITDA Normalisé** : ${formatK(ebitdaNormalise)}`)
    return lignes.join('\n')
  }

  lignes.push('**Retraitements appliqués :**')
  lignes.push('')

  // Grouper par catégorie
  const parCategorie = new Map<CategorieRetraitement, RetraitementEbitda[]>()
  for (const r of retraitements) {
    const liste = parCategorie.get(r.categorie) ?? []
    liste.push(r)
    parCategorie.set(r.categorie, liste)
  }

  const nomCategorie: Record<CategorieRetraitement, string> = {
    remuneration: 'Rémunération dirigeant',
    loyer: 'Loyer',
    exceptionnel: 'Éléments exceptionnels',
    creditbail: 'Crédit-bail',
    famille: 'Salaires famille',
    autre: 'Autres',
  }

  for (const [categorie, items] of parCategorie) {
    lignes.push(`*${nomCategorie[categorie]}* :`)
    for (const r of items) {
      const signe = r.montant >= 0 ? '+' : ''
      lignes.push(`  - ${r.libelle} : ${signe}${formatK(r.montant)}`)
      lignes.push(`    ${r.justification}`)
    }
    lignes.push('')
  }

  const totalRetraitements = retraitements.reduce((s, r) => s + r.montant, 0)
  const signeTotal = totalRetraitements >= 0 ? '+' : ''
  lignes.push(`**Total retraitements** : ${signeTotal}${formatK(totalRetraitements)}`)
  lignes.push('')
  lignes.push(`**EBITDA Normalisé** : ${formatK(ebitdaNormalise)}`)

  return lignes.join('\n')
}

// ============================================
// EXPORTS
// ============================================

export {
  TRANCHES_SALAIRE_DIRIGEANT,
  formatK,
}
