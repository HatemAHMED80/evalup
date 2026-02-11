// Utilitaires de formatage pour la génération PDF

/**
 * Formate un nombre avec espaces (pas de slashs !)
 * 505000 → "505 000"
 * Note: On remplace les espaces insécables par des espaces normaux pour le PDF
 */
export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-'
  // Intl.NumberFormat utilise des espaces insécables (U+00A0) qui s'affichent mal dans les PDF
  // On les remplace par des espaces normaux
  return new Intl.NumberFormat('fr-FR').format(Math.round(value)).replace(/\u00A0/g, ' ')
}

/**
 * Formate un montant en euros
 * 505000 → "505 000 €"
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-'
  return `${formatNumber(value)} €`
}

/**
 * Formate un pourcentage
 * 0.0314 → "3.1%"
 */
export function formatPercent(value: number | undefined | null, decimals: number = 1): string {
  if (value === undefined || value === null) return '-'
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Formate une fourchette de prix
 */
export function formatRange(min: number, max: number): string {
  return `${formatCurrency(min)} - ${formatCurrency(max)}`
}

/**
 * Nettoie le texte des caractères problématiques pour le PDF
 */
export function cleanText(text: string): string {
  return text
    // Convertir le markdown en texte simple
    .replace(/\*\*(.*?)\*\*/g, '$1')  // **bold** → bold
    .replace(/\*(.*?)\*/g, '$1')       // *italic* → italic
    .replace(/_(.*?)_/g, '$1')         // _italic_ → italic
    .replace(/#{1,6}\s/g, '')          // ## Header → Header
    .replace(/`(.*?)`/g, '$1')         // `code` → code
    // Supprimer les emojis Unicode qui posent problème dans les PDF
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .trim()
}

/**
 * Tronque un texte avec ...
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Formate une date en français
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Calcule la variation en pourcentage entre deux valeurs
 */
export function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Formate la variation avec signe
 */
export function formatVariation(variation: number): string {
  const sign = variation >= 0 ? '+' : ''
  return `${sign}${variation.toFixed(1)}%`
}
