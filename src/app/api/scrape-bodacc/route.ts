// Route API pour déclencher le scraping BODACC (admin)

import { NextResponse } from 'next/server'
import { executerScrapingComplet } from '@/lib/bodacc-scraper'
import { chargerTransactions, getStatistiquesTousSecteurs } from '@/lib/transactions'

// GET : Récupère les statistiques des transactions
export async function GET() {
  try {
    const transactions = await chargerTransactions()
    const stats = await getStatistiquesTousSecteurs()

    return NextResponse.json({
      success: true,
      nombreTransactions: transactions.length,
      statistiquesParSecteur: stats,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Erreur lors de la récupération des statistiques: ${error}`,
      },
      { status: 500 }
    )
  }
}

// POST : Déclenche le scraping BODACC
export async function POST(request: Request) {
  try {
    // Récupérer le nombre de pages à scraper (optionnel)
    const body = await request.json().catch(() => ({}))
    const nombrePages = body.pages || 5

    // Exécuter le scraping
    const result = await executerScrapingComplet(nombrePages)

    // Récupérer les nouvelles statistiques
    const stats = await getStatistiquesTousSecteurs()

    return NextResponse.json({
      success: result.success,
      scraping: {
        transactionsAjoutees: result.transactionsAjoutees,
        transactionsIgnorees: result.transactionsIgnorees,
        erreurs: result.erreurs,
        duree: `${result.duree}ms`,
      },
      statistiquesParSecteur: stats,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Erreur lors du scraping: ${error}`,
      },
      { status: 500 }
    )
  }
}
