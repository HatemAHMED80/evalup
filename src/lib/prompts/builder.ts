// Prompt builder — assemble archétype prompt + modules + données injectées
//
// Architecture cible (MIGRATION-PLAN section 4) :
//   ARCHETYPE_PROMPT_[ID]     — prompt spécifique à l'archétype (200-300 lignes)
//   + MODULES                 — retraitements, décotes, risques, règles conversation
//   + DONNÉES_INJECTÉES       — Pappers, réponses diagnostic, multiples Damodaran
//   + PARCOURS (optionnel)    — vente / achat / associé / etc.

import { getPromptForArchetype, type ArchetypePromptContext } from './archetype-prompts'
import { RETRAITEMENTS_PROMPT } from './modules/retraitements'
import { DATA_UPDATE_PROMPT } from './modules/data-update'
import { DECOTES_PROMPT, RISQUES_PROMPT, FONDS_COMMERCE_PROMPT } from './modules/decotes'
import {
  CONVERSATION_RULES_PROMPT,
  SUGGESTIONS_RULES_PROMPT,
  NUMERIC_FIELDS_RULES_PROMPT,
  BENCHMARK_RULES_PROMPT,
  DOCUMENT_RULES_PROMPT,
  NO_REPEAT_RULES_PROMPT,
  YEAR_REFERENCE_RULES_PROMPT,
  ANOMALY_RULES_PROMPT,
} from './modules/rules'
import { SYSTEM_PROMPTS, PEDAGOGY_PROMPTS, type UserParcours, type PedagogyLevel } from './modules/parcours'
import { EVALUATION_FINALE_PROMPT } from './modules/evaluation-finale'
import type { ConversationContext, BilanAnnuel, ExtractedExercice } from '../anthropic'
import { ARCHETYPES } from '../valuation/archetypes'
import { getMultiplesForArchetype, type ArchetypeMultiples } from '../valuation/multiples'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildPromptOptions {
  /** ID de l'archétype détecté */
  archetypeId: string
  /** Contexte complet de la conversation (entreprise, financials, docs, etc.) */
  context: ConversationContext
  /** Parcours utilisateur (vente, achat, etc.) */
  parcours?: UserParcours
  /** Niveau de pédagogie */
  pedagogyLevel?: PedagogyLevel
  /** Inclure le module fonds de commerce */
  includeFondsCommerce?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getAnneeReference(): number {
  const now = new Date()
  const currentYear = now.getFullYear()
  return now.getMonth() >= 5 ? currentYear : currentYear - 1
}

function formatEntreprise(entreprise: ConversationContext['entreprise']): string {
  return `
**Informations générales :**
- Nom : ${entreprise?.nom || 'Non renseigné'}
- SIREN : ${entreprise?.siren || 'Non renseigné'}
- Secteur : ${entreprise?.secteur || 'Non déterminé'} (${entreprise?.codeNaf || 'N/A'})
- Création : ${entreprise?.dateCreation || 'Non renseigné'}
- Effectif : ${entreprise?.effectif || 'Non renseigné'}
- Localisation : ${entreprise?.adresse || 'Non renseigné'}, ${entreprise?.ville || 'Non renseigné'}
`.trim()
}

function formatDiagnosticData(archetypeId: string): string {
  const archetype = ARCHETYPES[archetypeId]
  if (!archetype) return ''

  return `
**Archétype détecté :** ${archetype.name} ${archetype.icon}
**Méthode principale :** ${archetype.primaryMethod}
**Pourquoi cette méthode :** ${archetype.whyThisMethod}
`.trim()
}

/**
 * Formate les données Pappers (bilans, ratios) pour injection dans le prompt archétype.
 */
function formatPappersData(context: ConversationContext): string {
  const financials = context.financials
  if (!financials?.bilans?.length) {
    return 'Aucune donnée financière Pappers disponible.'
  }

  const dernierBilan = financials.bilans[0]
  const avant = financials.bilans[1]

  const lines: string[] = []
  lines.push(`**Dernier bilan (${dernierBilan.annee}) :**`)
  lines.push(`- CA : ${dernierBilan.chiffre_affaires?.toLocaleString('fr-FR') ?? 'N/A'} €`)
  lines.push(`- Résultat net : ${dernierBilan.resultat_net?.toLocaleString('fr-FR') ?? 'N/A'} €`)
  lines.push(`- Résultat d'exploitation : ${dernierBilan.resultat_exploitation?.toLocaleString('fr-FR') ?? 'N/A'} €`)
  lines.push(`- Trésorerie : ${dernierBilan.tresorerie?.toLocaleString('fr-FR') ?? 'N/A'} €`)
  lines.push(`- Dettes financières : ${dernierBilan.dettes_financieres?.toLocaleString('fr-FR') ?? 'N/A'} €`)
  lines.push(`- Capitaux propres : ${dernierBilan.capitaux_propres?.toLocaleString('fr-FR') ?? 'N/A'} €`)

  if (dernierBilan.immobilisations_corporelles) {
    lines.push(`- Immobilisations corporelles : ${dernierBilan.immobilisations_corporelles.toLocaleString('fr-FR')} €`)
  }
  if (dernierBilan.stocks) {
    lines.push(`- Stocks : ${dernierBilan.stocks.toLocaleString('fr-FR')} €`)
  }
  if (dernierBilan.provisions) {
    lines.push(`- Provisions : ${dernierBilan.provisions.toLocaleString('fr-FR')} €`)
  }

  if (financials.ratios) {
    const r = financials.ratios
    lines.push('')
    lines.push('**Ratios calculés :**')
    if (r.ebitda != null) lines.push(`- EBITDA : ${r.ebitda.toLocaleString('fr-FR')} €`)
    if (r.margeEbitda != null) lines.push(`- Marge EBITDA : ${r.margeEbitda.toFixed(1)}%`)
    if (r.margeNette != null) lines.push(`- Marge nette : ${r.margeNette.toFixed(1)}%`)
  }

  if (avant) {
    lines.push('')
    lines.push(`**Bilan N-1 (${avant.annee}) :**`)
    lines.push(`- CA : ${avant.chiffre_affaires?.toLocaleString('fr-FR') ?? 'N/A'} €`)
    lines.push(`- Résultat net : ${avant.resultat_net?.toLocaleString('fr-FR') ?? 'N/A'} €`)
    if (dernierBilan.chiffre_affaires && avant.chiffre_affaires && avant.chiffre_affaires > 0) {
      const evol = ((dernierBilan.chiffre_affaires - avant.chiffre_affaires) / avant.chiffre_affaires * 100).toFixed(1)
      lines.push(`- Évolution CA : ${parseFloat(evol) >= 0 ? '+' : ''}${evol}%`)
    }
  }

  // Anomalies détectées
  if (financials.anomaliesDetectees?.length) {
    lines.push('')
    lines.push('**⚠️ Anomalies détectées :**')
    for (const a of financials.anomaliesDetectees) {
      lines.push(`- [${a.type.toUpperCase()}] ${a.categorie}: ${a.message}`)
    }
  }

  return lines.join('\n')
}

/**
 * Formate les multiples Damodaran pour injection dans le prompt archétype.
 */
function formatMultiplesData(archetypeId: string): string {
  let multiples: ArchetypeMultiples | undefined
  try {
    multiples = getMultiplesForArchetype(archetypeId)
  } catch {
    // Fichier multiples.json non disponible en dev/test
    return 'Multiples Damodaran non disponibles.'
  }

  if (!multiples) {
    return 'Pas de multiples spécifiques pour cet archétype.'
  }

  const lines: string[] = []
  lines.push(`**Source :** ${multiples.source}`)
  lines.push(`**Secteur Damodaran :** ${multiples.damodaranSector}`)
  lines.push('')
  lines.push('**Multiple principal :**')
  lines.push(`- Métrique : ${multiples.primaryMultiple.metric}`)
  lines.push(`- Fourchette : ${multiples.primaryMultiple.low}x — ${multiples.primaryMultiple.high}x (médiane ${multiples.primaryMultiple.median}x)`)
  lines.push('')
  lines.push('**Multiple secondaire :**')
  lines.push(`- Métrique : ${multiples.secondaryMultiple.metric}`)
  lines.push(`- Fourchette : ${multiples.secondaryMultiple.low}x — ${multiples.secondaryMultiple.high}x (médiane ${multiples.secondaryMultiple.median}x)`)

  return lines.join('\n')
}

/**
 * Formate les données extraites des documents uploadés.
 */
function formatExtractedDocData(documents: ConversationContext['documents']): string {
  if (!documents?.length) {
    return 'Aucun document uploadé.'
  }

  const lines: string[] = []

  for (const doc of documents) {
    lines.push(`**${doc.name}**`)

    if (!doc.analysis || doc.analysis.error || doc.analysis.parseError) {
      lines.push(`  ⚠️ Erreur d'analyse: ${doc.analysis?.error || 'Format non reconnu'}`)
      continue
    }

    const a = doc.analysis
    if (a.typeDocument) lines.push(`  - Type : ${a.typeDocument}`)
    if (a.annee) lines.push(`  - Année : ${a.annee}`)

    if (a.chiffresExtraits) {
      const c = a.chiffresExtraits as Record<string, number | null | Record<string, number>>
      const vals: string[] = []
      if (c.ca) vals.push(`CA: ${(c.ca as number).toLocaleString('fr-FR')} €`)
      if (c.resultatNet) vals.push(`RN: ${(c.resultatNet as number).toLocaleString('fr-FR')} €`)
      if (c.ebitda) vals.push(`EBITDA: ${(c.ebitda as number).toLocaleString('fr-FR')} €`)
      if (c.tresorerie) vals.push(`Tréso: ${(c.tresorerie as number).toLocaleString('fr-FR')} €`)
      if (c.dettes) vals.push(`Dettes: ${(c.dettes as number).toLocaleString('fr-FR')} €`)
      if (vals.length) lines.push(`  - Données : ${vals.join(', ')}`)
    }

    if (a.pointsCles?.length) {
      lines.push(`  - Points clés : ${a.pointsCles.slice(0, 3).join('; ')}`)
    }

    if (a.anomalies?.length) {
      const msgs = a.anomalies.slice(0, 3).map(an => {
        const anomalie = an as { message?: string; categorie?: string }
        return anomalie.message || anomalie.categorie || 'Anomalie'
      })
      lines.push(`  - Alertes : ${msgs.join('; ')}`)
    }

    lines.push('')
  }

  return lines.join('\n').trim() || 'Aucun document uploadé.'
}

/**
 * Formate les données structurées extraites des documents comptables (post-upload).
 * Génère un bloc "DONNÉES DÉJÀ DISPONIBLES" pour injection dans le prompt.
 */
function formatExtractedExercices(context: ConversationContext): string {
  const extracted = context.extractedDocData
  if (!extracted?.exercices?.length) return ''

  const FIELD_LABELS: Record<keyof ExtractedExercice, string> = {
    annee: 'Année',
    ca: 'Chiffre d\'affaires',
    resultat_exploitation: 'Résultat d\'exploitation',
    resultat_net: 'Résultat net',
    ebitda: 'EBITDA',
    dotations_amortissements: 'Dotations aux amortissements',
    dotations_provisions: 'Dotations aux provisions',
    charges_personnel: 'Charges de personnel',
    effectif_moyen: 'Effectif moyen',
    remuneration_dirigeant: 'Rémunération dirigeant',
    loyers: 'Loyers',
    credit_bail: 'Crédit-bail',
    capitaux_propres: 'Capitaux propres',
    dettes_financieres: 'Dettes financières',
    tresorerie: 'Trésorerie',
    total_actif: 'Total actif',
    actif_immobilise: 'Actif immobilisé',
    stocks: 'Stocks',
    creances_clients: 'Créances clients',
    dettes_fournisseurs: 'Dettes fournisseurs',
  }

  const lines: string[] = []
  lines.push('# DONNÉES DÉJÀ DISPONIBLES (extraites des documents comptables)')
  lines.push('')
  lines.push('Ces données ont été extraites automatiquement des documents uploadés par l\'utilisateur et **validées par lui**.')
  lines.push('**NE REDEMANDE PAS ces informations.** Utilise-les directement dans tes calculs.')
  lines.push('')

  for (const exercice of extracted.exercices) {
    lines.push(`## Exercice ${exercice.annee}`)
    lines.push('')

    const available: string[] = []
    const missing: string[] = []

    for (const [key, label] of Object.entries(FIELD_LABELS)) {
      if (key === 'annee') continue
      const val = exercice[key as keyof ExtractedExercice]
      if (val != null) {
        const formatted = key === 'effectif_moyen'
          ? String(val)
          : `${(val as number).toLocaleString('fr-FR')} €`
        available.push(`- **${label}** : ${formatted}`)
      } else {
        missing.push(label)
      }
    }

    if (available.length) {
      lines.push('**Données disponibles :**')
      lines.push(...available)
      lines.push('')
    }

    if (missing.length) {
      lines.push(`**Données manquantes (à demander si pertinent) :** ${missing.join(', ')}`)
      lines.push('')
    }
  }

  // Metadata
  const meta = extracted.metadata
  lines.push(`**Score de complétude :** ${meta.completeness_score}%`)
  if (meta.missing_critical?.length) {
    lines.push(`**⚠️ Données critiques manquantes :** ${meta.missing_critical.join(', ')}`)
  }
  lines.push(`**Sources :** ${meta.source_documents?.join(', ') || 'Documents uploadés'}`)

  return lines.join('\n')
}

/**
 * Génère le bloc d'instructions pour adapter les questions quand des données extraites sont disponibles.
 */
function buildQuestionAdaptationBlock(context: ConversationContext): string {
  const extracted = context.extractedDocData
  if (!extracted?.exercices?.length) return ''

  // Lister les champs disponibles
  const availableFields = new Set<string>()
  for (const ex of extracted.exercices) {
    for (const [key, val] of Object.entries(ex)) {
      if (key !== 'annee' && val != null) availableFields.add(key)
    }
  }

  const lines: string[] = []
  lines.push('# ADAPTATION DES QUESTIONS (données documents disponibles)')
  lines.push('')
  lines.push('L\'utilisateur a uploadé des documents comptables dont les données ont été extraites et validées.')
  lines.push('')
  lines.push('## Règles d\'adaptation :')
  lines.push('')
  lines.push('1. **SAUTE les questions QUANTITATIVES** dont les données sont déjà disponibles ci-dessus.')
  lines.push('2. **POSE TOUJOURS les questions QUALITATIVES** (concentration clients, dépendance dirigeant, marché, litiges, équipe, etc.).')
  lines.push('3. **Si une donnée critique est manquante** (marquée ci-dessus), pose la question correspondante.')
  lines.push('4. **Commence directement par les questions qualitatives** — ne perds pas de temps sur ce que tu sais déjà.')
  lines.push('5. **Utilise les données disponibles** pour contextualiser tes questions qualitatives (ex: "Avec un CA de X€ et une marge de Y%, ...").')
  lines.push('')
  lines.push(`**Données quantitatives déjà couvertes :** ${Array.from(availableFields).join(', ')}`)
  lines.push(`**Nombre de questions attendues :** 5-8 (au lieu de 10-15) — uniquement qualitatives + données manquantes critiques.`)

  return lines.join('\n')
}

/**
 * Remplace les variables {{...}} dans le prompt archétype par les données réelles.
 */
function replaceTemplateVars(
  prompt: string,
  context: ConversationContext,
  anneeReference: number
): string {
  const entreprise = context.entreprise
  const bilans = context.financials?.bilans
  const lastBilan = bilans?.[0]
  const ratios = context.financials?.ratios
  const diag = context.diagnosticData

  // Données du diagnostic (prioritaires car plus précises — renseignées par l'utilisateur)
  // Fallback sur les données Pappers si le diagnostic n'est pas renseigné
  const revenue = diag?.revenue ?? lastBilan?.chiffre_affaires ?? 0
  const ebitda = diag?.ebitda ?? ratios?.ebitda ?? 0
  const growth = diag?.growth ?? calculerCroissance(bilans) ?? 0
  const recurring = diag?.recurring ?? 0

  const pappersData = formatPappersData(context)
  const multiplesData = formatMultiplesData(context.archetype || '')
  const extractedDocData = formatExtractedDocData(context.documents)
  const extractedDocDataBlock = formatExtractedExercices(context)
  const hasExtractedData = !!context.extractedDocData?.exercices?.length

  return prompt
    .replace(/\{\{companyName\}\}/g, entreprise?.nom || 'Non renseigné')
    .replace(/\{\{siren\}\}/g, entreprise?.siren || 'Non renseigné')
    .replace(/\{\{revenue\}\}/g, revenue.toLocaleString('fr-FR'))
    .replace(/\{\{ebitda\}\}/g, ebitda.toLocaleString('fr-FR'))
    .replace(/\{\{growth\}\}/g, String(growth))
    .replace(/\{\{recurring\}\}/g, String(recurring))
    .replace(/\{\{pappersData\}\}/g, pappersData)
    .replace(/\{\{multiplesData\}\}/g, multiplesData)
    .replace(/\{\{extractedDocData\}\}/g, extractedDocData)
    .replace(/\{\{extractedDocDataBlock\}\}/g, extractedDocDataBlock)
    .replace(/\{\{HAS_EXTRACTED_DATA\}\}/g, hasExtractedData ? 'true' : 'false')
    .replace(/\{\{ANNEE_REFERENCE\}\}/g, String(anneeReference))
}

function calculerCroissance(bilans?: BilanAnnuel[]): number | undefined {
  if (!bilans || bilans.length < 2) return undefined
  const [recent, ancien] = bilans
  if (!ancien.chiffre_affaires || ancien.chiffre_affaires === 0) return undefined
  return Math.round(((recent.chiffre_affaires - ancien.chiffre_affaires) / ancien.chiffre_affaires) * 100)
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assemble le prompt système complet pour une évaluation post-paiement.
 *
 * Ordre d'assemblage :
 * 1. Prompt archétype (spécifique au profil détecté) — avec variables remplacées
 * 2. Modules communs (retraitements, décotes, risques, règles)
 * 3. Parcours + pédagogie (si renseignés)
 * 4. Données injectées (entreprise, financials, diagnostic, documents)
 */
export function buildArchetypePrompt(options: BuildPromptOptions): string {
  const { archetypeId, context, parcours, pedagogyLevel, includeFondsCommerce } = options
  const anneeReference = getAnneeReference()
  const now = new Date()

  // 1. Prompt archétype — récupérer et injecter les données
  const archetypePromptContext: ArchetypePromptContext = {
    archetypeId,
    entrepriseNom: context.entreprise?.nom,
    siren: context.entreprise?.siren,
    codeNaf: context.entreprise?.codeNaf,
  }
  let archetypePrompt = getPromptForArchetype(archetypeId, archetypePromptContext)

  // Remplacer les variables {{...}} par les données réelles
  if (archetypePrompt) {
    archetypePrompt = replaceTemplateVars(archetypePrompt, context, anneeReference)
  }

  // 2. Parcours + pédagogie
  const parcoursPrompt = parcours ? SYSTEM_PROMPTS[parcours] : ''
  const pedagogyPrompt = pedagogyLevel ? PEDAGOGY_PROMPTS[pedagogyLevel] : ''

  // 3. Assemblage
  const sections: string[] = []

  // Rôle et archétype
  sections.push(`Tu es un expert en évaluation d'entreprises travaillant pour EvalUp.`)

  if (archetypePrompt) {
    sections.push(`# PROMPT ARCHÉTYPE\n\n${archetypePrompt}`)
  }

  // Données extraites des documents comptables (si disponibles)
  const extractedBlock = formatExtractedExercices(context)
  if (extractedBlock) {
    sections.push(extractedBlock)
    sections.push(buildQuestionAdaptationBlock(context))
  }

  // Parcours
  if (parcoursPrompt) {
    sections.push(`## PROFIL UTILISATEUR\n\n${parcoursPrompt}`)
  }

  // Pédagogie
  if (pedagogyPrompt) {
    sections.push(pedagogyPrompt)
  }

  // Modules communs
  sections.push(CONVERSATION_RULES_PROMPT)
  sections.push(SUGGESTIONS_RULES_PROMPT)
  sections.push(NUMERIC_FIELDS_RULES_PROMPT)
  sections.push(BENCHMARK_RULES_PROMPT)
  sections.push(DOCUMENT_RULES_PROMPT)
  sections.push(NO_REPEAT_RULES_PROMPT)
  sections.push(YEAR_REFERENCE_RULES_PROMPT.replace(/\{\{ANNEE_REFERENCE\}\}/g, String(anneeReference)))
  sections.push(ANOMALY_RULES_PROMPT)
  sections.push(RETRAITEMENTS_PROMPT)
  sections.push(DATA_UPDATE_PROMPT)
  sections.push(DECOTES_PROMPT)
  sections.push(RISQUES_PROMPT)

  if (includeFondsCommerce) {
    sections.push(FONDS_COMMERCE_PROMPT)
  }

  // Données injectées — contexte de l'entreprise
  const docSection = formatExtractedDocData(context.documents)

  sections.push(`## Contexte de cette entreprise

**Date du jour : ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}**
**Année de référence pour les données financières : ${anneeReference}**

${formatEntreprise(context.entreprise)}

${formatDiagnosticData(archetypeId)}

**Documents analysés :**
${docSection}

**Ce que tu sais déjà (réponses précédentes) :**
${formatResponses(context.responses)}
`)

  return sections.join('\n\n---\n\n')
}

/**
 * Formate les réponses déjà collectées (sanitized).
 */
function formatResponses(responses?: Record<string, string>): string {
  if (!responses) return 'Aucune réponse enregistrée.'
  const entries = Object.entries(responses)
  if (entries.length === 0) return 'Aucune réponse enregistrée.'

  return entries
    .slice(0, 50)
    .map(([key, value]) => `- ${sanitize(String(key))}: ${sanitize(String(value))}`)
    .join('\n')
}

function sanitize(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\[SYSTEM\]/gi, '[filtered]')
    .replace(/\[INSTRUCTION\]/gi, '[filtered]')
    .replace(/ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/gi, '[filtered]')
    .slice(0, 2000)
}

/**
 * Retourne le prompt d'évaluation finale (format de sortie).
 * Réexporté depuis base.ts pour usage centralisé.
 */
export { EVALUATION_FINALE_PROMPT }
