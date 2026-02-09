import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getTokenLimit, isPro } from '@/lib/stripe/plans'

// Client Supabase admin pour les operations serveur (lazy init)
let _supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

export interface UsageResult {
  allowed: boolean
  tokensUsed: number
  tokenLimit: number
  remaining: number
  isPro: boolean
}

/**
 * Verifie si l'utilisateur peut utiliser des tokens
 */
export async function checkTokenUsage(userId: string): Promise<UsageResult> {
  const today = new Date().toISOString().split('T')[0]

  // Recuperer l'abonnement actif
  const { data: subscription } = await getSupabaseAdmin()
    .from('subscriptions')
    .select('plan_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  const planId = subscription?.plan_id || 'free'
  const tokenLimit = getTokenLimit(planId)
  const userIsPro = isPro(planId)

  // Recuperer l'usage du jour
  const { data: usage } = await getSupabaseAdmin()
    .from('usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const tokensUsed = usage?.tokens_used || 0
  const remaining = Math.max(0, tokenLimit - tokensUsed)

  return {
    allowed: tokensUsed < tokenLimit,
    tokensUsed,
    tokenLimit,
    remaining,
    isPro: userIsPro,
  }
}

/**
 * Enregistre l'utilisation de tokens
 */
export async function recordTokenUsage(
  userId: string,
  tokensUsed: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  // Upsert l'usage du jour
  const { data: existing } = await getSupabaseAdmin()
    .from('usage')
    .select('id, tokens_used')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (existing) {
    // Mettre a jour
    await getSupabaseAdmin()
      .from('usage')
      .update({
        tokens_used: existing.tokens_used + tokensUsed,
      })
      .eq('id', existing.id)
  } else {
    // Creer
    await getSupabaseAdmin()
      .from('usage')
      .insert({
        user_id: userId,
        date: today,
        tokens_used: tokensUsed,
      })
  }
}

/**
 * Verifie si l'utilisateur peut telecharger des PDFs
 * (abonnement Pro OU achat unique eval_complete)
 */
export async function canDownloadPDF(userId: string): Promise<boolean> {
  // Vérifier abonnement Pro
  const { data: subscription } = await getSupabaseAdmin()
    .from('subscriptions')
    .select('plan_id, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (isPro(subscription?.plan_id)) return true

  // Vérifier achat unique (évaluation payée ou complétée)
  const { data: paidEval } = await getSupabaseAdmin()
    .from('evaluations')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['paid', 'complete_in_progress', 'completed'])
    .limit(1)
    .single()

  return !!paidEval
}
