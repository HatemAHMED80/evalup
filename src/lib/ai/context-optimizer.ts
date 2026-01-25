// Optimiseur de contexte pour réduire la taille des prompts
// Compresse l'historique et extrait les informations essentielles

// Type simplifié pour les messages (sans id/timestamp pour l'optimisation)
export interface SimpleMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface OptimizedContext {
  systemPrompt: string
  messages: SimpleMessage[]
  extractedData: ExtractedData
  compressionRatio: number
  estimatedTokens: number
}

export interface ExtractedData {
  // Données entreprise
  siren?: string
  nomEntreprise?: string
  secteur?: string

  // Données financières extraites
  ca?: number
  ebitda?: number
  resultatNet?: number
  tresorerie?: number
  dettes?: number
  effectif?: number

  // Réponses aux questions clés
  reponses: Record<string, string>

  // Points importants identifiés
  pointsCles: string[]

  // Anomalies détectées
  anomalies: string[]
}

/**
 * Estime le nombre de tokens dans un texte (approximation)
 * ~4 caractères = 1 token pour le français
 */
export function estimerTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Compresse l'historique des messages pour réduire les tokens
 */
export function compresserHistorique(
  messages: SimpleMessage[],
  maxTokens: number = 4000
): SimpleMessage[] {
  const totalTokens = messages.reduce(
    (sum, m) => sum + estimerTokens(m.content),
    0
  )

  // Si déjà sous la limite, pas de compression
  if (totalTokens <= maxTokens) {
    return messages
  }

  const compressedMessages: SimpleMessage[] = []
  let currentTokens = 0

  // Garder le premier message (contexte initial) et les derniers messages
  const firstMessage = messages[0]
  const recentMessages = messages.slice(-4) // 4 derniers échanges

  // Ajouter le premier message
  if (firstMessage) {
    compressedMessages.push(firstMessage)
    currentTokens += estimerTokens(firstMessage.content)
  }

  // Résumer les messages intermédiaires
  const middleMessages = messages.slice(1, -4)
  if (middleMessages.length > 0) {
    const summary = resumerMessages(middleMessages)
    const summaryMessage: SimpleMessage = {
      role: 'assistant',
      content: `[Résumé des échanges précédents]\n${summary}`,
    }
    compressedMessages.push(summaryMessage)
    currentTokens += estimerTokens(summaryMessage.content)
  }

  // Ajouter les messages récents
  for (const msg of recentMessages) {
    const msgTokens = estimerTokens(msg.content)
    if (currentTokens + msgTokens <= maxTokens) {
      compressedMessages.push(msg)
      currentTokens += msgTokens
    }
  }

  return compressedMessages
}

/**
 * Résume une liste de messages en extrayant les points clés
 */
function resumerMessages(messages: SimpleMessage[]): string {
  const points: string[] = []

  for (const msg of messages) {
    // Extraire les éléments clés du contenu
    const extracted = extrairePointsCles(msg.content)
    points.push(...extracted)
  }

  // Dédupliquer et formater
  const uniquePoints = [...new Set(points)]
  return uniquePoints.slice(0, 10).map(p => `• ${p}`).join('\n')
}

/**
 * Extrait les points clés d'un texte
 */
function extrairePointsCles(text: string): string[] {
  const points: string[] = []

  // Extraire les montants mentionnés
  const montants = text.match(/\d+[\s\u00A0]?\d*[\s\u00A0]?(k€|K€|€|euros?)/gi)
  if (montants) {
    points.push(...montants.slice(0, 3).map(m => `Montant: ${m}`))
  }

  // Extraire les pourcentages
  const pourcentages = text.match(/\d+[,.]?\d*\s*%/g)
  if (pourcentages) {
    points.push(...pourcentages.slice(0, 2).map(p => `Ratio: ${p}`))
  }

  // Extraire les mots-clés importants
  const keywords = [
    'licence IV', 'certifications', 'RGE', 'Qualibat',
    'carnet de commandes', 'bail', 'salariés', 'effectif',
    'dettes', 'trésorerie', 'clientèle', 'fournisseurs',
  ]

  for (const kw of keywords) {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      // Extraire le contexte autour du mot-clé
      const regex = new RegExp(`.{0,20}${kw}.{0,30}`, 'gi')
      const match = text.match(regex)
      if (match) {
        points.push(match[0].trim())
      }
    }
  }

  return points
}

/**
 * Extrait les données structurées de l'historique
 */
export function extraireDonneesStructurees(
  messages: SimpleMessage[]
): ExtractedData {
  const data: ExtractedData = {
    reponses: {},
    pointsCles: [],
    anomalies: [],
  }

  const fullText = messages.map(m => m.content).join('\n')

  // Extraire le SIREN
  const sirenMatch = fullText.match(/\b\d{9}\b/)
  if (sirenMatch) {
    data.siren = sirenMatch[0]
  }

  // Extraire les montants financiers
  const caMatch = fullText.match(/chiffre d'affaires?[:\s]*(\d+[\s\u00A0]?\d*[\s\u00A0]?(?:k€|K€|€|euros?))/i)
  if (caMatch) {
    data.ca = parseMontant(caMatch[1])
  }

  const ebitdaMatch = fullText.match(/ebitda[:\s]*(\d+[\s\u00A0]?\d*[\s\u00A0]?(?:k€|K€|€|euros?))/i)
  if (ebitdaMatch) {
    data.ebitda = parseMontant(ebitdaMatch[1])
  }

  const resultatMatch = fullText.match(/résultat\s*(?:net)?[:\s]*(-?\d+[\s\u00A0]?\d*[\s\u00A0]?(?:k€|K€|€|euros?))/i)
  if (resultatMatch) {
    data.resultatNet = parseMontant(resultatMatch[1])
  }

  // Extraire l'effectif
  const effectifMatch = fullText.match(/(\d+)\s*(?:salariés?|employés?|personnes?)/i)
  if (effectifMatch) {
    data.effectif = parseInt(effectifMatch[1], 10)
  }

  // Identifier les points clés
  data.pointsCles = extrairePointsCles(fullText)

  // Identifier les anomalies potentielles
  if (fullText.toLowerCase().includes('négatif') || fullText.toLowerCase().includes('perte')) {
    data.anomalies.push('Résultats potentiellement négatifs mentionnés')
  }
  if (fullText.toLowerCase().includes('dette') && fullText.toLowerCase().includes('élev')) {
    data.anomalies.push('Endettement élevé mentionné')
  }

  return data
}

/**
 * Parse un montant textuel en nombre
 */
function parseMontant(text: string): number {
  // Nettoyer le texte
  let cleaned = text.replace(/\s/g, '').replace(/\u00A0/g, '')

  // Gérer les K€
  const isKilo = cleaned.toLowerCase().includes('k')
  cleaned = cleaned.replace(/k€?|K€?|€|euros?/gi, '')

  // Parser le nombre
  const value = parseFloat(cleaned.replace(',', '.'))

  if (isNaN(value)) return 0

  return isKilo ? value * 1000 : value
}

/**
 * Optimise le contexte complet pour un appel API
 */
export function optimiserContexte(
  systemPrompt: string,
  messages: SimpleMessage[],
  maxTokens: number = 8000
): OptimizedContext {
  const originalTokens = estimerTokens(systemPrompt) +
    messages.reduce((sum, m) => sum + estimerTokens(m.content), 0)

  // Compresser les messages si nécessaire
  const messagesTokenBudget = maxTokens - estimerTokens(systemPrompt)
  const compressedMessages = compresserHistorique(messages, messagesTokenBudget)

  // Extraire les données structurées
  const extractedData = extraireDonneesStructurees(messages)

  // Calculer les nouvelles stats
  const optimizedTokens = estimerTokens(systemPrompt) +
    compressedMessages.reduce((sum, m) => sum + estimerTokens(m.content), 0)

  const compressionRatio = originalTokens > 0
    ? 1 - (optimizedTokens / originalTokens)
    : 0

  return {
    systemPrompt,
    messages: compressedMessages,
    extractedData,
    compressionRatio,
    estimatedTokens: optimizedTokens,
  }
}

/**
 * Génère un prompt condensé avec les données extraites
 */
export function genererPromptCondense(
  basePrompt: string,
  data: ExtractedData
): string {
  const sections: string[] = [basePrompt]

  // Ajouter les données financières si disponibles
  if (data.ca || data.ebitda || data.resultatNet) {
    sections.push('\n## Données financières connues')
    if (data.ca) sections.push(`- CA: ${formatMontant(data.ca)}`)
    if (data.ebitda) sections.push(`- EBITDA: ${formatMontant(data.ebitda)}`)
    if (data.resultatNet) sections.push(`- Résultat net: ${formatMontant(data.resultatNet)}`)
    if (data.effectif) sections.push(`- Effectif: ${data.effectif} salariés`)
  }

  // Ajouter les points clés
  if (data.pointsCles.length > 0) {
    sections.push('\n## Points clés identifiés')
    sections.push(data.pointsCles.slice(0, 5).map(p => `- ${p}`).join('\n'))
  }

  // Ajouter les anomalies
  if (data.anomalies.length > 0) {
    sections.push('\n## Anomalies à prendre en compte')
    sections.push(data.anomalies.map(a => `⚠️ ${a}`).join('\n'))
  }

  return sections.join('\n')
}

/**
 * Formate un montant en euros
 */
function formatMontant(montant: number): string {
  if (montant >= 1000000) {
    return `${(montant / 1000000).toFixed(1)} M€`
  }
  if (montant >= 1000) {
    return `${(montant / 1000).toFixed(0)} K€`
  }
  return `${montant.toFixed(0)} €`
}

/**
 * Détermine si le contexte nécessite une compression
 */
export function necessiteCompression(
  systemPrompt: string,
  messages: SimpleMessage[],
  threshold: number = 6000
): boolean {
  const totalTokens = estimerTokens(systemPrompt) +
    messages.reduce((sum, m) => sum + estimerTokens(m.content), 0)

  return totalTokens > threshold
}
