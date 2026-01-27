// Sélecteur de prompt basé sur le code NAF

import { BASE_SYSTEM_PROMPT, EVALUATION_FINALE_PROMPT } from './base'
import { TRANSPORT_PROMPT } from './secteurs/transport'
import { SAAS_PROMPT } from './secteurs/saas'
import { RESTAURANT_PROMPT } from './secteurs/restaurant'
import { COMMERCE_PROMPT } from './secteurs/commerce'
import { SERVICES_PROMPT } from './secteurs/services'
import type { ConversationContext } from '../anthropic'

// Mapping code NAF → secteur
const NAF_TO_SECTEUR: Record<string, string> = {
  // Transport
  '49.41A': 'transport',
  '49.41B': 'transport',
  '49.41C': 'transport',
  '49.42Z': 'transport',
  '52.29A': 'transport',
  '52.29B': 'transport',

  // SaaS / Tech
  '62.01Z': 'saas',
  '62.02A': 'saas',
  '62.02B': 'saas',
  '62.03Z': 'saas',
  '62.09Z': 'saas',
  '63.11Z': 'saas',
  '63.12Z': 'saas',
  '58.29A': 'saas',
  '58.29B': 'saas',
  '58.29C': 'saas',

  // Restaurant
  '56.10A': 'restaurant',
  '56.10B': 'restaurant',
  '56.10C': 'restaurant',
  '56.21Z': 'restaurant',
  '56.29A': 'restaurant',
  '56.29B': 'restaurant',
  '56.30Z': 'restaurant',

  // Commerce
  '47.11A': 'commerce',
  '47.11B': 'commerce',
  '47.11C': 'commerce',
  '47.11D': 'commerce',
  '47.11E': 'commerce',
  '47.11F': 'commerce',
  '47.19A': 'commerce',
  '47.19B': 'commerce',
  '47.21Z': 'commerce',
  '47.22Z': 'commerce',
  '47.23Z': 'commerce',
  '47.24Z': 'commerce',
  '47.25Z': 'commerce',
  '47.26Z': 'commerce',
  '47.29Z': 'commerce',
  '47.41Z': 'commerce',
  '47.42Z': 'commerce',
  '47.43Z': 'commerce',
  '47.51Z': 'commerce',
  '47.52A': 'commerce',
  '47.52B': 'commerce',
  '47.53Z': 'commerce',
  '47.54Z': 'commerce',
  '47.59A': 'commerce',
  '47.59B': 'commerce',
  '47.61Z': 'commerce',
  '47.62Z': 'commerce',
  '47.63Z': 'commerce',
  '47.64Z': 'commerce',
  '47.65Z': 'commerce',
  '47.71Z': 'commerce',
  '47.72A': 'commerce',
  '47.72B': 'commerce',
  '47.73Z': 'commerce',
  '47.74Z': 'commerce',
  '47.75Z': 'commerce',
  '47.76Z': 'commerce',
  '47.77Z': 'commerce',
  '47.78A': 'commerce',
  '47.78B': 'commerce',
  '47.78C': 'commerce',
  '47.79Z': 'commerce',

  // E-commerce (traité comme commerce)
  '47.91A': 'commerce',
  '47.91B': 'commerce',

  // Services B2B
  '70.10Z': 'services',
  '70.21Z': 'services',
  '70.22Z': 'services',
  '73.11Z': 'services',
  '73.12Z': 'services',
  '73.20Z': 'services',
  '74.10Z': 'services',
  '74.20Z': 'services',
  '74.30Z': 'services',
  '74.90A': 'services',
  '74.90B': 'services',
  '78.10Z': 'services',
  '78.20Z': 'services',
  '78.30Z': 'services',
  '69.10Z': 'services',
  '69.20Z': 'services',
}

const SECTEUR_PROMPTS: Record<string, string> = {
  transport: TRANSPORT_PROMPT,
  saas: SAAS_PROMPT,
  restaurant: RESTAURANT_PROMPT,
  commerce: COMMERCE_PROMPT,
  services: SERVICES_PROMPT,
}

const SECTEUR_NOMS: Record<string, string> = {
  transport: 'Transport Routier',
  saas: 'SaaS / Tech',
  restaurant: 'Restauration',
  commerce: 'Commerce de Détail',
  services: 'Services B2B',
}

export function detecterSecteur(codeNaf: string): string {
  // Nettoyer le code NAF
  const codeClean = codeNaf.replace(/[.\s]/g, '').toUpperCase()
  const codeFormatted = codeClean.length === 5
    ? `${codeClean.slice(0, 2)}.${codeClean.slice(2)}`
    : codeNaf

  return NAF_TO_SECTEUR[codeFormatted] || 'services'
}

export function getNomSecteur(secteur: string): string {
  return SECTEUR_NOMS[secteur] || 'Services'
}

export function getSystemPrompt(codeNaf: string, context: ConversationContext): string {
  // Détecter le secteur depuis le code NAF
  const secteur = detecterSecteur(codeNaf)
  const secteurPrompt = SECTEUR_PROMPTS[secteur] || SERVICES_PROMPT

  // Calculer l'année de référence (dernière année complète ou année en cours)
  const now = new Date()
  const currentYear = now.getFullYear()
  // Si on est après juin, on peut demander les données de l'année en cours
  // Sinon on demande l'année précédente (car les bilans ne sont pas encore disponibles)
  const anneeReference = now.getMonth() >= 5 ? currentYear : currentYear - 1

  // Injecter l'année dans le prompt de base
  const basePromptWithYear = BASE_SYSTEM_PROMPT.replace(/\{\{ANNEE_REFERENCE\}\}/g, String(anneeReference))

  // Construire le prompt complet
  return `
${basePromptWithYear}

${secteurPrompt}

## Contexte de cette entreprise

**Date du jour : ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}**
**Année de référence pour les données financières : ${anneeReference}**

**Informations générales :**
- Nom : ${context.entreprise.nom}
- SIREN : ${context.entreprise.siren}
- Secteur : ${context.entreprise.secteur} (${context.entreprise.codeNaf})
- Création : ${context.entreprise.dateCreation}
- Effectif : ${context.entreprise.effectif}
- Localisation : ${context.entreprise.adresse}, ${context.entreprise.ville}

**Données financières disponibles :**
${formatFinancials(context.financials)}

**Documents analysés :**
${context.documents.length > 0
  ? formatDocuments(context.documents)
  : 'Aucun document uploadé pour l\'instant'}

**Ce que tu sais déjà (réponses précédentes) :**
${formatResponses(context.responses)}

**Progression :**
📍 Étape ${context.evaluationProgress.step}/6
✅ Complété : ${context.evaluationProgress.completedTopics.join(', ') || 'Aucun'}
⏳ À faire : ${context.evaluationProgress.pendingTopics.join(', ')}

${context.financials.anomaliesDetectees.length > 0 ? `
**Anomalies détectées à mentionner :**
${context.financials.anomaliesDetectees.map(a => `- [${a.type.toUpperCase()}] ${a.categorie}: ${a.message}`).join('\n')}
` : ''}
`
}

function formatFinancials(financials: ConversationContext['financials']): string {
  if (!financials.bilans || financials.bilans.length === 0) {
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

function formatResponses(responses: Record<string, string>): string {
  const entries = Object.entries(responses)
  if (entries.length === 0) return 'Aucune réponse enregistrée'

  return entries.map(([key, value]) => `- ${key}: ${value}`).join('\n')
}

function formatDocuments(documents: ConversationContext['documents']): string {
  return documents.map(doc => {
    const parts: string[] = [`📄 **${doc.name}**`]

    if (doc.analysis) {
      const analysis = doc.analysis

      if (analysis.error || analysis.parseError) {
        parts.push(`  ⚠️ Erreur d'analyse: ${analysis.error || 'Format non reconnu'}`)
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
          parts.push(`  - ⚠️ Alertes: ${anomaliesMsgs.join('; ')}`)
        }
      }
    }

    return parts.join('\n')
  }).join('\n\n')
}

export { EVALUATION_FINALE_PROMPT }
