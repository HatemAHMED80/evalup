// Route API pour déclencher le scraping BODACC (admin)
// Sécurisé: nécessite authentification admin

import { NextRequest, NextResponse } from 'next/server'
import { executerScrapingComplet } from '@/lib/bodacc-scraper'
import { chargerTransactions, getStatistiquesTousSecteurs } from '@/lib/transactions'
import {
  requireAdmin,
  checkRateLimit,
  getRateLimitHeaders,
} from '@/lib/security'

// GET : Récupère les statistiques des transactions (admin only)
export async function GET(_request: NextRequest) {
  // Vérifier l'authentification admin
  const auth = await requireAdmin()
  if (!auth.authenticated) {
    return auth.error
  }

  try {
    const transactions = await chargerTransactions()
    const stats = await getStatistiquesTousSecteurs()

    return NextResponse.json({
      success: true,
      nombreTransactions: transactions.length,
      statistiquesParSecteur: stats,
    })
  } catch (error) {
    console.error('[BODACC] Erreur stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des statistiques',
      },
      { status: 500 }
    )
  }
}

// POST : Déclenche le scraping BODACC (admin only)
export async function POST(request: NextRequest) {
  // Vérifier l'authentification admin
  const auth = await requireAdmin()
  if (!auth.authenticated) {
    return auth.error
  }

  // Rate limiting strict pour le scraping
  const rateLimitResult = await checkRateLimit(auth.user!.id, 'scrapeBodacc')
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes de scraping. Réessayez plus tard.' },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    )
  }

  try {
    // Récupérer le nombre de pages à scraper (limité à 10 max)
    const body = await request.json().catch(() => ({}))
    const nombrePages = Math.min(Math.max(body.pages || 5, 1), 10)

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
    console.error('[BODACC] Erreur scraping:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du scraping',
      },
      { status: 500 }
    )
  }
}
