// Extraction de texte depuis PDF
// Utilise pdf-parse pour extraire le contenu textuel des PDFs

import { PDFParse } from 'pdf-parse'

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Convertir Buffer en Uint8Array pour pdf-parse
    const uint8Array = new Uint8Array(buffer)
    const parser = new PDFParse({ data: uint8Array })
    const textResult = await parser.getText()
    return textResult.text || ''
  } catch (error) {
    console.error('Erreur extraction PDF:', error)
    // Fallback: retourner un message d'erreur plutôt que de bloquer
    return '[Erreur: Impossible d\'extraire le texte du PDF. Le document sera analysé manuellement.]'
  }
}

export async function extractPdfInfo(buffer: Buffer): Promise<{
  text: string
  numPages: number
  info: Record<string, unknown>
}> {
  try {
    const uint8Array = new Uint8Array(buffer)
    const parser = new PDFParse({ data: uint8Array })
    const textResult = await parser.getText()
    const infoResult = await parser.getInfo()

    return {
      text: textResult.text || '',
      numPages: infoResult.total || 0,
      info: infoResult.info || {},
    }
  } catch (error) {
    console.error('Erreur extraction PDF:', error)
    return {
      text: '',
      numPages: 0,
      info: {},
    }
  }
}
