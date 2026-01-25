// Détection d'anomalies financières - GRATUIT (pas d'appel API)
// Règles métier pré-définies pour identifier les points d'attention

import type { DonneesFinancieres } from './ratios'
import { BENCHMARKS_SECTEUR } from './ratios'

export type SeveriteAnomalie = 'info' | 'attention' | 'alerte' | 'critique'

export interface Anomalie {
  id: string
  type: 'financiere' | 'operationnelle' | 'structurelle' | 'sectorielle'
  severite: SeveriteAnomalie
  titre: string
  description: string
  impact: string
  recommendation: string
  valeurActuelle?: number
  valeurReference?: number
}

export interface ResultatDetection {
  anomalies: Anomalie[]
  score: number // 0-100, 100 = pas d'anomalie
  resume: string
}

/**
 * Détecte les anomalies dans les données financières
 * GRATUIT - Aucun appel API, règles métier locales
 */
export function detecterAnomalies(
  donnees: DonneesFinancieres,
  secteur: string
): ResultatDetection {
  const anomalies: Anomalie[] = []
  const benchmarks = BENCHMARKS_SECTEUR[secteur] || BENCHMARKS_SECTEUR['services']

  // =========================================
  // 1. ANOMALIES DE RENTABILITÉ
  // =========================================

  // EBITDA négatif
  if (donnees.ebitda < 0) {
    anomalies.push({
      id: 'ebitda_negatif',
      type: 'financiere',
      severite: 'critique',
      titre: 'EBITDA négatif',
      description: `L'EBITDA est de ${formatEuro(donnees.ebitda)}, ce qui signifie que l'activité opérationnelle perd de l'argent.`,
      impact: 'Valorisation fortement impactée, difficulté à trouver un repreneur',
      recommendation: 'Analyser la structure de coûts et identifier les leviers de rentabilité',
      valeurActuelle: donnees.ebitda,
      valeurReference: 0,
    })
  }

  // Marge EBITDA très faible
  const margeEBITDA = donnees.ca > 0 ? (donnees.ebitda / donnees.ca) * 100 : 0
  if (margeEBITDA > 0 && margeEBITDA < benchmarks.margeEBITDA.min) {
    anomalies.push({
      id: 'marge_faible',
      type: 'financiere',
      severite: 'attention',
      titre: 'Marge EBITDA faible',
      description: `La marge EBITDA de ${margeEBITDA.toFixed(1)}% est inférieure au minimum sectoriel de ${benchmarks.margeEBITDA.min}%.`,
      impact: 'Multiple de valorisation réduit de 10-20%',
      recommendation: 'Identifier les postes de charges à optimiser',
      valeurActuelle: margeEBITDA,
      valeurReference: benchmarks.margeEBITDA.min,
    })
  }

  // Résultat net négatif mais EBITDA positif
  if (donnees.resultatNet < 0 && donnees.ebitda > 0) {
    anomalies.push({
      id: 'deficit_hors_exploitation',
      type: 'financiere',
      severite: 'attention',
      titre: 'Déficit malgré EBITDA positif',
      description: "L'entreprise a un EBITDA positif mais un résultat net négatif, indiquant des charges financières ou exceptionnelles importantes.",
      impact: 'À analyser - peut être temporaire ou structurel',
      recommendation: 'Vérifier les charges financières, amortissements et éléments exceptionnels',
      valeurActuelle: donnees.resultatNet,
      valeurReference: 0,
    })
  }

  // =========================================
  // 2. ANOMALIES DE STRUCTURE FINANCIÈRE
  // =========================================

  // Capitaux propres négatifs
  if (donnees.capitauxPropres < 0) {
    anomalies.push({
      id: 'capitaux_propres_negatifs',
      type: 'structurelle',
      severite: 'critique',
      titre: 'Capitaux propres négatifs',
      description: `Les capitaux propres sont de ${formatEuro(donnees.capitauxPropres)}. L'entreprise est en situation de faillite comptable.`,
      impact: 'Risque juridique - obligation de reconstitution ou dissolution',
      recommendation: 'Reconstituer les capitaux propres (augmentation de capital ou abandon de créances)',
      valeurActuelle: donnees.capitauxPropres,
      valeurReference: 0,
    })
  }

  // Surendettement
  const tauxEndettement = donnees.capitauxPropres > 0
    ? (donnees.dettes / donnees.capitauxPropres) * 100
    : 999
  if (tauxEndettement > benchmarks.tauxEndettement.critique) {
    anomalies.push({
      id: 'surendettement',
      type: 'structurelle',
      severite: 'alerte',
      titre: 'Surendettement',
      description: `Le taux d'endettement de ${tauxEndettement.toFixed(0)}% dépasse le seuil critique de ${benchmarks.tauxEndettement.critique}%.`,
      impact: 'Décote de 20-30% sur la valorisation, risque de défaut',
      recommendation: 'Restructuration de la dette ou renforcement des fonds propres',
      valeurActuelle: tauxEndettement,
      valeurReference: benchmarks.tauxEndettement.critique,
    })
  } else if (tauxEndettement > benchmarks.tauxEndettement.max) {
    anomalies.push({
      id: 'endettement_eleve',
      type: 'structurelle',
      severite: 'attention',
      titre: 'Endettement élevé',
      description: `Le taux d'endettement de ${tauxEndettement.toFixed(0)}% est supérieur à la moyenne sectorielle de ${benchmarks.tauxEndettement.max}%.`,
      impact: 'Décote de 10-15% sur la valorisation',
      recommendation: 'Surveiller la capacité de remboursement',
      valeurActuelle: tauxEndettement,
      valeurReference: benchmarks.tauxEndettement.max,
    })
  }

  // Trésorerie négative
  if (donnees.tresorerie < 0) {
    anomalies.push({
      id: 'tresorerie_negative',
      type: 'financiere',
      severite: 'alerte',
      titre: 'Trésorerie négative',
      description: `La trésorerie est de ${formatEuro(donnees.tresorerie)}, indiquant des difficultés de liquidité.`,
      impact: 'Risque de cessation de paiement, besoin de financement',
      recommendation: 'Négocier avec les banques, optimiser le BFR',
      valeurActuelle: donnees.tresorerie,
      valeurReference: 0,
    })
  }

  // Trésorerie excessive (peut être un problème pour la valorisation)
  if (donnees.tresorerie > donnees.ca * 0.5 && donnees.ca > 0) {
    anomalies.push({
      id: 'tresorerie_excessive',
      type: 'info' as any, // On force le type car c'est plutôt une info
      severite: 'info',
      titre: 'Trésorerie importante',
      description: `La trésorerie représente ${((donnees.tresorerie / donnees.ca) * 100).toFixed(0)}% du CA.`,
      impact: 'La valorisation peut inclure cette trésorerie excédentaire',
      recommendation: 'Séparer la valorisation opérationnelle de la trésorerie excédentaire',
      valeurActuelle: donnees.tresorerie,
      valeurReference: donnees.ca * 0.2,
    })
  }

  // =========================================
  // 3. ANOMALIES DE COHÉRENCE
  // =========================================

  // CA très faible
  if (donnees.ca > 0 && donnees.ca < 50000) {
    anomalies.push({
      id: 'ca_tres_faible',
      type: 'operationnelle',
      severite: 'attention',
      titre: 'Chiffre d\'affaires très faible',
      description: `Le CA de ${formatEuro(donnees.ca)} est très faible pour une cession d'entreprise.`,
      impact: 'Valorisation limitée, peu d\'intérêt pour des repreneurs classiques',
      recommendation: 'Envisager une cession de fonds de commerce plutôt que de titres',
      valeurActuelle: donnees.ca,
      valeurReference: 100000,
    })
  }

  // EBITDA > CA (incohérence)
  if (donnees.ebitda > donnees.ca && donnees.ca > 0) {
    anomalies.push({
      id: 'ebitda_incoherent',
      type: 'financiere',
      severite: 'alerte',
      titre: 'EBITDA incohérent',
      description: `L'EBITDA (${formatEuro(donnees.ebitda)}) est supérieur au CA (${formatEuro(donnees.ca)}), ce qui est anormal.`,
      impact: 'Données financières à vérifier',
      recommendation: 'Vérifier les données saisies ou les comptes',
      valeurActuelle: donnees.ebitda,
      valeurReference: donnees.ca,
    })
  }

  // Résultat net > EBITDA (incohérence possible)
  if (donnees.resultatNet > donnees.ebitda && donnees.ebitda > 0) {
    anomalies.push({
      id: 'resultat_superieur_ebitda',
      type: 'financiere',
      severite: 'info',
      titre: 'Résultat net supérieur à l\'EBITDA',
      description: 'Le résultat net est supérieur à l\'EBITDA, ce qui peut indiquer des produits exceptionnels.',
      impact: 'Vérifier la récurrence des résultats',
      recommendation: 'Identifier les éléments exceptionnels non récurrents',
      valeurActuelle: donnees.resultatNet,
      valeurReference: donnees.ebitda,
    })
  }

  // =========================================
  // 4. ANOMALIES SECTORIELLES
  // =========================================

  // Charges de personnel (si disponible)
  if (donnees.chargesPersonnel !== undefined && donnees.ca > 0) {
    const tauxCharges = (donnees.chargesPersonnel / donnees.ca) * 100
    const benchCharges = benchmarks.tauxChargesPersonnel

    if (benchCharges) {
      if (tauxCharges > benchCharges.max * 1.2) {
        anomalies.push({
          id: 'charges_personnel_elevees',
          type: 'sectorielle',
          severite: 'attention',
          titre: 'Charges de personnel élevées',
          description: `Les charges de personnel représentent ${tauxCharges.toFixed(0)}% du CA vs ${benchCharges.max}% maximum sectoriel.`,
          impact: 'Rentabilité sous pression, marge de manœuvre limitée',
          recommendation: 'Analyser la productivité et la structure de rémunération',
          valeurActuelle: tauxCharges,
          valeurReference: benchCharges.max,
        })
      }
    }
  }

  // Achats/marchandises (si disponible)
  if (donnees.achats !== undefined && donnees.ca > 0) {
    const tauxAchats = (donnees.achats / donnees.ca) * 100
    const benchAchats = benchmarks.tauxAchats

    if (benchAchats) {
      if (tauxAchats > benchAchats.max * 1.1) {
        anomalies.push({
          id: 'achats_eleves',
          type: 'sectorielle',
          severite: 'attention',
          titre: 'Coût des achats élevé',
          description: `Les achats représentent ${tauxAchats.toFixed(0)}% du CA vs ${benchAchats.max}% maximum sectoriel.`,
          impact: 'Marge brute dégradée',
          recommendation: 'Renégocier avec les fournisseurs, optimiser les achats',
          valeurActuelle: tauxAchats,
          valeurReference: benchAchats.max,
        })
      }
    }
  }

  // =========================================
  // CALCUL DU SCORE
  // =========================================

  let score = 100
  for (const anomalie of anomalies) {
    switch (anomalie.severite) {
      case 'critique':
        score -= 30
        break
      case 'alerte':
        score -= 15
        break
      case 'attention':
        score -= 8
        break
      case 'info':
        score -= 2
        break
    }
  }
  score = Math.max(0, score)

  // =========================================
  // GÉNÉRATION DU RÉSUMÉ
  // =========================================

  const resume = genererResume(anomalies, score)

  return { anomalies, score, resume }
}

/**
 * Génère un résumé textuel des anomalies
 */
function genererResume(anomalies: Anomalie[], score: number): string {
  if (anomalies.length === 0) {
    return '✅ Aucune anomalie détectée. Les indicateurs financiers sont cohérents avec les normes sectorielles.'
  }

  const critiques = anomalies.filter(a => a.severite === 'critique')
  const alertes = anomalies.filter(a => a.severite === 'alerte')
  const attentions = anomalies.filter(a => a.severite === 'attention')

  const parties: string[] = []

  if (critiques.length > 0) {
    parties.push(`⛔ ${critiques.length} point(s) critique(s) identifié(s)`)
  }
  if (alertes.length > 0) {
    parties.push(`🔴 ${alertes.length} alerte(s)`)
  }
  if (attentions.length > 0) {
    parties.push(`🟠 ${attentions.length} point(s) d'attention`)
  }

  let qualification: string
  if (score >= 80) {
    qualification = 'Situation globalement saine'
  } else if (score >= 60) {
    qualification = 'Quelques points à surveiller'
  } else if (score >= 40) {
    qualification = 'Situation fragile nécessitant attention'
  } else {
    qualification = 'Situation préoccupante'
  }

  return `${parties.join(' | ')}\n\n**${qualification}** (score: ${score}/100)`
}

/**
 * Formate les anomalies en markdown pour l'affichage
 * GRATUIT - Aucun appel API
 */
export function formaterAnomaliesMarkdown(resultat: ResultatDetection): string {
  const lignes: string[] = [
    '## Analyse des risques et anomalies\n',
    resultat.resume,
    '',
  ]

  if (resultat.anomalies.length > 0) {
    // Grouper par sévérité
    const groupes: Record<SeveriteAnomalie, Anomalie[]> = {
      critique: [],
      alerte: [],
      attention: [],
      info: [],
    }

    for (const anomalie of resultat.anomalies) {
      groupes[anomalie.severite].push(anomalie)
    }

    // Afficher par ordre de sévérité
    const ordreAffichage: SeveriteAnomalie[] = ['critique', 'alerte', 'attention', 'info']
    const emojis: Record<SeveriteAnomalie, string> = {
      critique: '⛔',
      alerte: '🔴',
      attention: '🟠',
      info: 'ℹ️',
    }

    for (const severite of ordreAffichage) {
      const groupe = groupes[severite]
      if (groupe.length === 0) continue

      lignes.push(`### ${emojis[severite]} ${severite.charAt(0).toUpperCase() + severite.slice(1)}`)
      lignes.push('')

      for (const anomalie of groupe) {
        lignes.push(`**${anomalie.titre}**`)
        lignes.push(anomalie.description)
        lignes.push(`- _Impact:_ ${anomalie.impact}`)
        lignes.push(`- _Recommandation:_ ${anomalie.recommendation}`)
        lignes.push('')
      }
    }
  }

  return lignes.join('\n')
}

/**
 * Formate un montant en euros
 */
function formatEuro(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(montant)
}

/**
 * Vérifie rapidement si les données présentent des anomalies critiques
 * GRATUIT - Utilisé pour le routage des modèles
 */
export function aDesAnomaliesCritiques(
  donnees: DonneesFinancieres,
  secteur: string
): boolean {
  const resultat = detecterAnomalies(donnees, secteur)
  return resultat.anomalies.some(a => a.severite === 'critique')
}

/**
 * Retourne un score de complexité pour le routage des modèles
 * 0-30: simple (Haiku), 30-70: moyen (Haiku/Sonnet), 70+: complexe (Sonnet)
 * GRATUIT
 */
export function calculerScoreComplexite(
  donnees: DonneesFinancieres,
  secteur: string
): number {
  let score = 0
  const resultat = detecterAnomalies(donnees, secteur)

  // Points de base selon les anomalies
  for (const anomalie of resultat.anomalies) {
    switch (anomalie.severite) {
      case 'critique':
        score += 25
        break
      case 'alerte':
        score += 15
        break
      case 'attention':
        score += 8
        break
      case 'info':
        score += 3
        break
    }
  }

  // Bonus de complexité pour secteurs particuliers
  const secteursComplexes = ['saas', 'industrie']
  if (secteursComplexes.includes(secteur)) {
    score += 15
  }

  // Bonus si données incomplètes
  if (donnees.chargesPersonnel === undefined || donnees.achats === undefined) {
    score += 10
  }

  // Bonus si situation atypique
  const margeEBITDA = donnees.ca > 0 ? (donnees.ebitda / donnees.ca) * 100 : 0
  const benchmarks = BENCHMARKS_SECTEUR[secteur] || BENCHMARKS_SECTEUR['services']

  // Marge exceptionnellement haute ou basse = cas atypique
  if (margeEBITDA > benchmarks.margeEBITDA.excellent * 1.5 || margeEBITDA < 0) {
    score += 15
  }

  return Math.min(100, score)
}
