// Scénarios de test E2E détaillés pour le flow complet diagnostic → chat → PDF
// Chaque scénario inclut les données Pappers attendues, les inputs diagnostic,
// les réponses chat, et les vérifications PDF.

export interface TestScenario {
  name: string
  siren: string
  activityType: string
  // Données attendues de Pappers (pour vérification)
  expectedPappers: {
    companyName: string
    ca?: number
    ebitda?: number
    tresorerie?: number
  }
  // Données à saisir dans le diagnostic
  diagnosticInputs: {
    confirmPappers: boolean
    overrides?: {
      ca?: number
      ebitda?: number
      tresorerie?: number
    }
    concentration: string // "low" | "medium" | "high" | "critical"
    remuDirigeant: string // "0" | "30k" | "60k" | "100k" | "150k+"
    mrr?: number // SaaS uniquement
  }
  // Réponses à donner dans le chat (texte libre)
  chatMessages: string[]
  // Vérifications attendues dans le rapport PDF
  expectedReport: {
    // Fourchette de valorisation acceptable
    valorisationMin: number
    valorisationMax: number
    // Note attendue
    noteMin: string // "A" | "B" | "C" | "D" | "E"
    noteMax: string
    // La confiance ne doit PAS être "Élevée" si pas de retraitements
    confidenceMaxIfNoRetraitements: string // "Moyenne"
    // Points de vigilance qui DOIVENT apparaître (dans fullText)
    requiredKeywords: string[]
    // Mots qui NE DOIVENT PAS apparaître
    forbiddenKeywords: string[]
    // L'effectif ne doit pas dépasser ce nombre (anti-code tranche brut)
    effectifMustNotExceed: number
  }
}

// ═══════════════════════════════════════════════
// SCÉNARIO 1 — POSSE (SaaS hyper-croissance)
// Le cas qui a révélé tous les bugs initiaux
// ═══════════════════════════════════════════════

export const SCENARIO_POSSE: TestScenario = {
  name: 'POSSE — SaaS hyper-croissance avec churn critique',
  siren: '895291052',
  activityType: 'saas',
  expectedPappers: {
    companyName: 'POSSE',
    ca: 30000,
    tresorerie: 103916,
  },
  diagnosticInputs: {
    confirmPappers: false,
    overrides: { ca: 30000 },
    concentration: 'critical',
    remuDirigeant: '0',
    mrr: 200000,
  },
  chatMessages: [
    'Notre churn mensuel est de 20%, ce qui est très élevé. On perd beaucoup de clients.',
    'Le NRR est catastrophique, en dessous de 60%. Les clients downgrade beaucoup.',
    'Notre CAC est de 60€ avec un payback de 12 mois. Acquisition principalement paid.',
    'On a environ 12 mois de runway. 5 personnes dans l\'équipe.',
    'Nos 2 plus gros clients font 50% et 90% du CA pour le top 5. Très concentré.',
    'On est 2 associés, 50/50. Contrats mensuels sans engagement.',
  ],
  expectedReport: {
    valorisationMin: 3_000_000,
    valorisationMax: 10_000_000,
    noteMin: 'D',
    noteMax: 'D',
    confidenceMaxIfNoRetraitements: 'Moyenne',
    requiredKeywords: ['churn', 'concentration'],
    forbiddenKeywords: ['250001', '250 001 collaborateurs'],
    effectifMustNotExceed: 100,
  },
}

// ═══════════════════════════════════════════════
// SCÉNARIO 2 — Cabinet de conseil classique
// Test du retraitement salaire dirigeant
// ═══════════════════════════════════════════════

export const SCENARIO_CONSEIL: TestScenario = {
  name: 'Cabinet conseil — Retraitement salaire dirigeant',
  siren: '652014051', // Carrefour pour test
  activityType: 'conseil',
  expectedPappers: {
    companyName: 'CARREFOUR',
  },
  diagnosticInputs: {
    confirmPappers: true,
    concentration: 'medium',
    remuDirigeant: '30k',
  },
  chatMessages: [
    'On fait du conseil en stratégie pour des ETI. 3 associés complémentaires.',
    'Croissance de 15% par an. Bonne visibilité avec contrats-cadres annuels.',
    'Un associé veut sortir (40% du capital). On cherche une valorisation pour le rachat.',
    'Chaque associé se verse 8000€ brut + dividendes. Véhicules de fonction.',
    '5 clients font 70% du CA. Plus gros client = 25%.',
    '60% en contrats-cadres annuels, 40% missions ponctuelles.',
  ],
  expectedReport: {
    valorisationMin: 200_000,
    valorisationMax: 5_000_000,
    noteMin: 'C',
    noteMax: 'A',
    confidenceMaxIfNoRetraitements: 'Moyenne',
    requiredKeywords: [],
    forbiddenKeywords: ['250001'],
    effectifMustNotExceed: 500_000,
  },
}

// ═══════════════════════════════════════════════
// SCÉNARIO 3 — Micro-entreprise (< 50k CA)
// Test du plafond de score
// ═══════════════════════════════════════════════

export const SCENARIO_MICRO: TestScenario = {
  name: 'Micro-entreprise — Plafond score B max',
  siren: '443061841', // Boulangerie
  activityType: 'services',
  expectedPappers: {
    companyName: '', // Will be filled by Pappers lookup
  },
  diagnosticInputs: {
    confirmPappers: true,
    concentration: 'high',
    remuDirigeant: '0',
  },
  chatMessages: [
    'Petite activité de services, principalement du bouche à oreille.',
    'CA stable autour de 45000€, pas de croissance significative.',
    'Je suis seul, pas de salarié. Forte dépendance sur moi.',
  ],
  expectedReport: {
    valorisationMin: 10_000,
    valorisationMax: 500_000,
    noteMin: 'D',
    noteMax: 'B',
    confidenceMaxIfNoRetraitements: 'Moyenne',
    requiredKeywords: [],
    forbiddenKeywords: ['250001'],
    effectifMustNotExceed: 50,
  },
}

export const ALL_SCENARIOS: TestScenario[] = [
  SCENARIO_POSSE,
  SCENARIO_CONSEIL,
  SCENARIO_MICRO,
]
