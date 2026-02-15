// API Route pour générer les rapports PDF d'évaluation
import { NextRequest, NextResponse } from 'next/server'
import { generateProfessionalPDFBuffer } from '@/lib/pdf'
import { assembleReportData, assembleFromEvaluationData } from '@/lib/pdf/assemble-report-data'
import type { ConversationContext } from '@/lib/anthropic'
import type { EvaluationData } from '@/lib/evaluation/evaluation-data'
import { computeDerivedMetrics } from '@/lib/evaluation/evaluation-data'
import { createClient } from '@/lib/supabase/server'
import { canDownloadPDF } from '@/lib/usage'
import { validateBeforePDFGeneration } from '@/lib/validation/pre-pdf-validation'

// Detect if body is EvaluationData (new format) or ConversationContext (legacy)
function isEvaluationData(body: unknown): body is EvaluationData {
  return (
    typeof body === 'object' &&
    body !== null &&
    'bilans' in body &&
    Array.isArray((body as Record<string, unknown>).bilans) &&
    'qualitative' in body &&
    'archetype' in body &&
    'coherence' in body &&
    'retraitements' in body &&
    'entreprise' in body
  )
}

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

    const body = await request.json()

    if (isEvaluationData(body)) {
      // ═══ NOUVEAU CHEMIN : EvaluationData (Phase 2) ═══
      const evalData = computeDerivedMetrics(body)

      if (!evalData.entreprise?.nom || !evalData.entreprise?.siren) {
        return NextResponse.json(
          { error: 'Données entreprise manquantes' },
          { status: 400 }
        )
      }

      if (evalData.bilans.length === 0) {
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
        .eq('siren', evalData.entreprise.siren)
        .limit(1)
        .single()

      if (evalError || !evaluation) {
        return NextResponse.json(
          { error: 'Aucune évaluation trouvée pour cette entreprise', code: 'NOT_FOUND' },
          { status: 403 }
        )
      }

      // Coherence check from EvaluationData
      const warnings: string[] = []
      for (const alert of evalData.coherence.alerts) {
        if (alert.type === 'error' && !alert.userConfirmed) {
          return NextResponse.json(
            {
              error: 'Données incohérentes détectées. Corrigez les erreurs avant de générer le PDF.',
              details: [alert.message],
              code: 'VALIDATION_FAILED',
            },
            { status: 422 }
          )
        }
        if (alert.type === 'warning' && !alert.userConfirmed) {
          warnings.push(alert.message)
        }
        // 'info' alerts are informational — included in report context but don't block
        if (alert.type === 'info') {
          warnings.push(alert.message)
        }
      }

      const data = assembleFromEvaluationData(evalData, warnings)
      const pdfBuffer = await generateProfessionalPDFBuffer(data)
      const fileName = `evaluation-${data.entreprise.siren}-${new Date().toISOString().split('T')[0]}.pdf`
      const uint8Array = new Uint8Array(pdfBuffer)

      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-cache',
        },
      })
    } else {
      // ═══ ANCIEN CHEMIN : ConversationContext (backward compatible) ═══
      const context: ConversationContext = body

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

      // Gate 3 : validation pre-PDF
      const validation = validateBeforePDFGeneration(context)
      if (!validation.canGenerate) {
        return NextResponse.json(
          {
            error: 'Données incohérentes détectées. Corrigez les erreurs avant de générer le PDF.',
            details: validation.errors,
            code: 'VALIDATION_FAILED',
          },
          { status: 422 }
        )
      }

      const data = assembleReportData(context, validation.warnings)
      const pdfBuffer = await generateProfessionalPDFBuffer(data)
      const fileName = `evaluation-${data.entreprise.siren}-${new Date().toISOString().split('T')[0]}.pdf`
      const uint8Array = new Uint8Array(pdfBuffer)

      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-cache',
        },
      })
    }
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
