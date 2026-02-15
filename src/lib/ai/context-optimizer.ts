// Optimiseur de contexte pour réduire la taille des prompts
// Compresse l'historique en gardant les données utilisateur intactes
// et en condensant les réponses verbose de l'assistant

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
 * Compresse un message assistant en gardant :
 * - La question posée (texte en gras ou dernière phrase interrogative)
 * - Les données structurées (montants, anomalies ⚠️)
 * - Le marqueur d'étape (📍 Étape X/6)
 * Supprime :
 * - Les explications verbose, benchmarks, paragraphes d'introduction
 * - Les tags [SUGGESTIONS]...[/SUGGESTIONS]
 */
function compresserMessageAssistant(content: string): string {
  const parts: string[] = []

  // 1. Garder le marqueur d'étape
  const stepMatch = content.match(/📍\s*\*?\*?Étape\s*\d+\/\d+.*$/m)
  if (stepMatch) {
    parts.push(stepMatch[0].trim())
  }

  // 2. Extraire toutes les questions en gras
  const boldQuestions = content.match(/\*\*[^*]*\?\*\*/g)
  if (boldQuestions) {
    for (const q of boldQuestions) {
      parts.push(q)
    }
  } else {
    // Fallback : dernière phrase interrogative
    const questions = content.match(/[^.!?\n]*\?/g)
    if (questions && questions.length > 0) {
      const lastQ = questions[questions.length - 1].trim()
      if (lastQ.length > 10) {
        parts.push(`**${lastQ}**`)
      }
    }
  }

  // 3. Garder les anomalies (⚠️)
  const anomalies = content.match(/⚠️[^\n]*/g)
  if (anomalies) {
    parts.push(...anomalies)
  }

  // 4. Garder les montants/ratios mentionnés dans le contexte d'analyse
  // (ex: "Ta marge nette de 3% est en dessous de la moyenne...")
  const analyses = content.match(/(?:marge|ratio|taux|rentabilité|croissance|dette)[^.]*\d+[^.]*\./gi)
  if (analyses) {
    // Garder max 2 analyses courtes
    parts.push(...analyses.slice(0, 2).map(a => a.trim()))
  }

  if (parts.length === 0) {
    // Si rien n'a été extrait, garder les 150 premiers caractères
    return content.slice(0, 150).trim() + '...'
  }

  return parts.join('\n')
}

/**
 * Compresse l'historique des messages de manière intelligente :
 * - Messages utilisateur : TOUJOURS gardés intacts (contiennent les données réelles)
 * - Messages assistant anciens : compressés (question + données clés seulement)
 * - Messages récents (derniers 6) : gardés intacts
 * - Premier message : gardé intact
 */
export function compresserHistorique(
  messages: SimpleMessage[],
  maxTokens: number = 20000
): SimpleMessage[] {
  const totalTokens = messages.reduce(
    (sum, m) => sum + estimerTokens(m.content),
    0
  )

  // Si déjà sous la limite, pas de compression
  if (totalTokens <= maxTokens) {
    return messages
  }

  // Nombre de messages récents à garder intacts (3 paires Q/R)
  const recentCount = Math.min(6, messages.length)
  const recentMessages = messages.slice(-recentCount)
  const olderMessages = messages.slice(0, -recentCount)

  if (olderMessages.length === 0) {
    return messages // Pas assez de messages pour compresser
  }

  const compressedMessages: SimpleMessage[] = []
  let currentTokens = 0

  // Traiter les messages anciens : garder user intacts, compresser assistant
  for (const msg of olderMessages) {
    if (msg.role === 'user') {
      // Messages utilisateur : TOUJOURS garder intacts
      compressedMessages.push(msg)
      currentTokens += estimerTokens(msg.content)
    } else {
      // Messages assistant : compresser
      const compressed = compresserMessageAssistant(msg.content)
      compressedMessages.push({ role: 'assistant', content: compressed })
      currentTokens += estimerTokens(compressed)
    }
  }

  // Ajouter les messages récents intacts
  for (const msg of recentMessages) {
    compressedMessages.push(msg)
    currentTokens += estimerTokens(msg.content)
  }

  // Si toujours trop gros après compression individuelle,
  // réduire davantage les anciens messages assistant
  if (currentTokens > maxTokens && olderMessages.length > 4) {
    // Remplacer les plus vieux messages par un résumé Q/R condensé
    const veryOld = olderMessages.slice(0, -4)
    const keepOld = olderMessages.slice(-4)

    const qrSummary = extraireQuestionsReponses(veryOld)
    const summaryContent = qrSummary.length > 0
      ? `[Résumé des premiers échanges]\n${qrSummary.map(qr => `• ${qr}`).join('\n')}`
      : '[Début de conversation — données Pappers déjà présentées]'

    const result: SimpleMessage[] = [
      { role: 'assistant', content: summaryContent },
    ]

    // Ajouter les messages anciens gardés (compressés)
    for (const msg of keepOld) {
      if (msg.role === 'user') {
        result.push(msg)
      } else {
        result.push({ role: 'assistant', content: compresserMessageAssistant(msg.content) })
      }
    }

    // Ajouter les messages récents
    result.push(...recentMessages)

    return result
  }

  return compressedMessages
}

/**
 * Extrait les paires question/réponse d'un historique de messages
 * Crucial pour éviter de reposer les mêmes questions
 */
function extraireQuestionsReponses(messages: SimpleMessage[]): string[] {
  const qr: string[] = []

  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i]
    const nextMsg = messages[i + 1]

    // Si c'est un message assistant suivi d'un message user, c'est une paire Q/R
    if (msg.role === 'assistant' && nextMsg.role === 'user') {
      // Extraire la question (texte en gras ou la dernière phrase interrogative)
      const boldMatch = msg.content.match(/\*\*([^*]+\?)\*\*/g)
      const questionMatch = boldMatch || msg.content.match(/[^.!?\n]*\?/g)

      if (questionMatch && questionMatch.length > 0) {
        // Prendre la dernière question trouvée
        const question = questionMatch[questionMatch.length - 1]
          .replace(/\*\*/g, '')
          .trim()
          .slice(0, 120)

        // Réponse : garder plus de contexte (200 chars)
        const reponse = nextMsg.content.slice(0, 200).trim()

        if (question && reponse) {
          qr.push(`Q: ${question} → R: ${reponse}`)
        }
      }
    }
  }

  return qr
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
 * Seuil modéré : compresse à partir de ~20K tokens de messages
 */
export function optimiserContexte(
  systemPrompt: string,
  messages: SimpleMessage[],
  maxTokens: number = 25000
): OptimizedContext {
  const originalTokens = estimerTokens(systemPrompt) +
    messages.reduce((sum, m) => sum + estimerTokens(m.content), 0)

  // Budget tokens pour les messages (hors system prompt)
  const messagesTokenBudget = maxTokens - estimerTokens(systemPrompt)
  const compressedMessages = compresserHistorique(messages, Math.max(messagesTokenBudget, 8000))

  // Extraire les données structurées (depuis les messages originaux, pas compressés)
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
 * Seuil : 50K tokens (system prompt + messages) — filet de sécurité
 * La compression intelligente garde les données utilisateur intactes
 * et condense seulement les réponses verbose de l'assistant
 */
export function necessiteCompression(
  systemPrompt: string,
  messages: SimpleMessage[],
  threshold: number = 50000
): boolean {
  const totalTokens = estimerTokens(systemPrompt) +
    messages.reduce((sum, m) => sum + estimerTokens(m.content), 0)

  return totalTokens > threshold
}
