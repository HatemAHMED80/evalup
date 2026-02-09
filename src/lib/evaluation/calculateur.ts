import type {
  ConfigSecteur,
  DonneesFinancieres,
  FacteursAjustement,
  ResultatEvaluation,
} from './types'
import { detecterSecteurEvaluation, DEFAULT } from './secteurs'

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
  const arr = donnees.arr || donnees.mrr ? (donnees.mrr || 0) * 12 : donnees.ca
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
  // Actif net corrigé = capitaux propres ajustés
  const anc = donnees.capitauxPropres + donnees.tresorerie - donnees.dettes
  // Fourchette de +/- 10%
  const basse = anc * 0.9
  const haute = anc * 1.1
  const moyenne = anc

  return {
    basse: Math.max(0, basse),
    moyenne: Math.max(0, moyenne),
    haute: Math.max(0, haute),
    explication: `Capitaux propres (${formatEuro(donnees.capitauxPropres)}) + trésorerie (${formatEuro(donnees.tresorerie)}) - dettes (${formatEuro(donnees.dettes)})`,
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
 * Calcule une estimation DCF simplifiée
 */
function calculerDCF(
  donnees: DonneesFinancieres,
  tauxActualisation: number = TAUX_ACTUALISATION_DCF,
  anneesProjection: number = ANNEES_PROJECTION_DCF
): { basse: number; moyenne: number; haute: number; explication: string } {
  const croissance = donnees.croissance || TAUX_CROISSANCE_LONG_TERME
  const fluxBase = donnees.ebitda * RATIO_FCF_EBITDA

  let sommeFlux = 0
  for (let i = 1; i <= anneesProjection; i++) {
    const flux = fluxBase * Math.pow(1 + croissance, i)
    sommeFlux += flux / Math.pow(1 + tauxActualisation, i)
  }

  // Valeur terminale
  const fluxTerminal = fluxBase * Math.pow(1 + croissance, anneesProjection + 1)
  const valeurTerminale =
    fluxTerminal / (tauxActualisation - TAUX_CROISSANCE_LONG_TERME) / Math.pow(1 + tauxActualisation, anneesProjection)

  const moyenne = sommeFlux + valeurTerminale
  const basse = moyenne * 0.8
  const haute = moyenne * 1.2

  return {
    basse: Math.max(0, basse),
    moyenne: Math.max(0, moyenne),
    haute: Math.max(0, haute),
    explication: `DCF sur ${anneesProjection} ans, taux d'actualisation ${(tauxActualisation * 100).toFixed(0)}%, croissance ${(croissance * 100).toFixed(0)}%`,
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
  // Valeur patrimoniale
  const valeurPatrimoniale = Math.max(0, donnees.capitauxPropres + donnees.tresorerie - donnees.dettes)

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
 */
function calculerValeurFlotte(
  donnees: DonneesFinancieres
): { basse: number; moyenne: number; haute: number; explication: string } {
  // Approximation basée sur les immobilisations (si disponibles) ou % du CA
  // Pour le transport, la flotte représente généralement 30-50% du CA en valeur
  const valeurEstimee = donnees.ca * 0.35
  const basse = valeurEstimee * 0.7
  const haute = valeurEstimee * 1.0
  const moyenne = (basse + haute) / 2

  return {
    basse,
    moyenne,
    haute,
    explication: `Valeur flotte estimée à ~35% du CA (${formatEuro(donnees.ca)})`,
  }
}

/**
 * Calcule la valeur du matériel (BTP)
 */
function calculerValeurMateriel(
  donnees: DonneesFinancieres
): { basse: number; moyenne: number; haute: number; explication: string } {
  // Approximation basée sur le CA - dans le BTP, le matériel représente ~15-25% du CA
  const valeurEstimee = donnees.ca * 0.20
  const basse = valeurEstimee * 0.6
  const haute = valeurEstimee * 1.0
  const moyenne = (basse + haute) / 2

  return {
    basse,
    moyenne,
    haute,
    explication: `Valeur matériel estimée à ~20% du CA (${formatEuro(donnees.ca)})`,
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
  facteurs: FacteursAjustement
): { facteur: string; impact: number; raison: string }[] {
  const ajustements: { facteur: string; impact: number; raison: string }[] = []

  // Primes
  for (const primeId of facteurs.primes) {
    const facteur = secteur.facteursPrime.find((f) => f.id === primeId)
    if (facteur) {
      const impact = parseImpact(facteur.impact)
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
      const impact = parseImpact(facteur.impact)
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
 * Parse un impact du format "+10%" ou "-15%" vers un nombre (0.10 ou -0.15)
 */
function parseImpact(impact: string): number {
  const match = impact.match(/([+-]?)(\d+)%/)
  if (match) {
    const sign = match[1] === '-' ? -1 : 1
    const value = parseInt(match[2], 10) / 100
    return sign * value
  }
  return 0
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
  const elements: string[] = []
  let valeurPlancher = 0

  // 1. Trésorerie disponible (actif liquide)
  if (donnees.tresorerie > 0) {
    valeurPlancher += donnees.tresorerie
    elements.push(`Trésorerie: ${formatEuro(donnees.tresorerie)}`)
  }

  // 2. Capitaux propres positifs
  if (donnees.capitauxPropres > 0) {
    const cpNets = Math.max(0, donnees.capitauxPropres - donnees.dettes)
    if (cpNets > 0) {
      valeurPlancher += cpNets * 0.5 // 50% des capitaux propres nets
      elements.push(`Capitaux propres nets (50%): ${formatEuro(cpNets * 0.5)}`)
    }
  }

  // 3. Fonds de commerce minimum (même sans CA, le nom et la structure ont une valeur)
  const fondsCommerceMinimum = FONDS_COMMERCE_MINIMUM
  if (valeurPlancher < fondsCommerceMinimum) {
    valeurPlancher = fondsCommerceMinimum
    elements.push(`Fonds de commerce minimum: ${formatEuro(fondsCommerceMinimum)}`)
  }

  // 4. Si CA disponible mais EBITDA négatif, on valorise quand même à un % du CA
  if (donnees.ca > 0 && donnees.ebitda <= 0) {
    const valeurCA = donnees.ca * POURCENTAGE_CA_PLANCHER
    if (valeurCA > valeurPlancher) {
      valeurPlancher = valeurCA
      elements.push(`Valorisation minimale (15% CA): ${formatEuro(valeurCA)}`)
    }
  }

  return {
    valeur: Math.round(valeurPlancher),
    explication: elements.length > 0
      ? `Valorisation plancher basée sur: ${elements.join(' + ')}`
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

  // Calculer chaque méthode
  const resultatsMethodes: {
    nom: string
    valeur: number
    poids: number
    explication: string
  }[] = []

  for (const methode of secteur.methodes) {
    const resultat = calculerMethode(methode.code, donnees, secteur)
    if (resultat && resultat.moyenne > 0) {
      resultatsMethodes.push({
        nom: methode.nom,
        valeur: resultat.moyenne,
        poids: methode.poids,
        explication: resultat.explication,
      })
    }
  }

  // Calculer la moyenne pondérée
  let sommeValeursBassesPonderees = 0
  let sommeValeursMoyennesPonderees = 0
  let sommeValeursHautesPonderees = 0
  let sommePoids = 0

  for (const methode of secteur.methodes) {
    const resultat = calculerMethode(methode.code, donnees, secteur)
    if (resultat && resultat.moyenne > 0) {
      sommeValeursBassesPonderees += resultat.basse * methode.poids
      sommeValeursMoyennesPonderees += resultat.moyenne * methode.poids
      sommeValeursHautesPonderees += resultat.haute * methode.poids
      sommePoids += methode.poids
    }
  }

  // Normaliser si les poids ne font pas 100
  const facteurNormalisation = sommePoids > 0 ? 100 / sommePoids : 1
  let valorisationBasse = sommePoids > 0 ? (sommeValeursBassesPonderees * facteurNormalisation) / 100 : 0
  let valorisationMoyenne = sommePoids > 0 ? (sommeValeursMoyennesPonderees * facteurNormalisation) / 100 : 0
  let valorisationHaute = sommePoids > 0 ? (sommeValeursHautesPonderees * facteurNormalisation) / 100 : 0

  // Appliquer les ajustements
  const ajustements = calculerAjustements(secteur, facteurs)
  let totalAjustement = 0
  for (const ajustement of ajustements) {
    totalAjustement += ajustement.impact
  }

  valorisationBasse *= 1 + totalAjustement
  valorisationMoyenne *= 1 + totalAjustement
  valorisationHaute *= 1 + totalAjustement

  // RÈGLE CRITIQUE : Garantir une valorisation minimale JAMAIS à 0€
  const plancher = calculerValorisationPlancher(donnees, secteur)
  let utilisePlancher = false

  if (valorisationMoyenne <= 0 || isNaN(valorisationMoyenne)) {
    valorisationBasse = plancher.valeur * 0.8
    valorisationMoyenne = plancher.valeur
    valorisationHaute = plancher.valeur * 1.2
    utilisePlancher = true

    // Ajouter l'explication du plancher aux méthodes
    resultatsMethodes.push({
      nom: 'Valorisation plancher',
      valeur: plancher.valeur,
      poids: 100,
      explication: plancher.explication,
    })
  }

  // S'assurer que les valeurs sont positives
  valorisationBasse = Math.max(1, Math.round(valorisationBasse))
  valorisationMoyenne = Math.max(1, Math.round(valorisationMoyenne))
  valorisationHaute = Math.max(1, Math.round(valorisationHaute))

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
