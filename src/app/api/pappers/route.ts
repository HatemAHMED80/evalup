// API Route pour récupérer les données Pappers
// GET /api/pappers?siren=123456789

import { NextRequest, NextResponse } from 'next/server'
import {
  rechercherEntreprise,
  isPappersConfigured,
  PappersError,
} from '@/lib/pappers'
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/security/rate-limit'

export async function GET(request: NextRequest) {
  // Rate limiting: 30 par minute par IP
  const ip = getClientIp(request)
  const rateLimitResult = await checkRateLimit(ip, 'pappersApi')
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Trop de requêtes. Réessayez plus tard.', code: 'RATE_LIMITED' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }

  // Vérifier si l'API est configurée
  if (!isPappersConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'API Pappers non configurée',
        code: 'API_NOT_CONFIGURED',
      },
      { status: 503 }
    )
  }

  // Récupérer le paramètre SIREN
  const searchParams = request.nextUrl.searchParams
  const siren = searchParams.get('siren')

  if (!siren) {
    return NextResponse.json(
      {
        success: false,
        error: 'Paramètre SIREN requis',
        code: 'MISSING_SIREN',
      },
      { status: 400 }
    )
  }

  try {
    const data = await rechercherEntreprise(siren)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    if (error instanceof PappersError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
