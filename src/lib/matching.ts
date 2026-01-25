// Algorithme de matching entre vendeurs et acheteurs
// Calcule un score de compatibilité basé sur les critères de recherche

import type { Vendeur, Acheteur, CriteresRecherche } from './database.types'

// ============================================================
// TYPES
// ============================================================

export interface MatchResult {
  acheteur_id: string
  vendeur_id: string
  score_matching: number // 0-100
  criteres_matches: string[]
  criteres_manques: string[]
}

export interface VendeurPourMatching {
  id: string
  secteur_code_naf: string | null
  secteur_libelle: string | null
  chiffre_affaires: number | null
  valorisation_moyenne: number | null
  code_postal: string | null
  effectif: string | null
}

export interface AcheteurPourMatching {
  id: string
  numero_acheteur: number
  score_total: number | null
  score_grade: string | null
  budget_total: number | null
  secteurs_expertise: string[] | null
}

// ============================================================
// FONCTIONS DE MATCHING
// ============================================================

export function calculerMatching(
  vendeur: VendeurPourMatching,
  acheteur: AcheteurPourMatching,
  criteres: CriteresRecherche
): MatchResult {
  const criteres_matches: string[] = []
  const criteres_manques: string[] = []
  let score = 0

  // 1. SECTEUR (30 points max)
  const scoreSecteur = calculerScoreSecteur(vendeur, criteres)
  score += scoreSecteur.score
  if (scoreSecteur.match) {
    criteres_matches.push(scoreSecteur.match)
  } else if (scoreSecteur.miss) {
    criteres_manques.push(scoreSecteur.miss)
  }

  // 2. BUDGET (30 points max)
  const scoreBudget = calculerScoreBudget(vendeur, criteres)
  score += scoreBudget.score
  if (scoreBudget.match) {
    criteres_matches.push(scoreBudget.match)
  } else if (scoreBudget.miss) {
    criteres_manques.push(scoreBudget.miss)
  }

  // 3. LOCALISATION (20 points max)
  const scoreLocalisation = calculerScoreLocalisation(vendeur, criteres)
  score += scoreLocalisation.score
  if (scoreLocalisation.match) {
    criteres_matches.push(scoreLocalisation.match)
  } else if (scoreLocalisation.miss) {
    criteres_manques.push(scoreLocalisation.miss)
  }

  // 4. TAILLE / CA (20 points max)
  const scoreTaille = calculerScoreTaille(vendeur, criteres)
  score += scoreTaille.score
  if (scoreTaille.match) {
    criteres_matches.push(scoreTaille.match)
  } else if (scoreTaille.miss) {
    criteres_manques.push(scoreTaille.miss)
  }

  return {
    acheteur_id: acheteur.id,
    vendeur_id: vendeur.id,
    score_matching: Math.round(score),
    criteres_matches,
    criteres_manques,
  }
}

// ============================================================
// CALCULS PAR CRITÈRE
// ============================================================

interface ScoreCritere {
  score: number
  match?: string
  miss?: string
}

function calculerScoreSecteur(vendeur: VendeurPourMatching, criteres: CriteresRecherche): ScoreCritere {
  if (!vendeur.secteur_code_naf) {
    return { score: 15 } // Score neutre si pas de secteur
  }

  const secteurVendeur = vendeur.secteur_code_naf.substring(0, 2) // Premiers 2 caractères = catégorie NAF

  // Vérifier si le secteur est exclu
  if (criteres.secteurs_exclus?.some(s => s.startsWith(secteurVendeur))) {
    return { score: 0, miss: 'Secteur exclu' }
  }

  // Secteur exact dans la liste des souhaités
  if (criteres.secteurs_souhaites?.includes(vendeur.secteur_code_naf)) {
    return { score: 30, match: 'Secteur correspondant' }
  }

  // Secteur proche (même catégorie NAF à 2 chiffres)
  if (criteres.secteurs_souhaites?.some(s => s.startsWith(secteurVendeur))) {
    return { score: 20, match: 'Secteur proche' }
  }

  // Secteur non spécifié ou pas de préférence
  if (!criteres.secteurs_souhaites || criteres.secteurs_souhaites.length === 0) {
    return { score: 15 } // Score neutre
  }

  return { score: 5, miss: 'Secteur différent' }
}

function calculerScoreBudget(vendeur: VendeurPourMatching, criteres: CriteresRecherche): ScoreCritere {
  if (!vendeur.valorisation_moyenne || !criteres.prix_max) {
    return { score: 15 } // Score neutre si pas de données
  }

  const valorisation = vendeur.valorisation_moyenne
  const budgetMax = criteres.prix_max
  const apportDisponible = criteres.apport_disponible || 0

  // Calcul du ratio valorisation / budget
  const ratio = valorisation / budgetMax

  if (ratio <= 0.8) {
    // Valorisation inférieure au budget avec marge
    return { score: 30, match: 'Dans le budget' }
  }

  if (ratio <= 1.0) {
    // Valorisation dans le budget
    return { score: 25, match: 'Budget compatible' }
  }

  if (ratio <= 1.2) {
    // Dépasse légèrement le budget
    return { score: 10, miss: 'Légèrement au-dessus du budget' }
  }

  // Dépasse largement le budget
  return { score: 0, miss: 'Hors budget' }
}

function calculerScoreLocalisation(vendeur: VendeurPourMatching, criteres: CriteresRecherche): ScoreCritere {
  if (!vendeur.code_postal) {
    return { score: 10 } // Score neutre
  }

  const departement = vendeur.code_postal.substring(0, 2)
  const region = departementToRegion(departement)

  // Accepte la relocalisation = bonus
  if (criteres.accepte_relocalisation) {
    return { score: 15, match: 'Relocalisation acceptée' }
  }

  // Région exacte
  if (region && criteres.regions?.includes(region)) {
    return { score: 20, match: 'Région correspondante' }
  }

  // Département dans une région limitrophe
  if (criteres.departements?.includes(departement)) {
    return { score: 15, match: 'Département compatible' }
  }

  // Pas de préférence géographique
  if (!criteres.regions?.length && !criteres.departements?.length) {
    return { score: 10 } // Score neutre
  }

  return { score: 0, miss: 'Localisation éloignée' }
}

function calculerScoreTaille(vendeur: VendeurPourMatching, criteres: CriteresRecherche): ScoreCritere {
  if (!vendeur.chiffre_affaires) {
    return { score: 10 } // Score neutre
  }

  const ca = vendeur.chiffre_affaires
  const caMin = criteres.ca_min
  const caMax = criteres.ca_max

  // Pas de préférence de taille
  if (!caMin && !caMax) {
    return { score: 10 } // Score neutre
  }

  // CA dans la fourchette exacte
  if ((!caMin || ca >= caMin) && (!caMax || ca <= caMax)) {
    return { score: 20, match: 'Taille correspondante' }
  }

  // CA proche de la fourchette (±20%)
  const marginMin = caMin ? caMin * 0.8 : 0
  const marginMax = caMax ? caMax * 1.2 : Infinity

  if (ca >= marginMin && ca <= marginMax) {
    return { score: 10, match: 'Taille proche' }
  }

  return { score: 0, miss: 'Taille non compatible' }
}

// ============================================================
// FONCTIONS DE FILTRAGE
// ============================================================

export function filtrerMatchsValides(matchs: MatchResult[], scoreMinimum: number = 50): MatchResult[] {
  return matchs
    .filter(m => m.score_matching >= scoreMinimum)
    .sort((a, b) => b.score_matching - a.score_matching)
}

export function trouverMeilleursMatchs(
  vendeur: VendeurPourMatching,
  acheteurs: AcheteurPourMatching[],
  criteresByAcheteur: Map<string, CriteresRecherche>,
  limit: number = 10
): MatchResult[] {
  const matchs: MatchResult[] = []

  for (const acheteur of acheteurs) {
    const criteres = criteresByAcheteur.get(acheteur.id)
    if (!criteres) continue

    const match = calculerMatching(vendeur, acheteur, criteres)
    matchs.push(match)
  }

  return filtrerMatchsValides(matchs).slice(0, limit)
}

// ============================================================
// UTILITAIRES
// ============================================================

function departementToRegion(departement: string): string | null {
  const regionsMap: Record<string, string> = {
    // Île-de-France
    '75': 'Île-de-France', '77': 'Île-de-France', '78': 'Île-de-France',
    '91': 'Île-de-France', '92': 'Île-de-France', '93': 'Île-de-France',
    '94': 'Île-de-France', '95': 'Île-de-France',
    // Auvergne-Rhône-Alpes
    '01': 'Auvergne-Rhône-Alpes', '03': 'Auvergne-Rhône-Alpes', '07': 'Auvergne-Rhône-Alpes',
    '15': 'Auvergne-Rhône-Alpes', '26': 'Auvergne-Rhône-Alpes', '38': 'Auvergne-Rhône-Alpes',
    '42': 'Auvergne-Rhône-Alpes', '43': 'Auvergne-Rhône-Alpes', '63': 'Auvergne-Rhône-Alpes',
    '69': 'Auvergne-Rhône-Alpes', '73': 'Auvergne-Rhône-Alpes', '74': 'Auvergne-Rhône-Alpes',
    // Nouvelle-Aquitaine
    '16': 'Nouvelle-Aquitaine', '17': 'Nouvelle-Aquitaine', '19': 'Nouvelle-Aquitaine',
    '23': 'Nouvelle-Aquitaine', '24': 'Nouvelle-Aquitaine', '33': 'Nouvelle-Aquitaine',
    '40': 'Nouvelle-Aquitaine', '47': 'Nouvelle-Aquitaine', '64': 'Nouvelle-Aquitaine',
    '79': 'Nouvelle-Aquitaine', '86': 'Nouvelle-Aquitaine', '87': 'Nouvelle-Aquitaine',
    // Autres régions...
  }

  return regionsMap[departement] || null
}

export function getMatchQuality(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent match', color: '#10b981' }
  if (score >= 65) return { label: 'Très bon match', color: '#3b82f6' }
  if (score >= 50) return { label: 'Bon match', color: '#f59e0b' }
  return { label: 'Match partiel', color: '#6b7280' }
}
