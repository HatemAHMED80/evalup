// Prompt builder — assemble archétype prompt + modules + données injectées
//
// Architecture cible (MIGRATION-PLAN section 4) :
//   ARCHETYPE_PROMPT_[ID]     — prompt spécifique à l'archétype (200-300 lignes)
//   + MODULES                 — retraitements, décotes, risques, règles conversation
//   + DONNÉES_INJECTÉES       — Pappers, réponses diagnostic, multiples Damodaran
//   + PARCOURS (optionnel)    — vente / achat / associé / etc.

import { getPromptForArchetype, type ArchetypePromptContext } from './archetype-prompts'
import { RETRAITEMENTS_PROMPT } from './modules/retraitements'
// Sidebar collects data directly — no DATA_UPDATE prompt needed
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
import { COHERENCE_RULES_PROMPT } from './modules/coherence-rules'
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

function getObjectifQuestions(objectif?: string): string {
  if (!objectif) return ''
  const questions: Record<string, string> = {
    associe: `### Questions spécifiques — Rachat/sortie d'associé
- "Quelle est la répartition actuelle du capital entre les associés ?"
- "Y a-t-il un pacte d'associés ou une clause de sortie/buy-out dans les statuts ?"
- "L'associé sortant a-t-il un compte courant d'associé ? Si oui, quel montant ?"
- "Les statuts prévoient-ils une méthode de valorisation spécifique ?"`,
    vente: `### Questions spécifiques — Cession
- "As-tu déjà identifié des acquéreurs potentiels ou mandaté un conseil M&A ?"
- "Quelle est ta disponibilité pour un accompagnement post-cession (earn-out, transition) ?"
- "Quel est ton horizon de temps pour la cession ?"`,
    achat: `### Questions spécifiques — Acquisition
- "As-tu déjà identifié la cible ou plusieurs cibles potentielles ?"
- "Quel est ton budget d'acquisition (fonds propres + dette envisagée) ?"
- "Prévois-tu de garder le dirigeant actuel en place ?"`,
    financement: `### Questions spécifiques — Levée de fonds / Financement
- "Quel montant cherches-tu à lever et pour quel usage principal ?"
- "À quel stade en es-tu ? (pré-seed, seed, série A, etc.)"
- "As-tu déjà levé des fonds ? Si oui, à quelle valorisation (pre ou post-money) ?"
- "Quelle dilution maximale es-tu prêt à accepter ?"`,
    divorce: `### Questions spécifiques — Séparation de patrimoine
- "Quel est le régime matrimonial (communauté, séparation de biens) ?"
- "Les deux conjoints sont-ils impliqués dans l'entreprise ?"
- "Y a-t-il un accord amiable en cours ou est-ce contentieux ?"`,
    transmission: `### Questions spécifiques — Transmission familiale
- "À qui souhaites-tu transmettre (enfants, autre membre famille) ?"
- "Le repreneur est-il déjà impliqué dans l'entreprise ?"
- "As-tu déjà consulté un notaire ou fiscaliste sur le montage (donation, pacte Dutreil) ?"`,
  }
  return questions[objectif] || ''
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

  // Données diagnostic enrichies (Phase 2 — champs optionnels)
  const remuDirigeant = diag?.remunerationDirigeant
  const dettes = diag?.dettesFinancieres
  const treso = diag?.tresorerieActuelle
  const concentration = diag?.concentrationClient
  const mrr = diag?.mrrMensuel

  // Instructions conditionnelles : si déjà renseigné dans le diagnostic, CONFIRMER plutôt que reposer
  const dejaRenseigne: string[] = []
  if (remuDirigeant != null) dejaRenseigne.push(`- Rémunération dirigeant : ${remuDirigeant.toLocaleString('fr-FR')} €/an (source: diagnostic). CONFIRME cette donnée plutôt que de la reposer.`)
  if (dettes != null) dejaRenseigne.push(`- Dettes financières : ${dettes.toLocaleString('fr-FR')} € (source: diagnostic). CONFIRME plutôt que de reposer.`)
  if (treso != null) dejaRenseigne.push(`- Trésorerie : ${treso.toLocaleString('fr-FR')} € (source: diagnostic). CONFIRME plutôt que de reposer.`)
  if (concentration != null) dejaRenseigne.push(`- Concentration client (top 3) : ${concentration}% (source: diagnostic). CONFIRME plutôt que de reposer.`)
  if (mrr != null) dejaRenseigne.push(`- MRR : ${mrr.toLocaleString('fr-FR')} €/mois → ARR : ${(mrr * 12).toLocaleString('fr-FR')} €/an (source: diagnostic). CONFIRME plutôt que de reposer.`)
  // Alertes confirmées par l'utilisateur dans le formulaire diagnostic
  const confirmedAlerts = (diag as Record<string, unknown> | undefined)?.confirmedAlerts as string[] | undefined
  if (confirmedAlerts?.length) {
    dejaRenseigne.push(`\n### Alertes confirmées par l'utilisateur\nL'utilisateur a vu et confirmé ces écarts dans le formulaire :\n${confirmedAlerts.map((a: string) => `- ${a}`).join('\n')}\nTu peux demander une explication BRÈVE une seule fois, puis passe à la suite.`)
  }

  const dejaRenseigneBlock = dejaRenseigne.length > 0
    ? `\n\n### Données déjà collectées (diagnostic)\nCes informations ont été renseignées par l'utilisateur dans le diagnostic. Tu peux les CONFIRMER brièvement mais ne les repose PAS :\n${dejaRenseigne.join('\n')}`
    : ''

  return prompt
    .replace(/\{\{companyName\}\}/g, entreprise?.nom || 'Non renseigné')
    .replace(/\{\{siren\}\}/g, entreprise?.siren || 'Non renseigné')
    .replace(/\{\{revenue\}\}/g, revenue.toLocaleString('fr-FR'))
    .replace(/\{\{ebitda\}\}/g, ebitda.toLocaleString('fr-FR'))
    .replace(/\{\{growth\}\}/g, String(growth))
    .replace(/\{\{recurring\}\}/g, String(recurring))
    .replace(/\{\{remunerationDirigeant\}\}/g, remuDirigeant != null ? remuDirigeant.toLocaleString('fr-FR') : 'Non renseigné')
    .replace(/\{\{dettesFinancieres\}\}/g, dettes != null ? dettes.toLocaleString('fr-FR') : 'Non renseigné')
    .replace(/\{\{tresorerieActuelle\}\}/g, treso != null ? treso.toLocaleString('fr-FR') : 'Non renseigné')
    .replace(/\{\{concentrationClient\}\}/g, concentration != null ? String(concentration) : 'Non renseigné')
    .replace(/\{\{mrrMensuel\}\}/g, mrr != null ? mrr.toLocaleString('fr-FR') : 'Non renseigné')
    .replace(/\{\{dejaRenseigneBlock\}\}/g, dejaRenseigneBlock)
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
  sections.push(COHERENCE_RULES_PROMPT)
  sections.push(RETRAITEMENTS_PROMPT)
  // Sidebar collects data — no DATA_UPDATE prompt
  sections.push(DECOTES_PROMPT)
  sections.push(RISQUES_PROMPT)

  if (includeFondsCommerce) {
    sections.push(FONDS_COMMERCE_PROMPT)
  }

  // Mode guide : la sidebar collecte les donnees, le chat guide et analyse
  sections.push(`### Role : Guide et analyste

IMPORTANT : L'utilisateur dispose d'un panneau de donnees (sidebar a droite) ou il saisit directement ses chiffres. Les donnees Pappers y sont deja pre-remplies.

**Donnees gerees par la sidebar (NE PAS demander dans le chat) :**
- Chiffre d'affaires, Resultat d'exploitation, Resultat net, Amortissements (par annee)
- EBITDA (calcule automatiquement)
- Tresorerie, Dettes financieres, Capitaux propres, Creances clients, Dettes fournisseurs, Stocks, Provisions
- Remuneration dirigeant, Loyers, Credit-bail, Charges/produits exceptionnels
- Dependance dirigeant, Concentration clients, Participation minoritaire, Litiges, Contrats cles
- MRR, Churn, NRR, CAC, Runway, GMV (si archetype SaaS/marketplace)
- Objectif de la valorisation (vente, achat, associe, etc.)

**Ce que tu dois faire :**
1. **Guider** : Expliquer l'importance de chaque donnee pour la valorisation et inviter l'utilisateur a completer les champs dans la sidebar
2. **Analyser** : Commenter les metriques au fur et a mesure qu'elles sont renseignees
3. **Alerter** : Signaler les incoherences, les risques, les points d'attention
4. **Repondre** : Repondre aux questions de l'utilisateur sur la valorisation

**Ce que tu ne dois PAS faire :**
- Ne demande PAS les chiffres financiers (CA, EBITDA, tresorerie, dettes, etc.) — redirige vers la sidebar : "Vous pouvez renseigner ce montant dans le panneau a droite"
- Ne demande PAS l'objectif de valorisation — il est selectionnable dans la sidebar
- Ne genere PAS de blocs de donnees structurees dans tes messages
- Ne fais JAMAIS de valorisation finale dans le chat — c'est le role du rapport PDF
- NE PARLE PAS des documents a uploader. Le panneau de donnees contient deja une zone d'upload. Si l'utilisateur n'a pas de documents, ce n'est pas grave — il peut saisir les donnees manuellement.
- NE LISTE PAS les types de documents (liasse fiscale, bilans, etc.). C'est inutile et verbeux.

**Apres la confirmation de l'objectif, ton message doit etre COURT (3-4 lignes max) :**
- Confirme l'objectif
- Indique que les donnees Pappers sont pre-remplies dans le panneau
- Demande de verifier et completer avec les donnees recentes si disponibles
- Exemple : "Compris, objectif : vente. J'ai pre-rempli les donnees depuis les bilans publies dans le panneau de donnees. Verifiez-les et ajoutez vos chiffres recents si vous les avez. Je vous guide au fur et a mesure."

**Ce que tu PEUX faire dans le chat :**
- Poser des questions qualitatives que la sidebar ne couvre pas (contexte marche, projet de cession, historique, equipe, avantages concurrentiels, etc.)
- Demander des precisions sur des incoherences detectees
- Donner des fourchettes indicatives ("avec ces metriques, vous seriez dans une fourchette de X a Y") avec un caveat
- Poser des questions sur la structure financiere non couverte par la sidebar (emprunts hors bilan, garanties, etc.)
- Encourager l'utilisateur a completer les champs critiques manquants dans la sidebar`)

  // Questions spécifiques à l'objectif
  const objectifQuestions = getObjectifQuestions(context.objectif)
  if (objectifQuestions) {
    sections.push(objectifQuestions)
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

⚠️ **CROSS-VALIDATION** : Si les données déclarées par l'utilisateur divergent de plus de 20% des données Pappers (CA, effectif, dettes, trésorerie), signale l'écart et demande une explication. Les écarts peuvent être légitimes (croissance récente, bilan ancien) mais doivent être documentés.
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
