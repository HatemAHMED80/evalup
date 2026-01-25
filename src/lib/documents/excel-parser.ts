// Parser pour fichiers Excel (.xls, .xlsx) et CSV

import * as XLSX from 'xlsx'

interface SheetData {
  name: string
  data: Record<string, unknown>[]
  headers: string[]
}

interface ExcelParseResult {
  sheets: SheetData[]
  summary: string
  totalRows: number
  totalSheets: number
}

export function parseExcel(buffer: Buffer): ExcelParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheets: SheetData[] = []
  let totalRows = 0

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)
    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : []

    sheets.push({
      name: sheetName,
      data: jsonData.slice(0, 100), // Limiter à 100 lignes par feuille
      headers,
    })
    totalRows += jsonData.length
  }

  // Générer un résumé textuel pour l'IA
  const summary = generateSummary(sheets, totalRows)

  return {
    sheets,
    summary,
    totalRows,
    totalSheets: sheets.length,
  }
}

function generateSummary(sheets: SheetData[], totalRows: number): string {
  let summary = `Document Excel avec ${sheets.length} feuille(s) et ${totalRows} ligne(s) au total.\n\n`

  for (const sheet of sheets) {
    summary += `=== Feuille: "${sheet.name}" ===\n`
    summary += `Colonnes: ${sheet.headers.join(', ')}\n`
    summary += `Nombre de lignes: ${sheet.data.length}${sheet.data.length >= 100 ? ' (limité à 100)' : ''}\n\n`

    // Afficher les premières lignes comme tableau
    if (sheet.data.length > 0) {
      summary += `Aperçu des données:\n`

      // En-têtes
      summary += sheet.headers.map(h => truncate(String(h), 20)).join(' | ') + '\n'
      summary += sheet.headers.map(() => '---').join(' | ') + '\n'

      // Premières lignes (max 10)
      for (const row of sheet.data.slice(0, 10)) {
        const values = sheet.headers.map(h => truncate(String(row[h] ?? ''), 20))
        summary += values.join(' | ') + '\n'
      }

      if (sheet.data.length > 10) {
        summary += `... et ${sheet.data.length - 10} lignes supplémentaires\n`
      }
      summary += '\n'
    }
  }

  return summary
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str.padEnd(maxLength)
  return str.substring(0, maxLength - 3) + '...'
}

export function parseCSV(text: string): ExcelParseResult {
  const workbook = XLSX.read(text, { type: 'string' })
  return parseExcel(Buffer.from(text))
}
