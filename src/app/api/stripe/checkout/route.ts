import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { PLANS } from '@/lib/stripe/plans'
import { createPurchase } from '@/lib/usage'
import { checkoutBodySchema } from '@/lib/security/schemas'

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

    const rawBody = await request.json()
    const parseResult = checkoutBodySchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', fields: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { planId, evaluationId, siren } = parseResult.data

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

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single() as { data: { stripe_customer_id: string | null } | null }

      customerId = profile?.stripe_customer_id || null
    } catch {
      // Table profiles peut ne pas exister
      console.log('Profil non trouvé, création customer Stripe')
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

      // Sauvegarder le customer_id dans le profil (optionnel)
      try {
        await (supabase
          .from('profiles') as any)
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      } catch {
        console.log('Impossible de sauvegarder stripe_customer_id (non-bloquant)')
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
          // Chercher l'évaluation Flash en cours ou terminée pour ce SIREN
          // Utiliser maybeSingle() au lieu de single() pour gérer le cas où il n'y a pas de résultat
          const { data: evaluations } = await supabase
            .from('evaluations')
            .select('id')
            .eq('user_id', user.id)
            .eq('siren', siren)
            .in('status', ['in_progress', 'flash_completed', 'payment_pending'])
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
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${siren}?upgrade=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${siren}?upgrade=canceled`,
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId,
          evaluation_id: evalId || '',
          siren: siren || '',
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
    console.error('Erreur checkout:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la session' },
      { status: 500 }
    )
  }
}
