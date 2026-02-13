// API Route pour générer les rapports PDF d'évaluation
import { NextRequest, NextResponse } from 'next/server'
import { generateProfessionalPDFBuffer } from '@/lib/pdf'
import { assembleReportData } from '@/lib/pdf/assemble-report-data'
import type { ConversationContext } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { canDownloadPDF } from '@/lib/usage'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentification requise', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // Vérifier si l'utilisateur est Pro
    const canDownload = await canDownloadPDF(user.id)
    if (!canDownload) {
      return NextResponse.json(
        {
          error: 'Cette fonctionnalite est reservee aux abonnes Pro',
          code: 'PRO_REQUIRED',
        },
        { status: 403 }
      )
    }

    const context: ConversationContext = await request.json()

    // Validation basique des données
    if (!context.entreprise?.nom || !context.entreprise?.siren) {
      return NextResponse.json(
        { error: 'Données entreprise manquantes' },
        { status: 400 }
      )
    }

    if (!context.financials?.bilans?.length) {
      return NextResponse.json(
        { error: 'Données financières manquantes' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur possède une évaluation pour ce SIREN
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('id')
      .eq('user_id', user.id)
      .eq('siren', context.entreprise.siren)
      .limit(1)
      .single()

    if (evalError || !evaluation) {
      return NextResponse.json(
        { error: 'Aucune évaluation trouvée pour cette entreprise', code: 'NOT_FOUND' },
        { status: 403 }
      )
    }

    // Assembler les données du rapport (V2 calculateur + diagnostic + ratios)
    const data = assembleReportData(context)

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
    console.error('Erreur generation PDF:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Donnees de rapport invalides. Relancez la generation depuis la conversation.', code: 'INVALID_DATA' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la generation du rapport PDF. Reessayez ou contactez contact@evalup.fr', code: 'PDF_GENERATION_ERROR' },
      { status: 500 }
    )
  }
}
