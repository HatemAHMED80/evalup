/**
 * Schemas Zod pour la validation des entrées API
 */

import { z } from 'zod'

// ============================================
// CHAT API
// ============================================

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(100_000),
})

const entrepriseContextSchema = z.object({
  siren: z.string().regex(/^\d{9,14}$/).optional(),
  nom: z.string().max(500).optional(),
  secteur: z.string().max(200).optional(),
  codeNaf: z.string().max(10).optional(),
  effectif: z.string().max(50).optional(),
}).optional()

const evaluationProgressSchema = z.object({
  step: z.number().int().min(1).max(20).optional(),
}).optional()

export const chatBodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(200),
  context: z.object({
    entreprise: entrepriseContextSchema,
    financials: z.record(z.string(), z.unknown()).optional(),
    evaluationProgress: evaluationProgressSchema,
    parcours: z.string().max(50).optional(),
    pedagogyLevel: z.string().max(50).optional(),
  }),
  options: z.object({
    // forceModel et skipCache retirés: le serveur contrôle le modèle et le cache
    includeLocalAnalysis: z.boolean().optional(),
  }).optional().default({}),
})

// ============================================
// STRIPE CHECKOUT
// ============================================

export const checkoutBodySchema = z.object({
  planId: z.string().min(1).max(50),
  evaluationId: z.string().uuid().optional().nullable(),
  siren: z.string().regex(/^\d{9,14}$/).optional().nullable(),
  archetypeId: z.string().min(1).max(100).optional().nullable(),
  diagnosticData: z.record(z.string(), z.unknown()).optional().nullable(),
})

// ============================================
// PDF GENERATION
// ============================================

export const pdfBodySchema = z.object({
  entreprise: z.object({
    nom: z.string().min(1).max(500),
    siren: z.string().regex(/^\d{9,14}$/),
    secteur: z.string().max(200).optional(),
    codeNaf: z.string().max(10).optional(),
    effectif: z.string().max(50).optional(),
    formeJuridique: z.string().max(200).optional(),
    dateCreation: z.string().max(50).optional(),
    adresse: z.string().max(500).optional(),
  }),
  valeurEntreprise: z.object({
    moyenne: z.number().positive(),
    min: z.number().optional(),
    max: z.number().optional(),
    methode: z.string().max(200).optional(),
  }),
  // Le reste est flexible car le PDF peut contenir beaucoup de données
}).passthrough()
