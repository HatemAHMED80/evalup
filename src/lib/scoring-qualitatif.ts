// Scoring qualitatif - Critères non-financiers impactant la valorisation

// Catégories de questions
export type CategorieQuestion =
  | 'dependance-dirigeant'
  | 'concentration-clients'
  | 'recurrence-ca'
  | 'equipe'
  | 'actifs'

// Structure d'une question
export interface QuestionQualitative {
  id: string
  categorie: CategorieQuestion
  question: string
  description?: string
  options: OptionReponse[]
}

// Option de réponse avec son impact
export interface OptionReponse {
  valeur: number  // 1-5, où 1 = très négatif, 5 = très positif
  label: string
  impact: number  // Impact en pourcentage sur la valorisation (-10 à +10)
}

// Réponse de l'utilisateur
export interface ReponseQualitative {
  questionId: string
  valeur: number
}

// Résultat du scoring qualitatif
export interface ResultatQualitatif {
  scoreTotal: number           // Score global sur 100
  impactValorisationPct: number  // Impact total en % (-20 à +20)
  detailParCategorie: {
    categorie: CategorieQuestion
    nom: string
    score: number
    impact: number
  }[]
}

// Les 15 questions du questionnaire qualitatif
export const QUESTIONS_QUALITATIVES: QuestionQualitative[] = [
  // === DÉPENDANCE AU DIRIGEANT ===
  {
    id: 'dirigeant-1',
    categorie: 'dependance-dirigeant',
    question: "L'entreprise peut-elle fonctionner sans vous pendant 1 mois ?",
    description: "Évaluez si l'activité continue normalement en votre absence",
    options: [
      { valeur: 1, label: "Non, tout s'arrête", impact: -8 },
      { valeur: 2, label: "Difficilement, beaucoup de problèmes", impact: -4 },
      { valeur: 3, label: "Oui mais avec des difficultés", impact: 0 },
      { valeur: 4, label: "Oui, avec une légère baisse d'activité", impact: 3 },
      { valeur: 5, label: "Oui, sans aucun problème", impact: 6 },
    ],
  },
  {
    id: 'dirigeant-2',
    categorie: 'dependance-dirigeant',
    question: "Avez-vous documenté vos processus métier clés ?",
    description: "Procédures, modes opératoires, documentation interne",
    options: [
      { valeur: 1, label: "Aucune documentation", impact: -4 },
      { valeur: 2, label: "Très peu documenté", impact: -2 },
      { valeur: 3, label: "Partiellement documenté", impact: 0 },
      { valeur: 4, label: "Bien documenté", impact: 2 },
      { valeur: 5, label: "Entièrement documenté et à jour", impact: 4 },
    ],
  },
  {
    id: 'dirigeant-3',
    categorie: 'dependance-dirigeant',
    question: "Les relations clients clés sont-elles portées uniquement par vous ?",
    options: [
      { valeur: 1, label: "Oui, exclusivement par moi", impact: -6 },
      { valeur: 2, label: "Principalement par moi", impact: -3 },
      { valeur: 3, label: "Partagées avec l'équipe", impact: 1 },
      { valeur: 4, label: "Principalement par l'équipe", impact: 3 },
      { valeur: 5, label: "Entièrement gérées par l'équipe", impact: 5 },
    ],
  },

  // === CONCENTRATION CLIENTS ===
  {
    id: 'clients-1',
    categorie: 'concentration-clients',
    question: "Quel pourcentage du CA représente votre plus gros client ?",
    options: [
      { valeur: 1, label: "Plus de 50%", impact: -8 },
      { valeur: 2, label: "Entre 30% et 50%", impact: -4 },
      { valeur: 3, label: "Entre 20% et 30%", impact: -1 },
      { valeur: 4, label: "Entre 10% et 20%", impact: 2 },
      { valeur: 5, label: "Moins de 10%", impact: 4 },
    ],
  },
  {
    id: 'clients-2',
    categorie: 'concentration-clients',
    question: "Vos 5 plus gros clients représentent quel % du CA ?",
    options: [
      { valeur: 1, label: "Plus de 80%", impact: -6 },
      { valeur: 2, label: "Entre 60% et 80%", impact: -3 },
      { valeur: 3, label: "Entre 40% et 60%", impact: 0 },
      { valeur: 4, label: "Entre 20% et 40%", impact: 2 },
      { valeur: 5, label: "Moins de 20%", impact: 4 },
    ],
  },
  {
    id: 'clients-3',
    categorie: 'concentration-clients',
    question: "Avez-vous des contrats formalisés avec vos clients principaux ?",
    options: [
      { valeur: 1, label: "Non, aucun contrat", impact: -4 },
      { valeur: 2, label: "Très peu de contrats", impact: -2 },
      { valeur: 3, label: "Environ la moitié", impact: 0 },
      { valeur: 4, label: "La plupart ont des contrats", impact: 2 },
      { valeur: 5, label: "Tous les clients majeurs sous contrat", impact: 4 },
    ],
  },

  // === RÉCURRENCE DU CA ===
  {
    id: 'recurrence-1',
    categorie: 'recurrence-ca',
    question: "Quelle part de votre CA est récurrente (abonnements, contrats pluriannuels) ?",
    options: [
      { valeur: 1, label: "Moins de 10%", impact: -4 },
      { valeur: 2, label: "Entre 10% et 30%", impact: -1 },
      { valeur: 3, label: "Entre 30% et 50%", impact: 2 },
      { valeur: 4, label: "Entre 50% et 70%", impact: 5 },
      { valeur: 5, label: "Plus de 70%", impact: 8 },
    ],
  },
  {
    id: 'recurrence-2',
    categorie: 'recurrence-ca',
    question: "Quel est votre taux de rétention clients annuel ?",
    description: "Pourcentage de clients qui restent d'une année sur l'autre",
    options: [
      { valeur: 1, label: "Moins de 50%", impact: -5 },
      { valeur: 2, label: "Entre 50% et 70%", impact: -2 },
      { valeur: 3, label: "Entre 70% et 85%", impact: 1 },
      { valeur: 4, label: "Entre 85% et 95%", impact: 4 },
      { valeur: 5, label: "Plus de 95%", impact: 6 },
    ],
  },
  {
    id: 'recurrence-3',
    categorie: 'recurrence-ca',
    question: "Avez-vous un carnet de commandes ou backlog ?",
    options: [
      { valeur: 1, label: "Non, tout est vendu au jour le jour", impact: -3 },
      { valeur: 2, label: "Quelques semaines de visibilité", impact: 0 },
      { valeur: 3, label: "1 à 3 mois de visibilité", impact: 2 },
      { valeur: 4, label: "3 à 6 mois de visibilité", impact: 4 },
      { valeur: 5, label: "Plus de 6 mois de visibilité", impact: 6 },
    ],
  },

  // === ÉQUIPE ===
  {
    id: 'equipe-1',
    categorie: 'equipe',
    question: "Avez-vous une équipe de management en place ?",
    description: "Responsables capables de gérer l'entreprise au quotidien",
    options: [
      { valeur: 1, label: "Non, je gère tout seul", impact: -6 },
      { valeur: 2, label: "Un bras droit mais pas d'équipe", impact: -2 },
      { valeur: 3, label: "Quelques responsables mais incomplet", impact: 1 },
      { valeur: 4, label: "Équipe de management en place", impact: 4 },
      { valeur: 5, label: "Équipe complète et autonome", impact: 6 },
    ],
  },
  {
    id: 'equipe-2',
    categorie: 'equipe',
    question: "Quelle est l'ancienneté moyenne de vos employés clés ?",
    options: [
      { valeur: 1, label: "Moins d'1 an", impact: -4 },
      { valeur: 2, label: "1 à 2 ans", impact: -1 },
      { valeur: 3, label: "2 à 4 ans", impact: 1 },
      { valeur: 4, label: "4 à 7 ans", impact: 3 },
      { valeur: 5, label: "Plus de 7 ans", impact: 5 },
    ],
  },
  {
    id: 'equipe-3',
    categorie: 'equipe',
    question: "Les compétences critiques sont-elles réparties dans l'équipe ?",
    description: "Ou concentrées sur une seule personne",
    options: [
      { valeur: 1, label: "Une seule personne détient les compétences clés", impact: -5 },
      { valeur: 2, label: "2-3 personnes irremplaçables", impact: -2 },
      { valeur: 3, label: "Compétences partiellement distribuées", impact: 0 },
      { valeur: 4, label: "Bonne répartition avec redondance", impact: 3 },
      { valeur: 5, label: "Toutes les compétences sont doublées", impact: 5 },
    ],
  },

  // === ACTIFS ===
  {
    id: 'actifs-1',
    categorie: 'actifs',
    question: "Êtes-vous propriétaire des locaux d'exploitation ?",
    options: [
      { valeur: 1, label: "Non, bail précaire ou court terme", impact: -3 },
      { valeur: 2, label: "Bail commercial standard", impact: 0 },
      { valeur: 3, label: "Bail commercial long terme (9 ans+)", impact: 2 },
      { valeur: 4, label: "Propriétaire partiel", impact: 4 },
      { valeur: 5, label: "Propriétaire des murs", impact: 6 },
    ],
  },
  {
    id: 'actifs-2',
    categorie: 'actifs',
    question: "Possédez-vous des actifs immatériels protégés ?",
    description: "Brevets, marques déposées, licences exclusives",
    options: [
      { valeur: 1, label: "Aucun actif protégé", impact: -2 },
      { valeur: 2, label: "Marque déposée uniquement", impact: 0 },
      { valeur: 3, label: "Quelques actifs protégés", impact: 2 },
      { valeur: 4, label: "Portfolio de marques/brevets", impact: 4 },
      { valeur: 5, label: "Actifs immatériels stratégiques importants", impact: 6 },
    ],
  },
  {
    id: 'actifs-3',
    categorie: 'actifs',
    question: "Quel est l'état de vos équipements et outils de production ?",
    options: [
      { valeur: 1, label: "Vétustes, investissements majeurs nécessaires", impact: -4 },
      { valeur: 2, label: "Vieillissants, renouvellement à prévoir", impact: -2 },
      { valeur: 3, label: "État correct, maintenance régulière", impact: 0 },
      { valeur: 4, label: "Bon état, récemment mis à jour", impact: 2 },
      { valeur: 5, label: "Équipements neufs ou très récents", impact: 4 },
    ],
  },
]

// Noms des catégories pour l'affichage
export const NOMS_CATEGORIES: Record<CategorieQuestion, string> = {
  'dependance-dirigeant': 'Dépendance au dirigeant',
  'concentration-clients': 'Concentration clients',
  'recurrence-ca': 'Récurrence du CA',
  'equipe': 'Équipe et compétences',
  'actifs': 'Actifs et patrimoine',
}

// Calcule le score qualitatif à partir des réponses
export function calculerScoreQualitatif(reponses: ReponseQualitative[]): ResultatQualitatif {
  // Grouper les réponses par catégorie
  const reponsesParCategorie = new Map<CategorieQuestion, ReponseQualitative[]>()

  for (const reponse of reponses) {
    const question = QUESTIONS_QUALITATIVES.find(q => q.id === reponse.questionId)
    if (question) {
      const existing = reponsesParCategorie.get(question.categorie) || []
      existing.push(reponse)
      reponsesParCategorie.set(question.categorie, existing)
    }
  }

  // Calculer le score et l'impact par catégorie
  const detailParCategorie: ResultatQualitatif['detailParCategorie'] = []
  let impactTotal = 0
  let scoreTotal = 0
  let nbQuestions = 0

  for (const [categorie, reponsesCategorie] of reponsesParCategorie) {
    let scoreCategorie = 0
    let impactCategorie = 0

    for (const reponse of reponsesCategorie) {
      const question = QUESTIONS_QUALITATIVES.find(q => q.id === reponse.questionId)
      if (question) {
        const option = question.options.find(o => o.valeur === reponse.valeur)
        if (option) {
          scoreCategorie += reponse.valeur
          impactCategorie += option.impact
          nbQuestions++
        }
      }
    }

    // Normaliser le score sur 100 pour la catégorie
    const nbQuestionsCategorie = reponsesCategorie.length
    const scoreNormalise = nbQuestionsCategorie > 0
      ? Math.round((scoreCategorie / (nbQuestionsCategorie * 5)) * 100)
      : 50

    detailParCategorie.push({
      categorie,
      nom: NOMS_CATEGORIES[categorie],
      score: scoreNormalise,
      impact: impactCategorie,
    })

    scoreTotal += scoreCategorie
    impactTotal += impactCategorie
  }

  // Score global normalisé sur 100
  const scoreGlobal = nbQuestions > 0
    ? Math.round((scoreTotal / (nbQuestions * 5)) * 100)
    : 50

  // Limiter l'impact à ±20%
  const impactLimite = Math.max(-20, Math.min(20, impactTotal))

  return {
    scoreTotal: scoreGlobal,
    impactValorisationPct: impactLimite,
    detailParCategorie,
  }
}

// Convertit les réponses URL en tableau de ReponseQualitative
export function parseReponsesFromParams(params: Record<string, string>): ReponseQualitative[] {
  const reponses: ReponseQualitative[] = []

  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith('q_')) {
      const questionId = key.replace('q_', '')
      const valeur = parseInt(value, 10)
      if (!isNaN(valeur) && valeur >= 1 && valeur <= 5) {
        reponses.push({ questionId, valeur })
      }
    }
  }

  return reponses
}

// Sérialise les réponses pour l'URL
export function serializeReponsesToParams(reponses: ReponseQualitative[]): Record<string, string> {
  const params: Record<string, string> = {}

  for (const reponse of reponses) {
    params[`q_${reponse.questionId}`] = reponse.valeur.toString()
  }

  return params
}
