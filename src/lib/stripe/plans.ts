// Configuration des plans et tarifs - Nouveau modèle v2
// Flash gratuit -> Achat unique 79€ -> Abonnements Pro

export const PLANS = {
  // ============================================
  // TIER GRATUIT : Évaluation Flash
  // ============================================
  flash: {
    id: 'flash',
    name: 'Flash',
    description: 'Évaluation indicative gratuite',
    price: 0,
    type: 'free' as const,
    limits: {
      questionsMax: 8,
      documentsMax: 0,
      evalsPerMonth: null, // Illimité mais basique
    },
    features: [
      'Diagnostic gratuit',
      'Valorisation indicative (fourchette large)',
      'Données Pappers incluses',
    ],
    limitations: [
      'Pas d\'upload de documents',
      'Pas de retraitements EBITDA',
      'Pas d\'analyse des risques',
      'Pas de rapport PDF',
    ],
  },

  // ============================================
  // ACHAT UNIQUE : Évaluation Complète
  // ============================================
  eval_complete: {
    id: 'eval_complete',
    name: 'Évaluation Complète',
    description: 'Valorisation précise avec rapport PDF',
    price: 79,
    priceId: process.env.STRIPE_PRICE_EVAL_COMPLETE || 'price_eval_complete',
    type: 'one_time' as const,
    limits: {
      questionsMax: null, // Illimite
      documentsMax: null, // Illimite
      evalsPerMonth: 1, // Achat unitaire
    },
    features: [
      'Valorisation précise (fourchette serrée)',
      'Questions illimitées',
      'Upload documents illimité',
      'Retraitements EBITDA complets',
      'Analyse des risques et décotes',
      '5 méthodes de valorisation',
      'Rapport PDF professionnel',
    ],
    limitations: [],
  },

  // ============================================
  // ABONNEMENT : Pro 10 (199€/mois)
  // ============================================
  pro_10: {
    id: 'pro_10',
    name: 'Pro 10',
    description: 'Pour les professionnels',
    price: 199,
    priceId: process.env.STRIPE_PRICE_PRO_10 || 'price_pro_10',
    type: 'subscription' as const,
    limits: {
      questionsMax: null,
      documentsMax: null,
      evalsPerMonth: 10,
    },
    features: [
      '10 évaluations complètes/mois',
      'Tout inclus (docs, PDF, etc.)',
      'Historique illimité',
      'Support prioritaire',
    ],
    limitations: [],
  },

  // ============================================
  // ABONNEMENT : Pro Illimite (399€/mois)
  // ============================================
  pro_unlimited: {
    id: 'pro_unlimited',
    name: 'Pro Illimité',
    description: 'Pour les cabinets et M&A',
    price: 399,
    priceId: process.env.STRIPE_PRICE_PRO_UNLIMITED || 'price_pro_unlimited',
    type: 'subscription' as const,
    limits: {
      questionsMax: null,
      documentsMax: null,
      evalsPerMonth: null, // Illimite
    },
    features: [
      'Évaluations illimitées',
      'Tout inclus (docs, PDF, etc.)',
      'Historique illimité',
      'Support prioritaire',
      'API access (bientôt)',
    ],
    limitations: [],
  },

  // ============================================
  // LEGACY : Anciens plans (pour compatibilité)
  // ============================================
  free: {
    id: 'free',
    name: 'Gratuit (Legacy)',
    description: 'Ancien plan gratuit',
    price: 0,
    type: 'legacy' as const,
    limits: {
      questionsMax: 8,
      documentsMax: 0,
      evalsPerMonth: null,
    },
    features: [],
    limitations: [],
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Mensuel (Legacy)',
    description: 'Ancien plan pro',
    price: 19,
    priceId: 'price_1SvLyTCWyr5Ksh2YRRZo9yqT',
    type: 'legacy' as const,
    limits: {
      questionsMax: null,
      documentsMax: null,
      evalsPerMonth: null,
    },
    features: [],
    limitations: [],
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro Annuel (Legacy)',
    description: 'Ancien plan pro annuel',
    price: 169,
    priceId: 'price_1SvLyVCWyr5Ksh2YsERKYCmv',
    type: 'legacy' as const,
    limits: {
      questionsMax: null,
      documentsMax: null,
      evalsPerMonth: null,
    },
    features: [],
    limitations: [],
  },
} as const

export type PlanId = keyof typeof PLANS
export type PlanType = 'free' | 'one_time' | 'subscription' | 'legacy'

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

export function getPlan(planId: string) {
  return PLANS[planId as PlanId] || PLANS.flash
}

/**
 * Vérifie si l'utilisateur a un plan Pro (abonnement actif)
 */
export function isPro(planId: string | null | undefined): boolean {
  if (!planId) return false
  const plan = PLANS[planId as PlanId]
  return plan?.type === 'subscription'
}

/**
 * Vérifie si l'utilisateur peut faire une évaluation complète
 * (soit achat unique, soit abonnement)
 */
export function canDoCompleteEval(planId: string | null | undefined): boolean {
  if (!planId) return false
  const plan = PLANS[planId as PlanId]
  return plan?.type === 'one_time' || plan?.type === 'subscription'
}

/**
 * Retourne la limite de questions pour un plan
 */
export function getQuestionsLimit(planId: string | null | undefined): number | null {
  const plan = getPlan(planId || 'flash')
  return plan.limits.questionsMax
}

/**
 * Retourne la limite de documents pour un plan
 */
export function getDocumentsLimit(planId: string | null | undefined): number | null {
  const plan = getPlan(planId || 'flash')
  return plan.limits.documentsMax
}

/**
 * Retourne la limite d'évaluations par mois pour un plan
 */
export function getEvalsPerMonthLimit(planId: string | null | undefined): number | null {
  const plan = getPlan(planId || 'flash')
  return plan.limits.evalsPerMonth
}

/**
 * Vérifie si le plan permet l'upload de documents
 */
export function canUploadDocuments(planId: string | null | undefined): boolean {
  const limit = getDocumentsLimit(planId)
  return limit === null || limit > 0
}

/**
 * Vérifie si le plan permet le téléchargement du rapport PDF
 */
export function canDownloadPDF(planId: string | null | undefined): boolean {
  if (!planId) return false
  const plan = PLANS[planId as PlanId]
  return plan?.type === 'one_time' || plan?.type === 'subscription'
}

// Legacy: pour compatibilité avec l'ancien code
export function getTokenLimit(planId: string | null | undefined): number {
  // Les nouveaux plans n'utilisent plus les tokens comme limite
  // On garde cette fonction pour la compatibilité
  if (isPro(planId)) return 1_000_000 // Pratiquement illimité
  return 50_000 // Gratuit
}
