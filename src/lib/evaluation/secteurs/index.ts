import type { ConfigSecteur } from '../types'
import { TRANSPORT } from './transport'
import { SAAS } from './saas'
import { RESTAURANT } from './restaurant'
import { COMMERCE } from './commerce'
import { ECOMMERCE } from './ecommerce'
import { BTP } from './btp'
import { INDUSTRIE } from './industrie'
import { SERVICES } from './services'
import { PHARMACIE, LABO, MEDECIN, DENTAIRE, PARAMEDICAL, SANTE } from './sante'
import { DEFAULT } from './default'

// Tous les secteurs
// Les sous-secteurs santé sont AVANT le SANTE générique pour que la détection
// par code NAF exact tombe sur le sous-secteur précis d'abord.
export const SECTEURS: ConfigSecteur[] = [
  TRANSPORT,
  SAAS,
  RESTAURANT,
  COMMERCE,
  ECOMMERCE,
  BTP,
  INDUSTRIE,
  SERVICES,
  PHARMACIE,
  LABO,
  MEDECIN,
  DENTAIRE,
  PARAMEDICAL,
  SANTE, // Fallback santé si aucun sous-secteur ne matche
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

      // Correspondance par préfixe (2 premiers chiffres = division NAF)
      if (cleanCode.length >= 2 && cleanNafCode.startsWith(cleanCode.slice(0, 2)) && cleanCode.startsWith(cleanNafCode.slice(0, 2))) {
        // Si même division NAF (2 premiers chiffres), c'est un match partiel
        // Mais on ne retourne que si on ne trouve pas de match exact après
      }
    }
  }

  // Fallback: correspondance par division NAF (2 premiers chiffres)
  const division = cleanCode.slice(0, 2)
  for (const secteur of SECTEURS) {
    for (const nafCode of secteur.codesNaf) {
      const cleanNafCode = nafCode.replace(/[\s.]/g, '').toUpperCase()
      if (cleanNafCode.slice(0, 2) === division) {
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
export { PHARMACIE, LABO, MEDECIN, DENTAIRE, PARAMEDICAL }
