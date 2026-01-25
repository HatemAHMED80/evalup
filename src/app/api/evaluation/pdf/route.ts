// API Route pour générer les rapports PDF d'évaluation
import { NextRequest, NextResponse } from 'next/server'
import { generateProfessionalPDFBuffer, type ProfessionalReportData } from '@/lib/pdf'

export async function POST(request: NextRequest) {
  try {
    const data: ProfessionalReportData = await request.json()

    // Validation basique des données
    if (!data.entreprise?.nom || !data.entreprise?.siren) {
      return NextResponse.json(
        { error: 'Données entreprise manquantes' },
        { status: 400 }
      )
    }

    if (!data.valeurEntreprise?.moyenne) {
      return NextResponse.json(
        { error: 'Données de valorisation manquantes' },
        { status: 400 }
      )
    }

    // Générer le PDF professionnel (30 pages)
    const pdfBuffer = await generateProfessionalPDFBuffer(data)

    // Nettoyer le nom de fichier
    const fileName = `evaluation-${data.entreprise.siren}-${new Date().toISOString().split('T')[0]}.pdf`

    // Convertir Buffer en Uint8Array pour NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)

    // Retourner le PDF
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Erreur génération PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}
