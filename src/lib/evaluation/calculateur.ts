import type {
  ConfigSecteur,
  DonneesFinancieres,
  FacteursAjustement,
  ResultatEvaluation,
} from './types'
import { detecterSecteurEvaluation, DEFAULT } from './secteurs'
import {
  calculerRetraitementRemuneration,
  calculerRetraitementLoyer,
  calculerRetraitementCreditBail,
  calculerRetraitementChargesExceptionnelles,
  calculerRetraitementProduitsExceptionnels,
  calculerRetraitementSalairesFamilleExcessifs,
  calculerRetraitementSalairesFamilleInsuffisants,
} from './ebitda-normalise'

// ============================================================
// CONSTANTES DE VALORISATION
// ============================================================

/** Taux de rémunération des capitaux propres (rendement sans risque + prime) */
const TAUX_REMUNERATION_CAPITAUX = 0.05

/** Taux de capitalisation par défaut pour la méthode du Goodwill */
const TAUX_CAPITALISATION_GOODWILL = 0.15

/** Taux de capitalisation pour la méthode des praticiens */
const TAUX_CAPITALISATION_PRATICIENS = 0.10

/** Taux d'actualisation par défaut pour le DCF */
const TAUX_ACTUALISATION_DCF = 0.12

/** Taux de croissance long terme pour la valeur terminale (DCF) */
const TAUX_CROISSANCE_LONG_TERME = 0.02

/** Ratio FCF/EBITDA approximatif pour le DCF simplifié */
const RATIO_FCF_EBITDA = 0.7

/** Nombre d'années de projection pour le DCF */
const ANNEES_PROJECTION_DCF = 5

/** Valeur plancher minimale du fonds de commerce (euros) */
const FONDS_COMMERCE_MINIMUM = 5000

/** Pourcentage du CA utilisé comme valorisation plancher */
const POURCENTAGE_CA_PLANCHER = 0.15

// ============================================================
// CLASSIFICATION EV vs EQUITY DES MÉTHODES
// ============================================================
// Les méthodes EV (Enterprise Value) produisent une valeur AVANT déduction de la dette nette.
// Les méthodes Equity produisent directement la valeur des fonds propres (APRÈS dette).
// On ne peut PAS moyenner les deux sans bridge.

/** Méthodes produisant une Valeur d'Entreprise (avant dette nette) */
const METHODES_EV = new Set([
  'multiple_ca', 'multiple_ebitda', 'multiple_arr',
  'dcf', 'fonds_commerce', 'baremes_sante',
  'valeur_flotte', 'valeur_materiel',
])

/** Méthodes produisant une Valeur Equity (après dette nette) */
const METHODES_EQUITY = new Set([
  'actif_net_corrige', 'anc', 'goodwill', 'praticiens',
])

/** Normalise un code méthode pour la classification EV/Equity */
function normaliserCodeMethode(code: string): string {
  return code.toLowerCase().replace(/^mult_/, 'multiple_')
}

/**
 * Calcule la valeur par la méthode des multiples de CA
 */
function calculerMultipleCA(
  donnees: DonneesFinancieres,
  multiples: { min: number; max: number }
): { basse: number; moyenne: number; haute: number; explication: string } {
  const basse = donnees.ca * multiples.min
  const haute = donnees.ca * multiples.max
  const moyenne = (basse + haute) / 2

  return {
    basse,
    moyenne,
    haute,
    explication: `CA de ${formatEuro(donnees.ca)} × multiples de ${multiples.min} à ${multiples.max}`,
  }
}

/**
 * Calcule la valeur par la méthode des multiples d'EBITDA
 */
function calculerMultipleEBITDA(
  donnees: DonneesFinancieres,
  multiples: { min: number; max: number }
): { basse: number; moyenne: number; haute: number; explication: string } {
  const basse = donnees.ebitda * multiples.min
  const haute = donnees.ebitda * multiples.max
  const moyenne = (basse + haute) / 2

  return {
    basse,
    moyenne,
    haute,
    explication: `EBITDA de ${formatEuro(donnees.ebitda)} × multiples de ${multiples.min} à ${multiples.max}`,
  }
}

/**
 * Calcule la valeur par la méthode des multiples d'ARR (SaaS)
 */
function calculerMultipleARR(
  donnees: DonneesFinancieres,
  multiples: { min: number; max: number }
): { basse: number; moyenne: number; haute: number; explication: string } {
  const arr = donnees.arr ? donnees.arr : donnees.mrr ? donnees.mrr * 12 : donnees.ca
  const basse = arr * multiples.min
  const haute = arr * multiples.max
  const moyenne = (basse + haute) / 2

  return {
    basse,
    moyenne,
    haute,
    explication: `ARR de ${formatEuro(arr)} × multiples de ${multiples.min} à ${multiples.max}`,
  }
}

/**
 * Calcule la valeur par la méthode patrimoniale (Actif Net Corrigé)
 */
function calculerActifNetCorrige(
  donnees: DonneesFinancieres
): { basse: number; moyenne: number; haute: number; explication: string } {
  // ANC = capitaux propres (la trésorerie et les dettes sont déjà reflétées dans les CP)
  const anc = donnees.capitauxPropres
  // Fourchette de +/- 10% pour approximer les plus/moins values latentes
  const basse = anc * 0.9
  const haute = anc * 1.1
  const moyenne = anc

  return {
    basse: Math.max(0, basse),
    moyenne: Math.max(0, moyenne),
    haute: Math.max(0, haute),
    explication: `Actif Net Corrigé basé sur capitaux propres (${formatEuro(donnees.capitauxPropres)}) ±10%`,
  }
}

/**
 * Calcule la valeur par la méthode du Goodwill
 */
function calculerGoodwill(
  donnees: DonneesFinancieres,
  tauxCapitalisation: number = TAUX_CAPITALISATION_GOODWILL
): { basse: number; moyenne: number; haute: number; explication: string } {
  // Goodwill = (Résultat net - Rémunération capitaux) / Taux capitalisation
  const remunerationCapitaux = donnees.capitauxPropres * TAUX_REMUNERATION_CAPITAUX
  const superProfit = Math.max(0, donnees.resultatNet - remunerationCapitaux)
  const goodwill = superProfit / tauxCapitalisation
  const anc = donnees.capitauxPropres

  const moyenne = anc + goodwill
  const basse = moyenne * 0.85
  const haute = moyenne * 1.15

  return {
    basse,
    moyenne,
    haute,
    explication: `ANC (${formatEuro(anc)}) + Goodwill (${formatEuro(goodwill)}) basé sur super-profit de ${formatEuro(superProfit)}`,
  }
}

/**
 * Calcule une estimation DCF avec fade period (Fix 4)
 * Phase 1 (5 ans) : croissance court-terme (plafonnée à 50%)
 * Phase 2 (3 ans) : fade linéaire vers le taux long-terme (2%)
 * Valeur terminale : Gordon Growth sur le flux de l'année 8
 */
function calculerDCF(
  donnees: DonneesFinancieres,
  tauxActualisation: number = TAUX_ACTUALISATION_DCF,
): { basse: number; moyenne: number; haute: number; explication: string } {
  const ANNEES_PHASE1 = 5
  const ANNEES_FADE = 3
  const TOTAL_ANNEES = ANNEES_PHASE1 + ANNEES_FADE

  // Plafonner la croissance court-terme à 50% pour éviter les explosions
  const croissanceCourtTerme = Math.min(donnees.croissance || TAUX_CROISSANCE_LONG_TERME, 0.50)
  const fluxBase = donnees.ebitda * RATIO_FCF_EBITDA

  let sommeFlux = 0
  let fluxCourant = fluxBase

  for (let i = 1; i <= TOTAL_ANNEES; i++) {
    let tauxCroissance: number
    if (i <= ANNEES_PHASE1) {
      tauxCroissance = croissanceCourtTerme
    } else {
      // Fade linéaire : interpolation de court-terme vers long-terme
      const fadeProgress = (i - ANNEES_PHASE1) / ANNEES_FADE
      tauxCroissance = croissanceCourtTerme + (TAUX_CROISSANCE_LONG_TERME - croissanceCourtTerme) * fadeProgress
    }
    fluxCourant = fluxCourant * (1 + tauxCroissance)
    sommeFlux += fluxCourant / Math.pow(1 + tauxActualisation, i)
  }

  // Valeur terminale (Gordon Growth Model) sur le flux de l'année 8
  const fluxTerminal = fluxCourant * (1 + TAUX_CROISSANCE_LONG_TERME)
  const denominateur = tauxActualisation - TAUX_CROISSANCE_LONG_TERME
  if (denominateur <= 0.01) {
    return { basse: 0, moyenne: 0, haute: 0, explication: 'DCF non calculable (taux d\'actualisation trop bas)' }
  }
  const valeurTerminale = fluxTerminal / denominateur / Math.pow(1 + tauxActualisation, TOTAL_ANNEES)

  const moyenne = sommeFlux + valeurTerminale
  const basse = moyenne * 0.8
  const haute = moyenne * 1.2

  return {
    basse: Math.max(0, basse),
    moyenne: Math.max(0, moyenne),
    haute: Math.max(0, haute),
    explication: `DCF sur ${TOTAL_ANNEES} ans (${ANNEES_PHASE1}+${ANNEES_FADE} fade), WACC ${(tauxActualisation * 100).toFixed(0)}%, croissance ${(croissanceCourtTerme * 100).toFixed(0)}%→${(TAUX_CROISSANCE_LONG_TERME * 100).toFixed(0)}%`,
  }
}

/**
 * Calcule la valeur du fonds de commerce
 */
function calculerFondsCommerce(
  donnees: DonneesFinancieres,
  pourcentageCA: { min: number; max: number }
): { basse: number; moyenne: number; haute: number; explication: string } {
  const basse = donnees.ca * pourcentageCA.min
  const haute = donnees.ca * pourcentageCA.max
  const moyenne = (basse + haute) / 2

  return {
    basse,
    moyenne,
    haute,
    explication: `Fonds de commerce = ${(pourcentageCA.min * 100).toFixed(0)}% à ${(pourcentageCA.max * 100).toFixed(0)}% du CA (${formatEuro(donnees.ca)})`,
  }
}

/**
 * Calcule la valeur par la méthode des praticiens (moyenne patrimoine + rentabilité)
 */
function calculerPraticiens(
  donnees: DonneesFinancieres
): { basse: number; moyenne: number; haute: number; explication: string } {
  // Valeur patrimoniale = capitaux propres (sans double-comptage)
  const valeurPatrimoniale = Math.max(0, donnees.capitauxPropres)

  // Valeur de rentabilité (capitalisation du résultat)
  const tauxCapitalisation = TAUX_CAPITALISATION_PRATICIENS
  const valeurRentabilite = Math.max(0, donnees.resultatNet / tauxCapitalisation)

  // Moyenne des deux
  const moyenne = (valeurPatrimoniale + valeurRentabilite) / 2
  const basse = moyenne * 0.85
  const haute = moyenne * 1.15

  return {
    basse: Math.max(0, basse),
    moyenne: Math.max(0, moyenne),
    haute: Math.max(0, haute),
    explication: `Méthode des praticiens : (Patrimoine ${formatEuro(valeurPatrimoniale)} + Rentabilité ${formatEuro(valeurRentabilite)}) / 2`,
  }
}

/**
 * Calcule la valeur de la flotte (Transport)
 * Utilise les immobilisations corporelles du bilan si disponibles (Fix 9)
 */
function calculerValeurFlotte(
  donnees: DonneesFinancieres
): { basse: number; moyenne: number; haute: number; explication: string } {
  // Préférer les immobilisations corporelles du bilan si disponibles
  if (donnees.immobilisationsCorporelles && donnees.immobilisationsCorporelles > 0) {
    const valeur = donnees.immobilisationsCorporelles
    const basse = valeur * 0.7
    const haute = valeur * 1.0
    const moyenne = (basse + haute) / 2
    return {
      basse, moyenne, haute,
      explication: `Valeur flotte basée sur immobilisations corporelles (${formatEuro(valeur)}) ×0.7-1.0`,
    }
  }

  // Fallback : approximation basée sur % du CA
  const valeurEstimee = donnees.ca * 0.35
  const basse = valeurEstimee * 0.7
  const haute = valeurEstimee * 1.0
  const moyenne = (basse + haute) / 2
  return {
    basse, moyenne, haute,
    explication: `Valeur flotte estimée à ~35% du CA (${formatEuro(donnees.ca)}) — à affiner avec les données réelles`,
  }
}

/**
 * Calcule la valeur du matériel (BTP)
 * Utilise les immobilisations corporelles du bilan si disponibles (Fix 9)
 */
function calculerValeurMateriel(
  donnees: DonneesFinancieres
): { basse: number; moyenne: number; haute: number; explication: string } {
  // Préférer les immobilisations corporelles du bilan si disponibles
  if (donnees.immobilisationsCorporelles && donnees.immobilisationsCorporelles > 0) {
    const valeur = donnees.immobilisationsCorporelles
    const basse = valeur * 0.6
    const haute = valeur * 1.0
    const moyenne = (basse + haute) / 2
    return {
      basse, moyenne, haute,
      explication: `Valeur matériel basée sur immobilisations corporelles (${formatEuro(valeur)}) ×0.6-1.0`,
    }
  }

  // Fallback : approximation basée sur % du CA
  const valeurEstimee = donnees.ca * 0.20
  const basse = valeurEstimee * 0.6
  const haute = valeurEstimee * 1.0
  const moyenne = (basse + haute) / 2
  return {
    basse, moyenne, haute,
    explication: `Valeur matériel estimée à ~20% du CA (${formatEuro(donnees.ca)}) — à affiner avec les données réelles`,
  }
}

/**
 * Calcule une méthode selon son code
 * Supporte les codes en majuscules et minuscules
 */
function calculerMethode(
  code: string,
  donnees: DonneesFinancieres,
  secteur: ConfigSecteur
): { basse: number; moyenne: number; haute: number; explication: string } | null {
  // Normaliser le code (minuscules, underscores)
  const codeNormalise = code.toLowerCase().replace('mult_', 'multiple_')

  switch (codeNormalise) {
    case 'multiple_ca':
      if (secteur.multiples.ca && donnees.ca > 0) {
        return calculerMultipleCA(donnees, secteur.multiples.ca)
      }
      return null

    case 'multiple_ebitda':
      if (secteur.multiples.ebitda && donnees.ebitda > 0) {
        return calculerMultipleEBITDA(donnees, secteur.multiples.ebitda)
      }
      return null

    case 'multiple_arr':
      if (secteur.multiples.arr) {
        return calculerMultipleARR(donnees, secteur.multiples.arr)
      }
      // Fallback sur CA pour les SaaS sans ARR spécifié
      if (donnees.ca > 0) {
        const multiples = { min: 3, max: 8 }
        return calculerMultipleCA(donnees, multiples)
      }
      return null

    case 'actif_net_corrige':
    case 'anc':
      return calculerActifNetCorrige(donnees)

    case 'goodwill':
      return calculerGoodwill(donnees)

    case 'dcf':
      if (donnees.ebitda > 0) {
        return calculerDCF(donnees)
      }
      return null

    case 'fonds_commerce':
      // Pour fonds de commerce, on utilise le multiple de CA
      if (secteur.multiples.ca && donnees.ca > 0) {
        return calculerFondsCommerce(donnees, secteur.multiples.ca)
      }
      return null

    case 'praticiens':
      return calculerPraticiens(donnees)

    case 'valeur_flotte':
      if (donnees.ca > 0) {
        return calculerValeurFlotte(donnees)
      }
      return null

    case 'valeur_materiel':
      if (donnees.ca > 0) {
        return calculerValeurMateriel(donnees)
      }
      return null

    case 'baremes_sante':
      // Barèmes spécifiques santé (ex: pharmacies)
      if (secteur.multiples.ca && donnees.ca > 0) {
        return calculerFondsCommerce(donnees, secteur.multiples.ca)
      }
      return null

    default:
      console.warn(`Méthode non reconnue: ${code} (normalisé: ${codeNormalise})`)
      return null
  }
}

/**
 * Calcule les ajustements basés sur les facteurs actifs
 */
function calculerAjustements(
  secteur: ConfigSecteur,
  facteurs: FacteursAjustement,
  valorisationBase: number = 0
): { facteur: string; impact: number; raison: string }[] {
  const ajustements: { facteur: string; impact: number; raison: string }[] = []

  // Primes
  for (const primeId of facteurs.primes) {
    const facteur = secteur.facteursPrime.find((f) => f.id === primeId)
    if (facteur) {
      const parsed = parseImpact(facteur.impact)
      const impact = impactToDecimal(parsed, valorisationBase)
      ajustements.push({
        facteur: facteur.description,
        impact,
        raison: `Prime: ${facteur.description}`,
      })
    }
  }

  // Décotes
  for (const decoteId of facteurs.decotes) {
    const facteur = secteur.facteursDecote.find((f) => f.id === decoteId)
    if (facteur) {
      const parsed = parseImpact(facteur.impact)
      const impact = impactToDecimal(parsed, valorisationBase)
      ajustements.push({
        facteur: facteur.description,
        impact,
        raison: `Décote: ${facteur.description}`,
      })
    }
  }

  return ajustements
}

/**
 * Résultat structuré du parsing d'un impact (Fix 5)
 */
interface ImpactParse {
  type: 'percentage' | 'absolute' | 'percentage_on_target' | 'special'
  value: number
  target?: string
}

/**
 * Parse un impact sous différents formats vers un objet structuré.
 * Supporte:
 * - "+10%", "-15%", "+10 à +20%", "-15 à -25%" → percentage
 * - "+10 000 à +30 000€" → absolute (EUR)
 * - "+50 à +100% sur le multiple" → percentage_on_target
 * - "+valeur de marché" → special (ignoré)
 */
function parseImpact(impact: string): ImpactParse {
  // 1. Valeur absolue EUR (range) : "+10 000 à +30 000€" ou "+10000 à +30000EUR"
  const absoluteRangeMatch = impact.match(/([+-]?[\d\s]+)\s*(?:à|a)\s*([+-]?[\d\s]+)\s*[€E]/)
  if (absoluteRangeMatch) {
    const val1 = parseInt(absoluteRangeMatch[1].replace(/\s/g, ''), 10)
    const val2 = parseInt(absoluteRangeMatch[2].replace(/\s/g, ''), 10)
    return { type: 'absolute', value: (val1 + val2) / 2 }
  }

  // 2. Pourcentage sur cible spécifique : "+50 à +100% sur le multiple"
  const targetRangeMatch = impact.match(/([+-]?\d+)\s*(?:à|a)\s*([+-]?\d+)\s*%\s+sur\s+(?:le\s+)?(.+)/)
  if (targetRangeMatch) {
    const val1 = parseInt(targetRangeMatch[1], 10)
    const val2 = parseInt(targetRangeMatch[2], 10)
    return { type: 'percentage_on_target', value: ((val1 + val2) / 2) / 100, target: targetRangeMatch[3].trim() }
  }

  // 3. Range pourcentage standard : "+10 à +20%"
  const rangeMatch = impact.match(/([+-]?\d+)\s*(?:à|a)\s*([+-]?\d+)\s*%/)
  if (rangeMatch) {
    const val1 = parseInt(rangeMatch[1], 10)
    const val2 = parseInt(rangeMatch[2], 10)
    return { type: 'percentage', value: ((val1 + val2) / 2) / 100 }
  }

  // 4. Pourcentage simple : "+10%" ou "-15%"
  const simpleMatch = impact.match(/([+-]?\d+)\s*%/)
  if (simpleMatch) {
    return { type: 'percentage', value: parseInt(simpleMatch[1], 10) / 100 }
  }

  // 5. Valeur absolue simple : "+50 000€"
  const absoluteSingleMatch = impact.match(/([+-]?[\d\s]+)\s*[€E]/)
  if (absoluteSingleMatch) {
    return { type: 'absolute', value: parseInt(absoluteSingleMatch[1].replace(/\s/g, ''), 10) }
  }

  // 6. Texte spécial non parsable ("+valeur de marché" etc.)
  return { type: 'special', value: 0 }
}

/**
 * Convertit un ImpactParse en pourcentage décimal pour application à la valorisation.
 * Les impacts absolus sont convertis en % de la valorisation de base.
 * Les impacts ciblés sont modérés (appliqués à ~50% car ils visent un sous-composant).
 */
function impactToDecimal(parsed: ImpactParse, valorisationBase: number): number {
  switch (parsed.type) {
    case 'percentage':
      return parsed.value
    case 'absolute':
      return valorisationBase > 0 ? parsed.value / valorisationBase : 0
    case 'percentage_on_target':
      // "sur le multiple" ou "sur le stock" = impact partiel, on modère à 50%
      return parsed.value * 0.5
    case 'special':
    default:
      return 0
  }
}

/**
 * Formate un nombre en euros
 */
function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Calcule une valorisation plancher basée sur les actifs minimum
 * RÈGLE : On ne retourne JAMAIS 0€ sans explication
 */
function calculerValorisationPlancher(
  donnees: DonneesFinancieres,
  _secteur: ConfigSecteur
): { valeur: number; explication: string } {
  // Approche corrigée : les CP incluent déjà la trésorerie et les dettes,
  // donc on ne les additionne pas séparément (évite le double-comptage)
  const elements: string[] = []

  // Option A : Capitaux propres (reflètent déjà actifs nets y compris trésorerie)
  const cpValue = Math.max(0, donnees.capitauxPropres)

  // Option B : Fonds de commerce minimum
  const fondsCommerceMinimum = FONDS_COMMERCE_MINIMUM

  // Option C : % du CA si l'activité existe mais est déficitaire
  const caFloor = donnees.ca > 0 && donnees.ebitda <= 0
    ? donnees.ca * POURCENTAGE_CA_PLANCHER
    : 0

  // Prendre le maximum des approches
  let valeurPlancher = Math.max(cpValue, fondsCommerceMinimum, caFloor)

  if (valeurPlancher === cpValue && cpValue > fondsCommerceMinimum && cpValue > caFloor) {
    elements.push(`Capitaux propres: ${formatEuro(cpValue)}`)
  } else if (valeurPlancher === caFloor && caFloor > 0) {
    elements.push(`Valorisation minimale (${(POURCENTAGE_CA_PLANCHER * 100).toFixed(0)}% CA): ${formatEuro(caFloor)}`)
  } else {
    elements.push(`Fonds de commerce minimum: ${formatEuro(fondsCommerceMinimum)}`)
  }

  return {
    valeur: Math.round(valeurPlancher),
    explication: elements.length > 0
      ? `Valorisation plancher basée sur: ${elements.join(', ')}`
      : `Valorisation symbolique du fonds de commerce`,
  }
}

/**
 * Fonction principale d'évaluation
 */
export function evaluerEntreprise(
  codeNaf: string,
  donnees: DonneesFinancieres,
  facteurs: FacteursAjustement = { primes: [], decotes: [] }
): ResultatEvaluation {
  // Détecter le secteur
  const secteur = detecterSecteurEvaluation(codeNaf)

  // ============================================================
  // ÉTAPE 0 : Préparer les données effectives
  // ============================================================

  // 0a. Moyenne pondérée multi-annuelle si historique disponible (Fix 10)
  let donneesEffectives = { ...donnees }
  if (donnees.historique && donnees.historique.length > 0) {
    const sorted = [...donnees.historique].sort((a, b) => b.annee - a.annee)
    const poids = [3, 2, 1] // N, N-1, N-2
    let sommeCA = 0, sommeEBITDA = 0, sommeRN = 0, totalPoids = 0
    for (let i = 0; i < Math.min(sorted.length, 3); i++) {
      sommeCA += sorted[i].ca * poids[i]
      sommeEBITDA += sorted[i].ebitda * poids[i]
      sommeRN += sorted[i].resultatNet * poids[i]
      totalPoids += poids[i]
    }
    donneesEffectives.ca = sommeCA / totalPoids
    donneesEffectives.ebitda = sommeEBITDA / totalPoids
    donneesEffectives.resultatNet = sommeRN / totalPoids
  }

  // 0b. Normalisation EBITDA si retraitements fournis (Fix 2)
  let ebitdaNormaliseValue: number | undefined
  if (donneesEffectives.retraitements) {
    const r = donneesEffectives.retraitements
    let totalAjustement = 0
    const ajouterSiPresent = (ret: { montant: number } | null) => {
      if (ret) totalAjustement += ret.montant
    }
    ajouterSiPresent(calculerRetraitementRemuneration(donneesEffectives.ca, r))
    ajouterSiPresent(calculerRetraitementLoyer(r))
    ajouterSiPresent(calculerRetraitementCreditBail(r))
    ajouterSiPresent(calculerRetraitementChargesExceptionnelles(r))
    ajouterSiPresent(calculerRetraitementProduitsExceptionnels(r))
    ajouterSiPresent(calculerRetraitementSalairesFamilleExcessifs(r))
    ajouterSiPresent(calculerRetraitementSalairesFamilleInsuffisants(r))
    ebitdaNormaliseValue = donneesEffectives.ebitda + totalAjustement
    donneesEffectives = { ...donneesEffectives, ebitda: ebitdaNormaliseValue }
  }

  // Calculer chaque méthode
  const resultatsMethodes: {
    nom: string
    valeur: number
    poids: number
    explication: string
  }[] = []

  // Calculer chaque méthode une seule fois et stocker les résultats complets
  const resultatsComplets: { methode: typeof secteur.methodes[0]; resultat: NonNullable<ReturnType<typeof calculerMethode>> }[] = []

  for (const methode of secteur.methodes) {
    const resultat = calculerMethode(methode.code, donneesEffectives, secteur)
    if (resultat && resultat.moyenne > 0) {
      resultatsComplets.push({ methode, resultat })
    }
  }

  // Renormaliser les poids quand des méthodes sont exclues (EBITDA null, etc.)
  const poidsActifs = resultatsComplets.reduce((s, rc) => s + rc.methode.poids, 0)
  const facteurRenorm = poidsActifs > 0 ? 100 / poidsActifs : 1

  for (const { methode, resultat } of resultatsComplets) {
    const poidsNorm = Math.round(methode.poids * facteurRenorm)
    resultatsMethodes.push({
      nom: methode.nom,
      valeur: resultat.moyenne,
      poids: poidsNorm,
      explication: resultat.explication,
    })
  }

  // ============================================================
  // ÉTAPE 2 : Bridge VE → Equity (Fix 1)
  // Séparer méthodes EV et Equity, appliquer la dette nette
  // ============================================================

  const detteNette = donneesEffectives.dettes - donneesEffectives.tresorerie

  // Grouper par type (EV vs Equity)
  let evBasse = 0, evMoyenne = 0, evHaute = 0, evPoids = 0
  let eqBasse = 0, eqMoyenne = 0, eqHaute = 0, eqPoids = 0

  for (const { methode, resultat } of resultatsComplets) {
    const codeNorm = normaliserCodeMethode(methode.code)
    if (METHODES_EQUITY.has(codeNorm)) {
      eqBasse += resultat.basse * methode.poids
      eqMoyenne += resultat.moyenne * methode.poids
      eqHaute += resultat.haute * methode.poids
      eqPoids += methode.poids
    } else {
      // Par défaut EV (inclut METHODES_EV + tout code non classifié)
      evBasse += resultat.basse * methode.poids
      evMoyenne += resultat.moyenne * methode.poids
      evHaute += resultat.haute * methode.poids
      evPoids += methode.poids
    }
  }

  // Calculer les moyennes pondérées de chaque groupe
  let equityFromEV_B = 0, equityFromEV_M = 0, equityFromEV_H = 0
  let veB = 0, veM = 0, veH = 0
  if (evPoids > 0) {
    const f = 100 / evPoids
    veB = (evBasse * f) / 100
    veM = (evMoyenne * f) / 100
    veH = (evHaute * f) / 100
    // Bridge : Equity = VE - Dette Nette
    equityFromEV_B = veB - detteNette
    equityFromEV_M = veM - detteNette
    equityFromEV_H = veH - detteNette
  }

  let directEq_B = 0, directEq_M = 0, directEq_H = 0
  if (eqPoids > 0) {
    const f = 100 / eqPoids
    directEq_B = (eqBasse * f) / 100
    directEq_M = (eqMoyenne * f) / 100
    directEq_H = (eqHaute * f) / 100
  }

  // Blender EV-derived equity et direct equity selon leurs poids respectifs
  const totalPoids = evPoids + eqPoids
  let valorisationBasse = 0, valorisationMoyenne = 0, valorisationHaute = 0

  if (totalPoids > 0) {
    valorisationBasse = (equityFromEV_B * evPoids + directEq_B * eqPoids) / totalPoids
    valorisationMoyenne = (equityFromEV_M * evPoids + directEq_M * eqPoids) / totalPoids
    valorisationHaute = (equityFromEV_H * evPoids + directEq_H * eqPoids) / totalPoids
  }

  // Appliquer les ajustements (avec plafond, Fix 6)
  const ajustements = calculerAjustements(secteur, facteurs, valorisationMoyenne)

  // Plafond conforme au prompt base.ts : primes max +50%, décotes max -45%
  const CAP_PRIMES = 0.50
  const CAP_DECOTES = -0.45
  const totalPrimes = Math.min(
    ajustements.filter(a => a.impact > 0).reduce((s, a) => s + a.impact, 0),
    CAP_PRIMES
  )
  const totalDecotes = Math.max(
    ajustements.filter(a => a.impact < 0).reduce((s, a) => s + a.impact, 0),
    CAP_DECOTES
  )
  const totalAjustement = totalPrimes + totalDecotes

  valorisationBasse *= 1 + totalAjustement
  valorisationMoyenne *= 1 + totalAjustement
  valorisationHaute *= 1 + totalAjustement

  // RÈGLE CRITIQUE : Garantir une valorisation minimale JAMAIS à 0€
  const plancher = calculerValorisationPlancher(donneesEffectives, secteur)
  let utilisePlancher = false

  if (valorisationMoyenne <= 0 || isNaN(valorisationMoyenne)) {
    // Cas extrême : moyenne négative/nulle → remplacer entièrement par le plancher
    valorisationBasse = plancher.valeur * 0.8
    valorisationMoyenne = plancher.valeur
    valorisationHaute = plancher.valeur * 1.2
    utilisePlancher = true

    // Remplacer les méthodes par le plancher seul (les méthodes classiques n'ont pas donné de résultat exploitable)
    resultatsMethodes.length = 0
    resultatsMethodes.push({
      nom: 'Valorisation plancher',
      valeur: plancher.valeur,
      poids: 100,
      explication: plancher.explication,
    })
  } else if (valorisationBasse <= 0) {
    // Cas bridge : basse négative mais moyenne positive → clamp basse au plancher
    valorisationBasse = Math.min(plancher.valeur, valorisationMoyenne * 0.5)
    utilisePlancher = true
  }

  // S'assurer que les valeurs sont positives et arrondies
  valorisationBasse = Math.max(1, Math.round(valorisationBasse))
  valorisationMoyenne = Math.max(valorisationBasse, Math.round(valorisationMoyenne))
  valorisationHaute = Math.max(valorisationMoyenne, Math.round(valorisationHaute))

  // Générer l'explication
  let explicationComplete = genererExplication(secteur, resultatsMethodes, ajustements, {
    basse: valorisationBasse,
    moyenne: valorisationMoyenne,
    haute: valorisationHaute,
  })

  // Ajouter une note si on utilise le plancher
  if (utilisePlancher) {
    explicationComplete += `\n\n⚠️ **Note importante** : Les méthodes classiques ne donnent pas de résultat exploitable (données manquantes ou situation déficitaire). La valorisation est basée sur les actifs disponibles et une valeur plancher du fonds de commerce. Cette estimation devra être affinée avec des données complémentaires.`
  }

  return {
    secteur,
    valorisation: {
      basse: valorisationBasse,
      moyenne: valorisationMoyenne,
      haute: valorisationHaute,
    },
    methodes: resultatsMethodes,
    ajustements,
    explicationComplete,
    valeurEntreprise: evPoids > 0 ? { basse: veB, moyenne: veM, haute: veH } : undefined,
    detteNette: evPoids > 0 ? detteNette : undefined,
    ebitdaNormalise: ebitdaNormaliseValue,
  }
}

/**
 * Génère une explication pédagogique de l'évaluation
 */
function genererExplication(
  secteur: ConfigSecteur,
  methodes: { nom: string; valeur: number; poids: number; explication: string }[],
  ajustements: { facteur: string; impact: number; raison: string }[],
  valorisation: { basse: number; moyenne: number; haute: number }
): string {
  let explication = `## Évaluation - Secteur ${secteur.nom}\n\n`

  explication += `### Contexte sectoriel\n${secteur.explicationSecteur}\n\n`

  explication += `### Méthodologie retenue\n${secteur.explicationMethodes}\n\n`

  explication += `### Détail des méthodes\n`
  for (const methode of methodes) {
    explication += `- **${methode.nom}** (poids ${methode.poids}%): ${formatEuro(methode.valeur)}\n`
    explication += `  _${methode.explication}_\n`
  }
  explication += '\n'

  if (ajustements.length > 0) {
    explication += `### Ajustements appliqués\n`
    for (const ajustement of ajustements) {
      const signe = ajustement.impact >= 0 ? '+' : ''
      explication += `- ${ajustement.facteur}: ${signe}${(ajustement.impact * 100).toFixed(0)}%\n`
    }
    explication += '\n'
  }

  explication += `### Fourchette de valorisation\n`
  explication += `- **Basse**: ${formatEuro(valorisation.basse)}\n`
  explication += `- **Moyenne**: ${formatEuro(valorisation.moyenne)}\n`
  explication += `- **Haute**: ${formatEuro(valorisation.haute)}\n`

  return explication
}

/**
 * Évalue rapidement avec les données de base (pour l'interface)
 */
export function evaluerRapide(
  codeNaf: string,
  ca: number,
  ebitda: number,
  resultatNet: number
): { basse: number; moyenne: number; haute: number; secteur: string } {
  const donnees: DonneesFinancieres = {
    ca,
    ebitda,
    resultatNet,
    capitauxPropres: 0,
    actifNet: 0,
    tresorerie: 0,
    dettes: 0,
  }

  const resultat = evaluerEntreprise(codeNaf, donnees)

  return {
    basse: resultat.valorisation.basse,
    moyenne: resultat.valorisation.moyenne,
    haute: resultat.valorisation.haute,
    secteur: resultat.secteur.nom,
  }
}

/**
 * Retourne les questions à poser pour un secteur donné
 */
export function getQuestionsParSecteur(codeNaf: string): string[] {
  const secteur = detecterSecteurEvaluation(codeNaf)
  return secteur.questions
}

/**
 * Retourne les facteurs de prime/décote pour un secteur
 */
export function getFacteursParSecteur(codeNaf: string): {
  primes: ConfigSecteur['facteursPrime']
  decotes: ConfigSecteur['facteursDecote']
} {
  const secteur = detecterSecteurEvaluation(codeNaf)
  return {
    primes: secteur.facteursPrime,
    decotes: secteur.facteursDecote,
  }
}

// Export du DEFAULT pour référence
export { DEFAULT }
