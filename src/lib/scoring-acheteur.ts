// Module de scoring des acheteurs
// Calcule un score de 0-100 basé sur la capacité financière, l'expérience et le sérieux

import type { ScoreGrade, ScoreDetails, Disponibilite, DelaiReprise, Accompagnement } from './database.types'

// ============================================================
// TYPES
// ============================================================

export interface ProfilAcheteur {
  // Capacité financière
  apport_personnel: number
  capacite_emprunt: number | null
  preuve_fonds_validee: boolean

  // Expérience
  annees_experience_gestion: number
  secteurs_expertise: string[]
  a_deja_repris: boolean
  diplome: string | null

  // Sérieux
  accompagne_par: Accompagnement | null
  disponibilite: Disponibilite
  delai_reprise: DelaiReprise

  // Motivation
  pitch: string | null
}

export interface ScoreResult {
  total: number // 0-100
  grade: ScoreGrade
  details: ScoreDetails
  conseils_amelioration: string[]
}

// ============================================================
// FONCTIONS DE SCORING
// ============================================================

export function calculerScoreAcheteur(profil: ProfilAcheteur): ScoreResult {
  const details: ScoreDetails = {
    capacite_financiere: calculerScoreCapaciteFinanciere(profil),
    experience: calculerScoreExperience(profil),
    serieux: calculerScoreSerieux(profil),
    motivation: calculerScoreMotivation(profil),
  }

  const total = details.capacite_financiere.score
    + details.experience.score
    + details.serieux.score
    + details.motivation.score

  const grade = calculerGrade(total)
  const conseils_amelioration = genererConseils(profil, details)

  return {
    total,
    grade,
    details,
    conseils_amelioration,
  }
}

// ============================================================
// CALCUL PAR CATÉGORIE
// ============================================================

function calculerScoreCapaciteFinanciere(profil: ProfilAcheteur): ScoreDetails['capacite_financiere'] {
  let score = 0
  let commentaire = ''

  // Score basé sur l'apport personnel
  if (profil.apport_personnel >= 500000) {
    score += 35
    commentaire = 'Apport exceptionnel (> 500k€)'
  } else if (profil.apport_personnel >= 150000) {
    score += 25
    commentaire = 'Apport solide (150-500k€)'
  } else if (profil.apport_personnel >= 50000) {
    score += 15
    commentaire = 'Apport correct (50-150k€)'
  } else {
    score += 5
    commentaire = 'Apport limité (< 50k€)'
  }

  // Bonus preuve de fonds
  if (profil.preuve_fonds_validee) {
    score += 5
    commentaire += ' - Fonds vérifiés'
  }

  return { score, max: 40, commentaire }
}

function calculerScoreExperience(profil: ProfilAcheteur): ScoreDetails['experience'] {
  let score = 0
  let commentaire = ''

  // Score basé sur les années d'expérience
  if (profil.annees_experience_gestion >= 10) {
    score += 25
    commentaire = 'Dirigeant expérimenté (10+ ans)'
  } else if (profil.annees_experience_gestion >= 6) {
    score += 20
    commentaire = 'Expérience significative (6-10 ans)'
  } else if (profil.annees_experience_gestion >= 3) {
    score += 10
    commentaire = 'Expérience modérée (3-5 ans)'
  } else {
    score += 5
    commentaire = 'Profil junior (< 3 ans)'
  }

  // Bonus reprise antérieure
  if (profil.a_deja_repris) {
    score += 5
    commentaire += ' - A déjà repris'
  }

  return { score, max: 30, commentaire }
}

function calculerScoreSerieux(profil: ProfilAcheteur): ScoreDetails['serieux'] {
  let score = 0
  const elements: string[] = []

  // Accompagnement
  if (profil.accompagne_par === 'cabinet_ma') {
    score += 8
    elements.push('Cabinet M&A')
  } else if (profil.accompagne_par === 'avocat' || profil.accompagne_par === 'expert_comptable') {
    score += 6
    elements.push('Accompagné')
  } else if (profil.accompagne_par === 'autre') {
    score += 4
    elements.push('Autre accompagnement')
  }

  // Disponibilité
  if (profil.disponibilite === 'temps_plein') {
    score += 6
    elements.push('Temps plein')
  } else if (profil.disponibilite === 'partiel') {
    score += 3
    elements.push('Temps partiel')
  }

  // Délai de reprise
  if (profil.delai_reprise === 'immediat' || profil.delai_reprise === '6_mois') {
    score += 6
    elements.push('Prêt rapidement')
  } else if (profil.delai_reprise === '12_mois') {
    score += 3
    elements.push('Sous 12 mois')
  }

  const commentaire = elements.length > 0 ? elements.join(' - ') : 'À améliorer'

  return { score, max: 20, commentaire }
}

function calculerScoreMotivation(profil: ProfilAcheteur): ScoreDetails['motivation'] {
  let score = 0
  let commentaire = ''

  if (!profil.pitch) {
    commentaire = 'Pas de présentation'
    return { score, max: 10, commentaire }
  }

  const longueurPitch = profil.pitch.length

  if (longueurPitch >= 300) {
    score = 10
    commentaire = 'Pitch complet et détaillé'
  } else if (longueurPitch >= 100) {
    score = 5
    commentaire = 'Pitch présent'
  } else {
    score = 2
    commentaire = 'Pitch trop court'
  }

  return { score, max: 10, commentaire }
}

// ============================================================
// UTILITAIRES
// ============================================================

function calculerGrade(total: number): ScoreGrade {
  if (total >= 90) return 'A'
  if (total >= 75) return 'B'
  if (total >= 60) return 'C'
  if (total >= 40) return 'D'
  return 'E'
}

function genererConseils(profil: ProfilAcheteur, details: ScoreDetails): string[] {
  const conseils: string[] = []

  // Conseil sur la preuve de fonds
  if (!profil.preuve_fonds_validee) {
    conseils.push('Fournissez une attestation de fonds pour gagner 5 points')
  }

  // Conseil sur l'accompagnement
  if (!profil.accompagne_par || profil.accompagne_par === 'aucun') {
    conseils.push('Faites-vous accompagner par un professionnel (avocat, expert-comptable, cabinet M&A)')
  }

  // Conseil sur la disponibilité
  if (profil.disponibilite !== 'temps_plein') {
    conseils.push('Indiquez une disponibilité à temps plein pour rassurer les vendeurs')
  }

  // Conseil sur le pitch
  if (!profil.pitch || profil.pitch.length < 100) {
    conseils.push('Rédigez une présentation détaillée de votre projet (min. 100 caractères)')
  }

  // Conseil sur le délai
  if (profil.delai_reprise === '24_mois') {
    conseils.push('Raccourcissez votre délai de reprise si possible')
  }

  return conseils.slice(0, 3) // Limiter à 3 conseils
}

// ============================================================
// FONCTIONS D'AFFICHAGE
// ============================================================

export function getGradeColor(grade: ScoreGrade): string {
  const colors: Record<ScoreGrade, string> = {
    A: '#10b981', // Vert
    B: '#3b82f6', // Bleu
    C: '#f59e0b', // Orange
    D: '#ef4444', // Rouge
    E: '#6b7280', // Gris
  }
  return colors[grade]
}

export function getGradeLabel(grade: ScoreGrade): string {
  const labels: Record<ScoreGrade, string> = {
    A: 'Acheteur Premium',
    B: 'Très bon profil',
    C: 'Bon profil',
    D: 'Profil à renforcer',
    E: 'Profil incomplet',
  }
  return labels[grade]
}

export function getGradeStars(grade: ScoreGrade): number {
  const stars: Record<ScoreGrade, number> = {
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    E: 1,
  }
  return stars[grade]
}
