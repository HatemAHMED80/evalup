// Calculateur d'évaluation V2
// Conforme aux règles de l'art : VE - Dette Nette = Prix de Cession

import type {
  ConfigSecteur,
  DonneesEvaluationV2,
  ResultatEvaluationV2,
  ResultatMethode,
  CategorieMethode,
  FourchetteValorisation,
  BridgeValorisation,
  AjustementQualitatif,
  NiveauConfiance,
} from './types'

import { calculerEbitdaNormalise, calculerEbitdaComptableMoyen } from './ebitda-normalise'
import { calculerDetteNette, genererExplicationDetteNette } from './dette-nette'
import { detecterSecteurEvaluation } from './secteurs'

// ============================================
// CALCUL DES MÉTHODES DE VALORISATION
// ============================================

interface ResultatMethodeCalcul {
  valeurBasse: number
  valeurMoyenne: number
  valeurHaute: number
  agregat: string
  valeurAgregat: number
  multiple?: number
  formule: string
}

/**
 * Multiple d'EBITDA normalisé
 */
function calculerMultipleEbitda(
  ebitdaNormalise: number,
  multiples: { min: number; max: number }
): ResultatMethodeCalcul {
  const valeurBasse = ebitdaNormalise * multiples.min
  const valeurHaute = ebitdaNormalise * multiples.max
  const valeurMoyenne = (valeurBasse + valeurHaute) / 2
  const multipleMedian = (multiples.min + multiples.max) / 2

  return {
    valeurBasse,
    valeurMoyenne,
    valeurHaute,
    agregat: 'EBITDA normalisé',
    valeurAgregat: ebitdaNormalise,
    multiple: multipleMedian,
    formule: `${formatK(ebitdaNormalise)} × ${multiples.min}-${multiples.max}x`,
  }
}

/**
 * Multiple de Chiffre d'Affaires
 */
function calculerMultipleCA(
  ca: number,
  multiples: { min: number; max: number }
): ResultatMethodeCalcul {
  const valeurBasse = ca * multiples.min
  const valeurHaute = ca * multiples.max
  const valeurMoyenne = (valeurBasse + valeurHaute) / 2
  const multipleMedian = (multiples.min + multiples.max) / 2

  return {
    valeurBasse,
    valeurMoyenne,
    valeurHaute,
    agregat: 'Chiffre d\'affaires',
    valeurAgregat: ca,
    multiple: multipleMedian,
    formule: `${formatK(ca)} × ${(multiples.min * 100).toFixed(0)}%-${(multiples.max * 100).toFixed(0)}%`,
  }
}

/**
 * Multiple d'ARR (pour SaaS)
 */
function calculerMultipleARR(
  arr: number,
  multiples: { min: number; max: number }
): ResultatMethodeCalcul {
  const valeurBasse = arr * multiples.min
  const valeurHaute = arr * multiples.max
  const valeurMoyenne = (valeurBasse + valeurHaute) / 2
  const multipleMedian = (multiples.min + multiples.max) / 2

  return {
    valeurBasse,
    valeurMoyenne,
    valeurHaute,
    agregat: 'ARR',
    valeurAgregat: arr,
    multiple: multipleMedian,
    formule: `${formatK(arr)} × ${multiples.min}-${multiples.max}x`,
  }
}

/**
 * Méthode de l'Actif Net Corrigé
 */
function calculerActifNetCorrige(
  capitauxPropres: number,
  tresorerie: number,
  dettes: number
): ResultatMethodeCalcul {
  const anc = Math.max(0, capitauxPropres)
  const valeurBasse = anc * 0.9
  const valeurHaute = anc * 1.1
  const valeurMoyenne = anc

  return {
    valeurBasse,
    valeurMoyenne,
    valeurHaute,
    agregat: 'Capitaux propres',
    valeurAgregat: capitauxPropres,
    formule: `Capitaux propres : ${formatK(capitauxPropres)}`,
  }
}

/**
 * Méthode des Praticiens
 */
function calculerPraticiens(
  capitauxPropres: number,
  resultatNet: number
): ResultatMethodeCalcul {
  // Valeur patrimoniale = capitaux propres
  const valeurPatrimoniale = Math.max(0, capitauxPropres)

  // Valeur de rentabilité = résultat net capitalisé à 10%
  const tauxCapitalisation = 0.10
  const valeurRentabilite = Math.max(0, resultatNet / tauxCapitalisation)

  // Moyenne des deux
  const valeurMoyenne = (valeurPatrimoniale + valeurRentabilite) / 2
  const valeurBasse = valeurMoyenne * 0.85
  const valeurHaute = valeurMoyenne * 1.15

  return {
    valeurBasse,
    valeurMoyenne,
    valeurHaute,
    agregat: 'Patrimoine + Rentabilité',
    valeurAgregat: valeurMoyenne,
    formule: `(${formatK(valeurPatrimoniale)} patrimoine + ${formatK(valeurRentabilite)} rentabilité) / 2`,
  }
}

/**
 * Méthode du Goodwill
 */
function calculerGoodwill(
  capitauxPropres: number,
  resultatNet: number
): ResultatMethodeCalcul {
  const remunerationCapitaux = capitauxPropres * 0.05
  const superProfit = Math.max(0, resultatNet - remunerationCapitaux)
  const goodwill = superProfit / 0.15
  const anc = Math.max(0, capitauxPropres)

  const valeurMoyenne = anc + goodwill
  const valeurBasse = valeurMoyenne * 0.85
  const valeurHaute = valeurMoyenne * 1.15

  return {
    valeurBasse,
    valeurMoyenne,
    valeurHaute,
    agregat: 'ANC + Goodwill',
    valeurAgregat: valeurMoyenne,
    formule: `${formatK(anc)} ANC + ${formatK(goodwill)} goodwill`,
  }
}

/**
 * Valeur de la flotte (Transport)
 */
function calculerValeurFlotte(ca: number): ResultatMethodeCalcul {
  const valeurEstimee = ca * 0.35
  const valeurBasse = valeurEstimee * 0.7
  const valeurHaute = valeurEstimee * 1.0
  const valeurMoyenne = (valeurBasse + valeurHaute) / 2

  return {
    valeurBasse,
    valeurMoyenne,
    valeurHaute,
    agregat: 'Estimation flotte',
    valeurAgregat: valeurEstimee,
    formule: `~35% du CA (${formatK(ca)})`,
  }
}

/**
 * Valeur du matériel (BTP)
 */
function calculerValeurMateriel(ca: number): ResultatMethodeCalcul {
  const valeurEstimee = ca * 0.20
  const valeurBasse = valeurEstimee * 0.6
  const valeurHaute = valeurEstimee * 1.0
  const valeurMoyenne = (valeurBasse + valeurHaute) / 2

  return {
    valeurBasse,
    valeurMoyenne,
    valeurHaute,
    agregat: 'Estimation matériel',
    valeurAgregat: valeurEstimee,
    formule: `~20% du CA (${formatK(ca)})`,
  }
}

/**
 * Calcule une méthode selon son code
 */
function calculerMethode(
  code: string,
  donnees: DonneesEvaluationV2,
  secteur: ConfigSecteur,
  ebitdaNormalise: number
): { resultat: ResultatMethodeCalcul; categorie: CategorieMethode } | null {
  const codeNormalise = code.toLowerCase().replace('mult_', 'multiple_')
  const bilanRecent = [...donnees.bilans].sort((a, b) => b.annee - a.annee)[0]

  if (!bilanRecent) return null

  const ca = bilanRecent.chiffreAffaires
  const capitauxPropres = bilanRecent.capitauxPropres
  const resultatNet = bilanRecent.resultatNet
  const tresorerie = bilanRecent.disponibilites
  const dettes = bilanRecent.dettesFinancieres ?? 0

  switch (codeNormalise) {
    case 'multiple_ebitda':
      if (secteur.multiples.ebitda && ebitdaNormalise > 0) {
        return {
          resultat: calculerMultipleEbitda(ebitdaNormalise, secteur.multiples.ebitda),
          categorie: 'rentabilite',
        }
      }
      return null

    case 'multiple_ca':
      if (secteur.multiples.ca && ca > 0) {
        return {
          resultat: calculerMultipleCA(ca, secteur.multiples.ca),
          categorie: 'comparable',
        }
      }
      return null

    case 'multiple_arr':
      if (secteur.multiples.arr) {
        // Essayer d'abord ARR explicite, sinon utiliser CA
        const arr = ca // TODO: récupérer ARR réel si disponible
        return {
          resultat: calculerMultipleARR(arr, secteur.multiples.arr),
          categorie: 'rentabilite',
        }
      }
      return null

    case 'actif_net_corrige':
    case 'anc':
      return {
        resultat: calculerActifNetCorrige(capitauxPropres, tresorerie, dettes),
        categorie: 'patrimoine',
      }

    case 'praticiens':
      return {
        resultat: calculerPraticiens(capitauxPropres, resultatNet),
        categorie: 'mixte',
      }

    case 'goodwill':
      return {
        resultat: calculerGoodwill(capitauxPropres, resultatNet),
        categorie: 'mixte',
      }

    case 'valeur_flotte':
      if (ca > 0) {
        return {
          resultat: calculerValeurFlotte(ca),
          categorie: 'patrimoine',
        }
      }
      return null

    case 'valeur_materiel':
      if (ca > 0) {
        return {
          resultat: calculerValeurMateriel(ca),
          categorie: 'patrimoine',
        }
      }
      return null

    case 'fonds_commerce':
    case 'baremes_sante':
      if (secteur.multiples.ca && ca > 0) {
        return {
          resultat: calculerMultipleCA(ca, secteur.multiples.ca),
          categorie: 'comparable',
        }
      }
      return null

    case 'dcf':
      // DCF simplifié basé sur EBITDA normalisé
      if (ebitdaNormalise > 0) {
        const tauxActualisation = 0.12
        const croissance = 0.02
        const anneesProjection = 5
        const fluxBase = ebitdaNormalise * 0.7

        let sommeFlux = 0
        for (let i = 1; i <= anneesProjection; i++) {
          const flux = fluxBase * Math.pow(1 + croissance, i)
          sommeFlux += flux / Math.pow(1 + tauxActualisation, i)
        }

        const fluxTerminal = fluxBase * Math.pow(1 + croissance, anneesProjection + 1)
        const valeurTerminale =
          fluxTerminal / (tauxActualisation - 0.02) / Math.pow(1 + tauxActualisation, anneesProjection)

        const valeurMoyenne = sommeFlux + valeurTerminale
        const valeurBasse = valeurMoyenne * 0.8
        const valeurHaute = valeurMoyenne * 1.2

        return {
          resultat: {
            valeurBasse,
            valeurMoyenne,
            valeurHaute,
            agregat: 'FCF projetés',
            valeurAgregat: fluxBase,
            formule: `DCF 5 ans, WACC ${(tauxActualisation * 100).toFixed(0)}%`,
          },
          categorie: 'rentabilite',
        }
      }
      return null

    default:
      console.warn(`Méthode V2 non reconnue: ${code}`)
      return null
  }
}

// ============================================
// CALCUL DE LA VALEUR D'ENTREPRISE
// ============================================

interface ResultatVE {
  fourchette: FourchetteValorisation
  methodes: ResultatMethode[]
}

function calculerValeurEntreprise(
  donnees: DonneesEvaluationV2,
  secteur: ConfigSecteur,
  ebitdaNormalise: number
): ResultatVE {
  const methodes: ResultatMethode[] = []
  let sommeBasse = 0
  let sommeMoyenne = 0
  let sommeHaute = 0
  let sommePoids = 0

  for (const methodeConfig of secteur.methodes) {
    const resultat = calculerMethode(methodeConfig.code, donnees, secteur, ebitdaNormalise)

    if (resultat && resultat.resultat.valeurMoyenne > 0) {
      methodes.push({
        code: methodeConfig.code,
        nom: methodeConfig.nom,
        categorie: resultat.categorie,
        valeurEntreprise: resultat.resultat.valeurMoyenne,
        poids: methodeConfig.poids,
        details: {
          agregat: resultat.resultat.agregat,
          valeurAgregat: resultat.resultat.valeurAgregat,
          multiple: resultat.resultat.multiple,
          formule: resultat.resultat.formule,
        },
        explication: `${methodeConfig.nom} : ${resultat.resultat.formule}`,
      })

      sommeBasse += resultat.resultat.valeurBasse * methodeConfig.poids
      sommeMoyenne += resultat.resultat.valeurMoyenne * methodeConfig.poids
      sommeHaute += resultat.resultat.valeurHaute * methodeConfig.poids
      sommePoids += methodeConfig.poids
    }
  }

  // Normaliser si les poids ne font pas 100
  const facteur = sommePoids > 0 ? 100 / sommePoids : 1

  return {
    fourchette: {
      basse: sommePoids > 0 ? Math.round((sommeBasse * facteur) / 100) : 0,
      moyenne: sommePoids > 0 ? Math.round((sommeMoyenne * facteur) / 100) : 0,
      haute: sommePoids > 0 ? Math.round((sommeHaute * facteur) / 100) : 0,
    },
    methodes,
  }
}

// ============================================
// BRIDGE VE → PRIX DE CESSION
// ============================================

function calculerBridge(
  valeurEntreprise: number,
  detteNette: number
): BridgeValorisation {
  // Si dette nette positive → on a plus de dettes que de tréso → on déduit
  // Si dette nette négative → on a plus de tréso que de dettes → on ajoute

  const moinsDettes = detteNette > 0 ? -detteNette : 0
  const plusTresorerie = detteNette < 0 ? -detteNette : 0 // Double négatif = positif

  const prixCession = valeurEntreprise - detteNette

  return {
    valeurEntreprise,
    moinsDettes,
    plusTresorerie,
    prixCession: Math.max(0, prixCession), // Prix ne peut pas être négatif
  }
}

function calculerFourchettePrix(
  fourchetteVE: FourchetteValorisation,
  detteNette: number
): FourchetteValorisation {
  return {
    basse: Math.max(0, fourchetteVE.basse - detteNette),
    moyenne: Math.max(0, fourchetteVE.moyenne - detteNette),
    haute: Math.max(0, fourchetteVE.haute - detteNette),
  }
}

// ============================================
// ANALYSE QUALITATIVE
// ============================================

function analyserPointsForts(donnees: DonneesEvaluationV2): string[] {
  const points: string[] = []
  const bilanRecent = [...donnees.bilans].sort((a, b) => b.annee - a.annee)[0]

  if (!bilanRecent) return points

  // Croissance du CA
  if (donnees.bilans.length >= 2) {
    const bilansOrdre = [...donnees.bilans].sort((a, b) => b.annee - a.annee)
    const caActuel = bilansOrdre[0].chiffreAffaires
    const caAncien = bilansOrdre[1].chiffreAffaires
    const croissance = (caActuel - caAncien) / caAncien
    if (croissance > 0.05) {
      points.push(`Croissance du CA de ${(croissance * 100).toFixed(1)}%`)
    }
  }

  // Rentabilité
  if (bilanRecent.resultatExploitation > 0) {
    const margeExploitation = bilanRecent.resultatExploitation / bilanRecent.chiffreAffaires
    if (margeExploitation > 0.05) {
      points.push(`Marge d'exploitation positive (${(margeExploitation * 100).toFixed(1)}%)`)
    }
  }

  // Capitaux propres solides
  if (bilanRecent.capitauxPropres > 0) {
    points.push('Capitaux propres positifs')
  }

  // Trésorerie disponible
  if (bilanRecent.disponibilites > bilanRecent.chiffreAffaires * 0.1) {
    points.push('Trésorerie confortable')
  }

  // Faible endettement
  const dettes = bilanRecent.dettesFinancieres ?? bilanRecent.empruntsEtablissementsCredit ?? 0
  if (dettes < bilanRecent.capitauxPropres * 0.5) {
    points.push('Faible niveau d\'endettement')
  }

  return points
}

function analyserPointsVigilance(donnees: DonneesEvaluationV2): string[] {
  const points: string[] = []
  const bilanRecent = [...donnees.bilans].sort((a, b) => b.annee - a.annee)[0]

  if (!bilanRecent) return points

  // Baisse du CA
  if (donnees.bilans.length >= 2) {
    const bilansOrdre = [...donnees.bilans].sort((a, b) => b.annee - a.annee)
    const caActuel = bilansOrdre[0].chiffreAffaires
    const caAncien = bilansOrdre[1].chiffreAffaires
    const croissance = (caActuel - caAncien) / caAncien
    if (croissance < -0.05) {
      points.push(`Baisse du CA de ${(Math.abs(croissance) * 100).toFixed(1)}%`)
    }
  }

  // Résultat négatif
  if (bilanRecent.resultatNet < 0) {
    points.push('Résultat net négatif')
  }

  // Capitaux propres faibles ou négatifs
  if (bilanRecent.capitauxPropres <= 0) {
    points.push('Capitaux propres insuffisants')
  }

  // Fort endettement
  const dettes = bilanRecent.dettesFinancieres ?? bilanRecent.empruntsEtablissementsCredit ?? 0
  if (dettes > bilanRecent.capitauxPropres * 2) {
    points.push('Niveau d\'endettement élevé')
  }

  // Dépendance dirigeant
  if (donnees.qualitatif?.dependanceDirigeant) {
    points.push('Forte dépendance au dirigeant')
  }

  // Concentration clients
  if (donnees.qualitatif?.concentrationClients && donnees.qualitatif.concentrationClients > 30) {
    points.push(`Concentration client (${donnees.qualitatif.concentrationClients}% du CA)`)
  }

  return points
}

function determinerNiveauConfiance(
  donnees: DonneesEvaluationV2,
  nbMethodes: number
): { niveau: NiveauConfiance; facteurs: string[] } {
  const facteurs: string[] = []
  let score = 100

  // Nombre d'années de données
  if (donnees.bilans.length < 3) {
    facteurs.push(`Seulement ${donnees.bilans.length} année(s) de données`)
    score -= 20
  }

  // Nombre de méthodes utilisables
  if (nbMethodes < 2) {
    facteurs.push('Peu de méthodes applicables')
    score -= 30
  }

  // Volatilité des résultats
  if (donnees.bilans.length >= 2) {
    const resultats = donnees.bilans.map((b) => b.resultatNet)
    const signes = resultats.map((r) => Math.sign(r))
    const volatil = signes.some((s, i) => i > 0 && s !== signes[i - 1])
    if (volatil) {
      facteurs.push('Résultats volatils (changements de signe)')
      score -= 15
    }
  }

  // Données qualitatives manquantes
  if (!donnees.qualitatif) {
    facteurs.push('Données qualitatives non collectées')
    score -= 10
  }

  let niveau: NiveauConfiance
  if (score >= 70) {
    niveau = 'elevee'
  } else if (score >= 40) {
    niveau = 'moyenne'
  } else {
    niveau = 'faible'
  }

  return { niveau, facteurs }
}

// ============================================
// GÉNÉRATION DE L'EXPLICATION COMPLÈTE
// ============================================

function genererExplicationComplete(
  secteur: ConfigSecteur,
  ebitda: ReturnType<typeof calculerEbitdaNormalise>,
  detteNette: ReturnType<typeof calculerDetteNette>,
  valeurEntreprise: FourchetteValorisation,
  prixCession: FourchetteValorisation,
  methodes: ResultatMethode[]
): string {
  const lignes: string[] = []

  lignes.push(`# Évaluation - Secteur ${secteur.nom}`)
  lignes.push('')

  // Contexte sectoriel
  lignes.push(`## Contexte sectoriel`)
  lignes.push(secteur.explicationSecteur)
  lignes.push('')

  // EBITDA normalisé
  lignes.push(`## EBITDA Normalisé`)
  lignes.push('')
  lignes.push(ebitda.explicationRetraitements)
  lignes.push('')

  // Dette nette
  lignes.push(`## Dette Financière Nette`)
  lignes.push('')
  lignes.push(genererExplicationDetteNette(detteNette))
  lignes.push('')

  // Méthodes de valorisation
  lignes.push(`## Méthodes de valorisation`)
  lignes.push('')
  lignes.push(secteur.explicationMethodes)
  lignes.push('')
  lignes.push('### Résultats par méthode')
  lignes.push('')

  for (const methode of methodes) {
    lignes.push(`**${methode.nom}** (poids ${methode.poids}%)`)
    lignes.push(`- Valeur d'Entreprise : ${formatK(methode.valeurEntreprise)}`)
    lignes.push(`- ${methode.details.formule}`)
    lignes.push('')
  }

  // Bridge VE → Prix
  lignes.push(`## Du Valeur d'Entreprise au Prix de Cession`)
  lignes.push('')
  lignes.push('Le Prix de Cession = Valeur d\'Entreprise - Dette Financière Nette')
  lignes.push('')
  lignes.push(`| Composante | Montant |`)
  lignes.push(`|------------|---------|`)
  lignes.push(`| Valeur d'Entreprise (moyenne) | ${formatK(valeurEntreprise.moyenne)} |`)
  if (detteNette.detteFinanciereNette > 0) {
    lignes.push(`| - Dette Financière Nette | -${formatK(detteNette.detteFinanciereNette)} |`)
  } else {
    lignes.push(`| + Trésorerie Nette | +${formatK(Math.abs(detteNette.detteFinanciereNette))} |`)
  }
  lignes.push(`| **= Prix de Cession** | **${formatK(prixCession.moyenne)}** |`)
  lignes.push('')

  // Fourchette finale
  lignes.push(`## Fourchette de valorisation`)
  lignes.push('')
  lignes.push(`| | Basse | Moyenne | Haute |`)
  lignes.push(`|--|-------|---------|-------|`)
  lignes.push(`| Valeur d'Entreprise | ${formatK(valeurEntreprise.basse)} | ${formatK(valeurEntreprise.moyenne)} | ${formatK(valeurEntreprise.haute)} |`)
  lignes.push(`| Prix de Cession | ${formatK(prixCession.basse)} | ${formatK(prixCession.moyenne)} | ${formatK(prixCession.haute)} |`)

  return lignes.join('\n')
}

// ============================================
// FONCTION PRINCIPALE D'ÉVALUATION V2
// ============================================

/**
 * Évalue une entreprise selon la méthodologie V2
 * - EBITDA normalisé avec retraitements
 * - Dette financière nette
 * - Bridge VE → Prix de Cession
 */
export function evaluerEntrepriseV2(donnees: DonneesEvaluationV2): ResultatEvaluationV2 {
  // 1. Détecter le secteur
  const secteur = detecterSecteurEvaluation(donnees.codeNaf)

  // 2. Calculer l'EBITDA normalisé
  const ebitda = calculerEbitdaNormalise(donnees.bilans, donnees.retraitements)

  // 3. Calculer la dette financière nette
  const bilanRecent = [...donnees.bilans].sort((a, b) => b.annee - a.annee)[0]
  const detteNette = calculerDetteNette(bilanRecent, donnees.retraitements)

  // 4. Calculer la Valeur d'Entreprise
  const { fourchette: fourchetteVE, methodes } = calculerValeurEntreprise(
    donnees,
    secteur,
    ebitda.ebitdaNormalise
  )

  // 5. Calculer le Prix de Cession (Bridge)
  const fourchettePrix = calculerFourchettePrix(fourchetteVE, detteNette.detteFinanciereNette)
  const bridge = calculerBridge(fourchetteVE.moyenne, detteNette.detteFinanciereNette)

  // 6. Analyse qualitative
  const pointsForts = analyserPointsForts(donnees)
  const pointsVigilance = analyserPointsVigilance(donnees)
  const { niveau: niveauConfiance, facteurs: facteursIncertitude } = determinerNiveauConfiance(
    donnees,
    methodes.length
  )

  // 7. Recommandations
  const recommandations: string[] = []
  if (methodes.length < 3) {
    recommandations.push('Collecter des données supplémentaires pour affiner la valorisation')
  }
  if (detteNette.detteFinanciereNette > fourchetteVE.moyenne * 0.3) {
    recommandations.push('La dette impacte significativement le prix - envisager un désendettement avant cession')
  }
  if (pointsVigilance.includes('Forte dépendance au dirigeant')) {
    recommandations.push('Prévoir une période d\'accompagnement post-cession')
  }

  // 8. Générer l'explication complète
  const explicationComplete = genererExplicationComplete(
    secteur,
    ebitda,
    detteNette,
    fourchetteVE,
    fourchettePrix,
    methodes
  )

  return {
    siren: donnees.siren,
    dateEvaluation: new Date().toISOString().split('T')[0],
    secteur,
    ebitda,
    detteNette,
    valeurEntreprise: fourchetteVE,
    prixCession: fourchettePrix,
    bridge,
    methodes,
    ajustements: [], // TODO: Implémenter les ajustements qualitatifs
    pointsForts,
    pointsVigilance,
    recommandations,
    niveauConfiance,
    facteursIncertitude,
    explicationComplete,
  }
}

// ============================================
// UTILITAIRES
// ============================================

function formatK(montant: number): string {
  const absM = Math.abs(montant)
  const prefix = montant < 0 ? '-' : ''

  if (absM >= 1_000_000) {
    return `${prefix}${(absM / 1_000_000).toFixed(1)}M€`
  }
  if (absM >= 1_000) {
    return `${prefix}${(absM / 1_000).toFixed(0)}k€`
  }
  return `${prefix}${absM.toFixed(0)}€`
}

// ============================================
// EXPORTS
// ============================================

export { formatK }
