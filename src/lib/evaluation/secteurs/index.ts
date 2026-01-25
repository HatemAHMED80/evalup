import type { ConfigSecteur } from '../types'
import { TRANSPORT } from './transport'
import { SAAS } from './saas'
import { RESTAURANT } from './restaurant'
import { COMMERCE } from './commerce'
import { ECOMMERCE } from './ecommerce'
import { BTP } from './btp'
import { INDUSTRIE } from './industrie'
import { SERVICES } from './services'
import { SANTE } from './sante'
import { DEFAULT } from './default'

// Tous les secteurs
export const SECTEURS: ConfigSecteur[] = [
  TRANSPORT,
  SAAS,
  RESTAURANT,
  COMMERCE,
  ECOMMERCE,
  BTP,
  INDUSTRIE,
  SERVICES,
  SANTE,
  DEFAULT,
]

/**
 * Détecte le secteur à partir du code NAF
 */
export function detecterSecteurEvaluation(codeNaf: string): ConfigSecteur {
  // Nettoyer le code NAF (enlever les points et espaces)
  const cleanCode = codeNaf.replace(/[\s.]/g, '').toUpperCase()

  for (const secteur of SECTEURS) {
    for (const nafCode of secteur.codesNaf) {
      const cleanNafCode = nafCode.replace(/[\s.]/g, '').toUpperCase()

      // Correspondance exacte
      if (cleanCode === cleanNafCode) {
        return secteur
      }

      // Correspondance partielle (ex: '10.' pour industrie alimentaire)
      if (cleanNafCode.endsWith('.') && cleanCode.startsWith(cleanNafCode.slice(0, -1))) {
        return secteur
      }
    }
  }

  return DEFAULT
}

/**
 * Retourne un secteur par son code
 */
export function getSecteurParCode(code: string): ConfigSecteur | undefined {
  return SECTEURS.find(s => s.code === code)
}

/**
 * Retourne tous les secteurs disponibles (hors default)
 */
export function getTousLesSecteurs(): ConfigSecteur[] {
  return SECTEURS.filter(s => s.code !== 'default')
}

// Re-export des secteurs individuels
export { TRANSPORT, SAAS, RESTAURANT, COMMERCE, ECOMMERCE, BTP, INDUSTRIE, SERVICES, SANTE, DEFAULT }
