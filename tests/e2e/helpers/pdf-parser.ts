// Parser le PDF pour extraire les données et les vérifier
// Utilise pdftotext (poppler) si disponible, sinon fallback basique

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { TEST_CONFIG } from '../../config'

export interface ParsedReport {
  // Synthèse exécutive
  prixCession: number | null
  fourchetteBasse: number | null
  fourchetteHaute: number | null
  noteGlobale: string | null       // "A" | "B" | "C" | "D" | "E"
  confiance: string | null         // "Élevée" | "Moyenne" | "Faible"

  // Points clés
  pointsForts: string[]
  pointsVigilance: string[]

  // Données entreprise
  effectif: string | null
  ca: number | null

  // Valorisation
  methodeUtilisee: string | null
  valeurEntreprise: number | null
  tresorerieUtilisee: number | null
  dettesUtilisees: number | null

  // Retraitements
  retraitementsTotal: number | null
  retraitementsEffectues: boolean

  // SWOT
  faiblesses: string[]

  // Texte brut complet (pour les recherches)
  fullText: string
}

/**
 * Sauvegarder le PDF reçu en buffer dans un fichier temporaire pour inspection.
 */
export function savePDFBuffer(buffer: Buffer, name: string): string {
  const dir = TEST_CONFIG.paths.screenshots || './tests/screenshots'
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const filePath = path.join(dir, `${name}.pdf`)
  fs.writeFileSync(filePath, buffer)
  return filePath
}

/**
 * Extraire le texte d'un PDF via pdftotext (poppler-utils).
 * Retourne null si pdftotext n'est pas disponible.
 */
function extractTextViaPdftotext(pdfPath: string): string | null {
  try {
    return execSync(`pdftotext -layout "${pdfPath}" -`, {
      encoding: 'utf-8',
      timeout: 15000,
    })
  } catch {
    return null
  }
}

/**
 * Parser un buffer PDF et en extraire les données structurées.
 */
export function parsePDF(pdfBuffer: Buffer): ParsedReport {
  // Sauvegarder pour extraction
  const tmpPath = '/tmp/evalup-test-report.pdf'
  fs.writeFileSync(tmpPath, pdfBuffer)

  // Tenter l'extraction via pdftotext
  let text = extractTextViaPdftotext(tmpPath)

  if (!text) {
    // Fallback : extraire les strings lisibles du PDF brut
    text = pdfBuffer
      .toString('latin1')
      .replace(/[^\x20-\x7E\xC0-\xFF\n]/g, ' ')
      .replace(/\s{2,}/g, ' ')
  }

  return parseTextToReport(text)
}

/**
 * Parser le texte brut extrait du PDF.
 */
function parseTextToReport(text: string): ParsedReport {
  return {
    prixCession: extractNumber(text, /[Pp]rix\s*(?:de\s*)?[Cc]ession\s*[:=]?\s*([\d\s]+)\s*€/),
    fourchetteBasse: extractNumber(text, /[Bb]asse?\s*[:=]?\s*([\d\s]+)\s*€/) ||
                     extractNumber(text, /PRIX\s*BAS\s*\n?\s*([\d\s]+)\s*€/),
    fourchetteHaute: extractNumber(text, /[Hh]aute?\s*[:=]?\s*([\d\s]+)\s*€/) ||
                     extractNumber(text, /PRIX\s*HAUT\s*\n?\s*([\d\s]+)\s*€/),
    noteGlobale: extractNote(text),
    confiance: extractConfiance(text),
    pointsForts: extractList(text, /[Pp]oints?\s*forts?/i, /[Pp]oints?\s*de\s*vigilance|[Ff]aiblesse/i),
    pointsVigilance: extractList(text, /[Pp]oints?\s*de\s*vigilance/i, /[Pp]résentation|[Aa]nalyse|SWOT/i),
    effectif: extractString(text, /[Ee]ffectif.*?\n\s*([\d\s]+(?:salariés?)?)/i),
    ca: extractNumber(text, /[Cc]hiffre\s*d['']affaires\s*\n?\s*([\d\s]+)\s*€/),
    methodeUtilisee: extractString(text, /[Mm]éthode.*?[:=]\s*(.+)/),
    valeurEntreprise: extractNumber(text, /[Vv]aleur\s*d[''][Ee]ntreprise.*?([\d\s]+)\s*€/),
    tresorerieUtilisee: extractNumber(text, /[Tt]résorerie\s*disponible.*?([\d\s]+)\s*€/),
    dettesUtilisees: extractNumber(text, /[Dd]ettes?\s*financières?.*?([\d\s]+)\s*€/),
    retraitementsTotal: extractNumber(text, /RETRAITEMENTS?\s*TOTAUX?\s*\n?\s*([\d\s]+)\s*€/),
    retraitementsEffectues: !text.includes('Retraitements EBITDA non effectués') &&
                            !/RETRAITEMENTS?\s*TOTAUX?\s*\n?\s*0\s*€/.test(text),
    faiblesses: extractList(text, /[Ff]aiblesses?\s*(?:.*?Weaknesses)?/i, /[Oo]pportunit/i),
    fullText: text,
  }
}

function extractNumber(text: string, regex: RegExp): number | null {
  const match = text.match(regex)
  if (!match) return null
  const cleaned = match[1].replace(/\s/g, '')
  const value = parseInt(cleaned, 10)
  return isNaN(value) ? null : value
}

function extractNote(text: string): string | null {
  const match = text.match(/[Nn]ote\s*globale\s*[:=]?\s*([A-E])/i) ||
                text.match(/\b([A-E])\b\s*\n?\s*[Ss]core\s*[:=]?\s*\d+/)
  return match ? match[1] : null
}

function extractConfiance(text: string): string | null {
  const match = text.match(/[Cc]onfiance\s*[:=]?\s*(Élevée|Elevee|Moyenne|Faible)/i)
  return match ? match[1] : null
}

function extractString(text: string, regex: RegExp): string | null {
  const match = text.match(regex)
  return match ? match[1].trim() : null
}

function extractList(text: string, startRegex: RegExp, endRegex: RegExp): string[] {
  const startMatch = text.match(startRegex)
  if (!startMatch || startMatch.index === undefined) return []
  const startIndex = startMatch.index + startMatch[0].length
  const remaining = text.slice(startIndex)
  const endMatch = remaining.match(endRegex)
  const section = endMatch && endMatch.index !== undefined
    ? remaining.slice(0, endMatch.index)
    : remaining.slice(0, 500)

  return section
    .split('\n')
    .map(l => l.replace(/^[\s•\-+*]+/, '').trim())
    .filter(l => l.length > 5 && l.length < 200)
}
