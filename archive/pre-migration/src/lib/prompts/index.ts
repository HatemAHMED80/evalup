// Sélecteur de prompt basé sur le code NAF et le parcours utilisateur

import { BASE_SYSTEM_PROMPT, EVALUATION_FINALE_PROMPT } from './base'
import { FLASH_SYSTEM_PROMPT } from './flash'
import { TRANSPORT_PROMPT } from './secteurs/transport'
import { SAAS_PROMPT } from './secteurs/saas'
import { RESTAURANT_PROMPT } from './secteurs/restaurant'
import { COMMERCE_PROMPT } from './secteurs/commerce'
import { SERVICES_PROMPT } from './secteurs/services'
import { SYSTEM_PROMPTS, PEDAGOGY_PROMPTS, type UserParcours, type PedagogyLevel } from './parcours'
import type { ConversationContext } from '../anthropic'
import { detecterSecteurEvaluation, SECTEURS } from '../evaluation/secteurs'
import type { ConfigSecteur } from '../evaluation/types'

// Type d'évaluation
export type EvaluationType = 'flash' | 'complete'

// Prompts spécialisés écrits manuellement (benchmarks détaillés)
// Pour les secteurs sans prompt dédié, on génère automatiquement depuis ConfigSecteur
const SECTEUR_PROMPTS_MANUELS: Record<string, string> = {
  transport: TRANSPORT_PROMPT,
  saas: SAAS_PROMPT,
  restaurant: RESTAURANT_PROMPT,
  commerce: COMMERCE_PROMPT,
  services: SERVICES_PROMPT,
}

/**
 * Génère un prompt sectoriel à partir d'une ConfigSecteur
 * Utilisé pour les secteurs sans prompt manuel dédié
 */
function genererPromptSectoriel(config: ConfigSecteur): string {
  const questionsStr = config.questions.map(q => `- ${q}`).join('\n')

  const primesStr = config.facteursPrime.map(f =>
    `- **${f.description}** (${f.impact})\n  Question à poser : "${f.question}"`
  ).join('\n')

  const decotesStr = config.facteursDecote.map(f =>
    `- **${f.description}** (${f.impact})\n  Question à poser : "${f.question}"`
  ).join('\n')

  const methodesStr = config.methodes.map(m =>
    `- **${m.nom}** (poids ${m.poids}%)`
  ).join('\n')

  const multiplesStr = Object.entries(config.multiples)
    .filter(([, v]) => v)
    .map(([k, v]) => `- Multiple ${k.toUpperCase()} : ${v!.min}x — ${v!.max}x`)
    .join('\n')

  return `
## Expertise : ${config.nom}

${config.explicationSecteur}

### Méthodes d'évaluation
${methodesStr}

${multiplesStr}

${config.explicationMethodes}

### Questions spécifiques à poser pour ce secteur
${questionsStr}

### Facteurs de prime (ce qui augmente la valeur)
${primesStr}

### Facteurs de décote (ce qui diminue la valeur)
${decotesStr}
`
}

/**
 * Détecte le secteur depuis un code NAF.
 * Délègue à detecterSecteurEvaluation (15 secteurs) et retourne le code string.
 */
export function detecterSecteur(codeNaf: string | undefined): string {
  if (!codeNaf) return 'default'
  return detecterSecteurEvaluation(codeNaf).code
}

/**
 * Retourne le nom lisible d'un secteur à partir de son code.
 */
export function getNomSecteur(secteurCode: string): string {
  if (!secteurCode || secteurCode === 'default') return 'Activité générale'
  const config = SECTEURS.find(s => s.code === secteurCode)
  return config?.nom || 'Activité générale'
}

/**
 * Retourne le prompt sectoriel approprié pour un code secteur.
 * Priorité : prompt manuel > prompt généré depuis ConfigSecteur
 */
function getPromptSectoriel(codeNaf: string | undefined): string {
  const config = detecterSecteurEvaluation(codeNaf || '')
  // Prompt manuel si disponible (benchmarks détaillés écrits à la main)
  if (SECTEUR_PROMPTS_MANUELS[config.code]) {
    return SECTEUR_PROMPTS_MANUELS[config.code]
  }
  // Sinon, générer depuis la config sectorielle
  return genererPromptSectoriel(config)
}

export function getSystemPrompt(
  codeNaf: string | undefined,
  context: ConversationContext,
  parcours?: UserParcours,
  pedagogyLevel?: PedagogyLevel,
  evaluationType: EvaluationType = 'flash'  // Par défaut Flash
): string {
  // Calculer l'année de référence (dernière année complète ou année en cours)
  const now = new Date()
  const currentYear = now.getFullYear()
  // Si on est après juin, on peut demander les données de l'année en cours
  // Sinon on demande l'année précédente (car les bilans ne sont pas encore disponibles)
  const anneeReference = now.getMonth() >= 5 ? currentYear : currentYear - 1

  // Choisir le prompt de base selon le type d'évaluation
  const basePrompt = evaluationType === 'flash' ? FLASH_SYSTEM_PROMPT : BASE_SYSTEM_PROMPT
  const basePromptWithYear = basePrompt.replace(/\{\{ANNEE_REFERENCE\}\}/g, String(anneeReference))

  // Pour Flash, on n'utilise pas les prompts de parcours/pédagogie complexes
  const parcoursPrompt = evaluationType === 'complete' && parcours ? SYSTEM_PROMPTS[parcours] : ''
  const pedagogyPrompt = evaluationType === 'complete' && pedagogyLevel ? PEDAGOGY_PROMPTS[pedagogyLevel] : ''

  // Valeurs par défaut pour éviter les crashes sur null/undefined
  const entreprise = context?.entreprise || {}
  const financials = context?.financials || { bilans: [], ratios: null, anomaliesDetectees: [] }
  const documents = context?.documents || []
  const responses = context?.responses || {}
  const evaluationProgress = context?.evaluationProgress || { step: 1, completedTopics: [], pendingTopics: [] }

  // Pour Flash, on a un contexte simplifié
  if (evaluationType === 'flash') {
    return `
${basePromptWithYear}

## Contexte de cette entreprise

**Date du jour : ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}**
**Année de référence : ${anneeReference}**

**Entreprise :**
- Nom : ${entreprise.nom || 'Non renseigné'}
- SIREN : ${entreprise.siren || 'Non renseigné'}
- Secteur : ${entreprise.secteur || 'Non déterminé'}
- Création : ${entreprise.dateCreation || 'Non renseigné'}
- Effectif : ${entreprise.effectif || 'Non renseigné'}

**Ce que tu sais déjà :**
${formatResponses(responses)}

**RAPPEL : Dès que tu as assez d'informations (CA, résultat, contexte), donne la valorisation Flash.**
`
  }

  // Prompt sectoriel (manuel ou généré) — couvre les 15 secteurs
  const secteurPrompt = getPromptSectoriel(codeNaf)

  // Pour Complete, on garde le prompt complet existant
  return `
${parcoursPrompt ? `## PROFIL UTILISATEUR\n\n${parcoursPrompt}\n\n---\n\n` : ''}${pedagogyPrompt ? `${pedagogyPrompt}\n\n---\n\n` : ''}${basePromptWithYear}

${secteurPrompt}

## Contexte de cette entreprise

**Date du jour : ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}**
**Année de référence pour les données financières : ${anneeReference}**

**Informations générales :**
- Nom : ${entreprise.nom || 'Non renseigné'}
- SIREN : ${entreprise.siren || 'Non renseigné'}
- Secteur : ${entreprise.secteur || 'Non déterminé'} (${entreprise.codeNaf || 'N/A'})
- Création : ${entreprise.dateCreation || 'Non renseigné'}
- Effectif : ${entreprise.effectif || 'Non renseigné'}
- Localisation : ${entreprise.adresse || 'Non renseigné'}, ${entreprise.ville || 'Non renseigné'}

**Données financières disponibles :**
${formatFinancials(financials)}

**Documents analysés :**
${documents.length > 0
  ? formatDocuments(documents)
  : 'Aucun document uploadé pour l\'instant'}

**Ce que tu sais déjà (réponses précédentes) :**
${formatResponses(responses)}

**Progression :**
Étape ${evaluationProgress.step || 1}/6
Complété : ${evaluationProgress.completedTopics?.join(', ') || 'Aucun'}
À faire : ${evaluationProgress.pendingTopics?.join(', ') || 'À déterminer'}

${financials.anomaliesDetectees && financials.anomaliesDetectees.length > 0 ? `
**Anomalies détectées à mentionner :**
${financials.anomaliesDetectees.map(a => `- [${a.type.toUpperCase()}] ${a.categorie}: ${a.message}`).join('\n')}
` : ''}
`
}

function formatFinancials(financials: ConversationContext['financials'] | null | undefined): string {
  if (!financials || !financials.bilans || financials.bilans.length === 0) {
    return 'Aucune donnée financière disponible - Tu devras estimer le CA à partir des données opérationnelles (ticket moyen × clients/jour × jours ouverture)'
  }

  const dernierBilan = financials.bilans[0]
  const avant = financials.bilans[1]

  let result = `
**Données disponibles pour le calcul :**

| Indicateur | Valeur | Utilisation |
|------------|--------|-------------|
| CA (${dernierBilan.annee}) | ${dernierBilan.chiffre_affaires?.toLocaleString('fr-FR') || 'N/A'} € | Base du multiple |`

  if (avant && dernierBilan.chiffre_affaires && avant.chiffre_affaires) {
    const evolution = ((dernierBilan.chiffre_affaires - avant.chiffre_affaires) / avant.chiffre_affaires * 100).toFixed(1)
    result += `
| Évolution CA | ${parseFloat(evolution) >= 0 ? '+' : ''}${evolution}% | Prime/décote croissance |`
  }

  result += `
| Résultat net | ${dernierBilan.resultat_net?.toLocaleString('fr-FR') || 'N/A'} € | Validation rentabilité |
| Trésorerie | ${dernierBilan.tresorerie?.toLocaleString('fr-FR') || 'N/A'} € | Capacité financière |
| Dettes | ${dernierBilan.dettes_financieres?.toLocaleString('fr-FR') || 'N/A'} € | À déduire si reprise |
| Capitaux propres | ${dernierBilan.capitaux_propres?.toLocaleString('fr-FR') || 'N/A'} € | Valeur patrimoniale |`

  if (financials.ratios) {
    result += `
| Marge nette | ${financials.ratios.margeNette?.toFixed(1) || 'N/A'}% | Comparaison secteur |
| EBITDA | ${financials.ratios.ebitda?.toLocaleString('fr-FR') || 'N/A'} € | Multiple EBITDA |
| Marge EBITDA | ${financials.ratios.margeEbitda?.toFixed(1) || 'N/A'}% | Comparaison secteur |`
  }

  // Ajouter un rappel pour le calcul
  result += `

**RAPPEL : Tu DOIS utiliser ces données pour calculer une valorisation. JAMAIS de valorisation à 0€.**
Si le CA n'est pas disponible, estime-le : CA = Ticket moyen × Clients/jour × 350 jours`

  return result
}

function sanitizeForPrompt(text: string): string {
  // Supprimer les tentatives d'injection de prompt
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\[SYSTEM\]/gi, '[filtered]')
    .replace(/\[INSTRUCTION\]/gi, '[filtered]')
    .replace(/ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?)/gi, '[filtered]')
    .slice(0, 2000)
}

function formatResponses(responses: Record<string, string>): string {
  const entries = Object.entries(responses)
  if (entries.length === 0) return 'Aucune réponse enregistrée'

  return entries
    .slice(0, 50)
    .map(([key, value]) => `- ${sanitizeForPrompt(String(key))}: ${sanitizeForPrompt(String(value))}`)
    .join('\n')
}

function formatDocuments(documents: ConversationContext['documents']): string {
  return documents.map(doc => {
    const parts: string[] = [`**${doc.name}**`]

    if (doc.analysis) {
      const analysis = doc.analysis

      if (analysis.error || analysis.parseError) {
        parts.push(`  Erreur d'analyse: ${analysis.error || 'Format non reconnu'}`)
      } else {
        if (analysis.typeDocument) {
          parts.push(`  - Type: ${analysis.typeDocument}`)
        }
        if (analysis.annee) {
          parts.push(`  - Année: ${analysis.annee}`)
        }

        // Chiffres extraits
        if (analysis.chiffresExtraits) {
          const chiffres = analysis.chiffresExtraits as Record<string, number | null | Record<string, number>>
          const lignes: string[] = []
          if (chiffres.ca) lignes.push(`CA: ${(chiffres.ca as number).toLocaleString('fr-FR')} €`)
          if (chiffres.resultatNet) lignes.push(`Résultat net: ${(chiffres.resultatNet as number).toLocaleString('fr-FR')} €`)
          if (chiffres.ebitda) lignes.push(`EBITDA: ${(chiffres.ebitda as number).toLocaleString('fr-FR')} €`)
          if (chiffres.tresorerie) lignes.push(`Trésorerie: ${(chiffres.tresorerie as number).toLocaleString('fr-FR')} €`)
          if (chiffres.dettes) lignes.push(`Dettes: ${(chiffres.dettes as number).toLocaleString('fr-FR')} €`)

          // Autres données
          if (chiffres.autresDonnees && typeof chiffres.autresDonnees === 'object') {
            const autres = chiffres.autresDonnees as Record<string, number>
            for (const [key, val] of Object.entries(autres)) {
              if (val) lignes.push(`${key}: ${val.toLocaleString('fr-FR')} €`)
            }
          }

          if (lignes.length > 0) {
            parts.push(`  - Données extraites: ${lignes.join(', ')}`)
          }
        }

        // Points clés
        if (analysis.pointsCles && analysis.pointsCles.length > 0) {
          parts.push(`  - Points clés: ${analysis.pointsCles.slice(0, 3).join('; ')}`)
        }

        // Anomalies
        if (analysis.anomalies && analysis.anomalies.length > 0) {
          const anomaliesMsgs = analysis.anomalies.slice(0, 3).map(a => {
            const anomalie = a as { message?: string; categorie?: string }
            return anomalie.message || anomalie.categorie || 'Anomalie'
          })
          parts.push(`  - Alertes: ${anomaliesMsgs.join('; ')}`)
        }
      }
    }

    return parts.join('\n')
  }).join('\n\n')
}

export { EVALUATION_FINALE_PROMPT }
export type { UserParcours, PedagogyLevel }
