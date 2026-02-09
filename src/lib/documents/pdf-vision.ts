// Traitement des PDFs scannés via Claude Vision
// Convertit les pages PDF en images et utilise Claude pour extraire le texte

import * as pdfjs from 'pdfjs-dist'
import { createCanvas } from 'canvas'

// Configurer le worker PDF.js pour Node.js
if (typeof window === 'undefined') {
  // Désactiver le worker en mode serveur
  pdfjs.GlobalWorkerOptions.workerSrc = ''
}

// Seuil pour détecter un PDF scanné (caractères par page)
const SCANNED_PDF_THRESHOLD = 50

export interface PdfPageImage {
  pageNumber: number
  base64: string
  width: number
  height: number
}

/**
 * Vérifie si un PDF est scanné (peu ou pas de texte extractible)
 */
export async function isScannedPdf(buffer: Buffer): Promise<{
  isScanned: boolean
  textLength: number
  pageCount: number
  avgCharsPerPage: number
}> {
  try {
    const uint8Array = new Uint8Array(buffer)
    const pdf = await pdfjs.getDocument({ data: uint8Array }).promise
    const pageCount = pdf.numPages

    let totalText = ''

    // Extraire le texte de chaque page
    for (let i = 1; i <= Math.min(pageCount, 5); i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
      totalText += pageText
    }

    const avgCharsPerPage = totalText.length / Math.min(pageCount, 5)

    return {
      isScanned: avgCharsPerPage < SCANNED_PDF_THRESHOLD,
      textLength: totalText.length,
      pageCount,
      avgCharsPerPage,
    }
  } catch (error) {
    console.error('Erreur détection PDF scanné:', error)
    // En cas d'erreur, supposer que c'est un PDF scanné
    return {
      isScanned: true,
      textLength: 0,
      pageCount: 0,
      avgCharsPerPage: 0,
    }
  }
}

/**
 * Convertit les pages d'un PDF en images base64
 * @param buffer Buffer du PDF
 * @param maxPages Nombre maximum de pages à convertir (défaut: 10)
 * @param scale Échelle de rendu (défaut: 1.5 pour bonne qualité)
 */
export async function pdfToImages(
  buffer: Buffer,
  maxPages: number = 10,
  scale: number = 1.5
): Promise<PdfPageImage[]> {
  const uint8Array = new Uint8Array(buffer)
  const pdf = await pdfjs.getDocument({ data: uint8Array }).promise
  const pageCount = Math.min(pdf.numPages, maxPages)
  const images: PdfPageImage[] = []

  for (let i = 1; i <= pageCount; i++) {
    try {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale })

      // Créer un canvas pour le rendu
      const canvas = createCanvas(viewport.width, viewport.height)
      const context = canvas.getContext('2d')

      // Rendre la page sur le canvas
      await page.render({
        // @ts-expect-error - Incompatibilité de types entre pdfjs et canvas
        canvasContext: context,
        viewport,
      }).promise

      // Convertir en base64 (format JPEG pour réduire la taille)
      const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]

      images.push({
        pageNumber: i,
        base64,
        width: Math.round(viewport.width),
        height: Math.round(viewport.height),
      })
    } catch (error) {
      console.error(`Erreur rendu page ${i}:`, error)
      // Continuer avec les autres pages
    }
  }

  return images
}

/**
 * Estime le coût en tokens des images
 * (approximation basée sur la documentation Claude)
 */
export function estimateImageTokens(images: PdfPageImage[]): number {
  // Claude compte environ 1 token par 0.4 pixels pour les images
  // Source: documentation Anthropic
  return images.reduce((total, img) => {
    const pixels = img.width * img.height
    return total + Math.ceil(pixels / 750) // ~750 pixels par token
  }, 0)
}
