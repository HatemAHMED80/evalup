// Sélecteur de prompt basé sur le parcours utilisateur
// Tous les prompts passent désormais par le système d'archétypes (buildArchetypePrompt)

import { BASE_SYSTEM_PROMPT, EVALUATION_FINALE_PROMPT } from './base'
import { SYSTEM_PROMPTS, PEDAGOGY_PROMPTS, type UserParcours, type PedagogyLevel } from './parcours'
import type { ConversationContext } from '../anthropic'
import { detecterSecteurEvaluation, SECTEURS } from '../evaluation/secteurs'

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
 * Construit le prompt système pour l'évaluation.
 * Note : dans le nouveau flow, buildArchetypePrompt() est utilisé en priorité.
 * Cette fonction reste disponible comme fallback.
 */
export function getSystemPrompt(
  codeNaf: string | undefined,
  context: ConversationContext,
  parcours?: UserParcours,
  pedagogyLevel?: PedagogyLevel,
): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  const anneeReference = now.getMonth() >= 5 ? currentYear : currentYear - 1

  const basePromptWithYear = BASE_SYSTEM_PROMPT.replace(/\{\{ANNEE_REFERENCE\}\}/g, String(anneeReference))

  const parcoursPrompt = parcours ? SYSTEM_PROMPTS[parcours] : ''
  const pedagogyPrompt = pedagogyLevel ? PEDAGOGY_PROMPTS[pedagogyLevel] : ''

  const entreprise = context?.entreprise || {}
  const financials = context?.financials || { bilans: [], ratios: null, anomaliesDetectees: [] }
  const documents = context?.documents || []
  const responses = context?.responses || {}
  const evaluationProgress = context?.evaluationProgress || { step: 1, completedTopics: [], pendingTopics: [] }

  return `
${parcoursPrompt ? `## PROFIL UTILISATEUR\n\n${parcoursPrompt}\n\n---\n\n` : ''}${pedagogyPrompt ? `${pedagogyPrompt}\n\n---\n\n` : ''}${basePromptWithYear}

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
