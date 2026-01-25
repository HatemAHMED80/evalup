// Route API pour récupérer les informations d'une entreprise via Pappers

import { NextResponse } from 'next/server'
import { rechercherEntreprise, isPappersConfigured, PappersError } from '@/lib/pappers'

interface RouteParams {
  params: Promise<{ siren: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { siren } = await params

  // Vérifier si l'API Pappers est configurée
  if (!isPappersConfigured()) {
    return NextResponse.json(
      {
        error: 'API Pappers non configurée',
        message: 'Ajoutez PAPPERS_API_KEY dans votre fichier .env.local',
        configured: false,
      },
      { status: 503 }
    )
  }

  try {
    const entreprise = await rechercherEntreprise(siren)

    return NextResponse.json({
      success: true,
      data: entreprise,
    })
  } catch (error) {
    if (error instanceof PappersError) {
      return NextResponse.json(
        {
          error: error.message,
          success: false,
        },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        success: false,
      },
      { status: 500 }
    )
  }
}
