/**
 * Utilitaires de validation et sécurité pour les API
 */

// Taille max des fichiers (10 MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Taille max des images pour Vision (5 MB par image)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

// Magic bytes pour validation des types de fichiers
const FILE_SIGNATURES: Record<string, { bytes: number[]; offset?: number }[]> = {
  'application/pdf': [
    { bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    { bytes: [0x50, 0x4B, 0x03, 0x04] }, // ZIP (xlsx is a zip)
  ],
  'application/vnd.ms-excel': [
    { bytes: [0xD0, 0xCF, 0x11, 0xE0] }, // OLE compound document (xls)
  ],
  'image/jpeg': [
    { bytes: [0xFF, 0xD8, 0xFF] },
  ],
  'image/png': [
    { bytes: [0x89, 0x50, 0x4E, 0x47] },
  ],
}

// Types MIME autorisés
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
]

/**
 * Vérifie les magic bytes d'un fichier
 */
export function validateFileMagicBytes(
  buffer: Buffer,
  expectedType: string
): boolean {
  const signatures = FILE_SIGNATURES[expectedType]

  // Pour CSV/text, pas de magic bytes - on vérifie le contenu
  if (!signatures) {
    if (expectedType === 'text/csv' || expectedType === 'application/csv') {
      // CSV doit être du texte ASCII/UTF-8 lisible
      const sample = buffer.slice(0, 1000).toString('utf-8')
      // Vérifier que c'est du texte valide (pas de caractères binaires)
      return /^[\x20-\x7E\t\r\n,;"'À-ÿ]+$/m.test(sample)
    }
    return true // Type non validé par magic bytes
  }

  for (const sig of signatures) {
    const offset = sig.offset || 0
    let matches = true

    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[offset + i] !== sig.bytes[i]) {
        matches = false
        break
      }
    }

    if (matches) return true
  }

  return false
}

/**
 * Valide un fichier uploadé
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
}

export function validateUploadedFile(
  file: File,
  buffer: Buffer,
  options: {
    maxSize?: number
    allowedTypes?: string[]
  } = {}
): FileValidationResult {
  const maxSize = options.maxSize || MAX_FILE_SIZE
  const allowedTypes = options.allowedTypes || ALLOWED_MIME_TYPES

  // 1. Vérifier la taille
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Maximum: ${Math.round(maxSize / 1024 / 1024)} MB`,
    }
  }

  // 2. Vérifier le type MIME
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé: ${file.type}`,
    }
  }

  // 3. Vérifier les magic bytes (sécurité contre le spoofing de MIME type)
  if (!validateFileMagicBytes(buffer, file.type)) {
    return {
      valid: false,
      error: 'Le contenu du fichier ne correspond pas au type déclaré',
    }
  }

  return { valid: true }
}

/**
 * Sanitize un nom de fichier pour éviter les path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Supprimer les caractères dangereux et les chemins
  return filename
    .replace(/[/\\]/g, '_') // Remplacer les slashes
    .replace(/\.\./g, '_')  // Supprimer les ..
    .replace(/[<>:"|?*\x00-\x1F]/g, '_') // Caractères Windows interdits
    .slice(0, 255) // Limiter la longueur
}

/**
 * Validation SIREN
 */
export function isValidSiren(siren: string): boolean {
  // Nettoyer le SIREN
  const cleaned = siren.replace(/\s/g, '')

  // Vérifier le format (9 chiffres)
  if (!/^\d{9}$/.test(cleaned)) {
    return false
  }

  // Algorithme de Luhn (vérification du chiffre de contrôle)
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(cleaned[i], 10)
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }

  return sum % 10 === 0
}

/**
 * Valide et nettoie un SIREN
 */
export function validateAndCleanSiren(siren: string): { valid: boolean; cleaned?: string; error?: string } {
  if (!siren || typeof siren !== 'string') {
    return { valid: false, error: 'SIREN manquant' }
  }

  const cleaned = siren.replace(/\s/g, '')

  if (cleaned.length !== 9) {
    return { valid: false, error: 'Le SIREN doit contenir 9 chiffres' }
  }

  if (!/^\d{9}$/.test(cleaned)) {
    return { valid: false, error: 'Le SIREN ne doit contenir que des chiffres' }
  }

  if (!isValidSiren(cleaned)) {
    return { valid: false, error: 'SIREN invalide (échec vérification Luhn)' }
  }

  return { valid: true, cleaned }
}
