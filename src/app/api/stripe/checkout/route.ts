import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/client'
import { PLANS } from '@/lib/stripe/plans'
import { createPurchase, updateEvaluationDiagnosticData } from '@/lib/usage'
import { checkoutBodySchema } from '@/lib/security/schemas'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/security/rate-limit'

// Client admin pour les opérations sur profiles (bypass RLS)
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      )
    }

    // Rate limiting: 10 checkouts par heure par utilisateur
    const rateLimitResult = await checkRateLimit(user.id, 'stripeCheckout')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const rawBody = await request.json()
    const parseResult = checkoutBodySchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', fields: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { planId, evaluationId, siren, archetypeId, diagnosticData } = parseResult.data

    // Verifier que le plan existe
    const plan = PLANS[planId as keyof typeof PLANS]
    if (!plan || plan.id === 'free' || plan.id === 'flash') {
      return NextResponse.json(
        { error: 'Plan invalide' },
        { status: 400 }
      )
    }

    // Résoudre le priceId côté serveur (pour les env vars serveur)
    const priceId = 'priceId' in plan ? plan.priceId : null
    if (!priceId) {
      return NextResponse.json(
        { error: 'Prix non configuré pour ce plan' },
        { status: 400 }
      )
    }

    // Recuperer ou creer le profil avec stripe_customer_id
    let customerId: string | null = null

    // Utiliser le client admin pour les opérations sur profiles (bypass RLS)
    const adminClient = getAdminClient()

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.warn('[Checkout] Profil non trouvé:', profileError.message)
    } else {
      customerId = profile?.stripe_customer_id || null
    }

    // Vérifier que le customer existe encore chez Stripe
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId)
      } catch {
        console.warn('[Checkout] Customer Stripe invalide, recréation:', customerId)
        customerId = null
      }
    }

    // Creer un customer Stripe si necessaire
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Sauvegarder le customer_id dans le profil
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)

      if (updateError) {
        console.warn('[Checkout] Impossible de sauvegarder stripe_customer_id:', updateError.message)
      }
    }

    // ============================================
    // PAIEMENT UNIQUE (eval_complete à 79€)
    // ============================================
    if (plan.type === 'one_time') {
      // Récupérer l'évaluation par ID ou par SIREN
      let evalId = evaluationId

      if (!evalId && siren) {
        try {
          // Chercher l'évaluation en attente de paiement pour ce SIREN
          const { data: evaluations } = await supabase
            .from('evaluations')
            .select('id')
            .eq('user_id', user.id)
            .eq('siren', siren)
            .in('status', ['payment_pending'])
            .order('created_at', { ascending: false })
            .limit(1) as { data: Array<{ id: string }> | null }

          const evaluation = evaluations?.[0]

          if (evaluation) {
            evalId = evaluation.id
          } else {
            // Créer une nouvelle évaluation si aucune n'existe
            const { getOrCreateEvaluation } = await import('@/lib/usage/evaluations')
            const newEval = await getOrCreateEvaluation(user.id, siren)
            evalId = newEval.id
          }
        } catch (evalError) {
          console.error('Erreur recherche/creation evaluation:', evalError)
          // En dernier recours, créer une évaluation
          try {
            const { getOrCreateEvaluation } = await import('@/lib/usage/evaluations')
            const newEval = await getOrCreateEvaluation(user.id, siren)
            evalId = newEval.id
          } catch (createError) {
            console.error('Erreur creation evaluation:', createError)
          }
        }
      }

      // Si pas d'evalId mais on a un SIREN, on peut quand même procéder
      // L'evalId sera créé après le paiement via le webhook
      if (!evalId && !siren) {
        console.error('Checkout error: ni evalId ni siren', { evaluationId, siren, userId: user.id })
        return NextResponse.json(
          { error: 'SIREN ou ID evaluation requis pour achat unique' },
          { status: 400 }
        )
      }

      // Stocker les données du diagnostic dans l'évaluation
      if (evalId && archetypeId) {
        try {
          await updateEvaluationDiagnosticData(evalId, archetypeId, diagnosticData || {})
        } catch (diagError) {
          console.error('Erreur stockage diagnostic data (non-bloquant):', diagError)
        }
      }

      // Creer la session Checkout en mode payment (one-time)
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/evaluation/${evalId}/upload?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/diagnostic?canceled=true`,
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId,
          evaluation_id: evalId || '',
          siren: siren || '',
          archetype_id: archetypeId || '',
        },
        payment_intent_data: {
          metadata: {
            supabase_user_id: user.id,
            plan_id: planId,
            evaluation_id: evalId || '',
            siren: siren || '',
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
      })

      // Creer l'enregistrement d'achat en attente (optionnel si tables pas prêtes)
      if (evalId) {
        try {
          await createPurchase(user.id, evalId, session.id)
        } catch (purchaseError) {
          console.error('Erreur creation purchase (non-bloquant):', purchaseError)
        }
      }

      return NextResponse.json({ url: session.url })
    }

    // ============================================
    // ABONNEMENT (pro_10, pro_unlimited)
    // ============================================
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/compte/abonnement?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/tarifs?canceled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Erreur checkout:', errMsg, error)

    let message = 'Erreur lors de la creation de la session'
    if (errMsg.includes('No such price')) {
      message = 'Configuration Stripe incomplète : prix non trouvé. Vérifiez STRIPE_PRICE_EVAL_COMPLETE.'
    } else if (errMsg.includes('Invalid API Key')) {
      message = 'Clé Stripe invalide. Vérifiez STRIPE_SECRET_KEY.'
    } else if (errMsg.includes('STRIPE_SECRET_KEY')) {
      message = 'Clé Stripe manquante. Configurez STRIPE_SECRET_KEY.'
    } else {
      message = `Erreur paiement : ${errMsg}`
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
