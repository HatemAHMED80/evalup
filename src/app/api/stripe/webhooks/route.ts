import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripeClient } from '@/lib/stripe/client'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { confirmPurchase } from '@/lib/usage'
import type Stripe from 'stripe'

// Client Supabase avec service role pour les webhooks (lazy init)
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

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = getStripeClient().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Erreur verification signature webhook:', error)
    return NextResponse.json(
      { error: 'Signature invalide' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erreur traitement webhook:', error)
    // Toujours retourner 200 pour éviter que Stripe ne retry indéfiniment
    // Les erreurs sont loguées et doivent être traitées via monitoring
    return NextResponse.json({ received: true, error: true })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // ============================================
  // CAS 1: Paiement unique (eval_complete)
  // ============================================
  if (session.mode === 'payment') {
    const evaluationId = session.metadata?.evaluation_id
    const paymentIntentId = session.payment_intent as string

    if (!evaluationId || !paymentIntentId) {
      console.error('Metadata manquantes pour achat unique:', {
        evaluationId,
        paymentIntentId,
      })
      return
    }

    // Confirmer l'achat et activer l'evaluation complete
    await confirmPurchase(paymentIntentId, session.id)

    console.log('Achat unique confirme:', {
      sessionId: session.id,
      evaluationId,
      siren: session.metadata?.siren,
    })
    return
  }

  // ============================================
  // CAS 2: Abonnement (pro_10, pro_unlimited)
  // ============================================
  const userId = session.subscription
    ? (await getStripeClient().subscriptions.retrieve(session.subscription as string))
        .metadata.supabase_user_id
    : null

  if (!userId) {
    console.error('User ID manquant dans la session checkout')
    return
  }

  // Le subscription.created event va gerer la mise a jour
  console.log('Checkout completed for user:', userId)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.supabase_user_id

  if (!userId) {
    console.error('User ID manquant dans les metadata de la subscription')
    return
  }

  const planId = subscription.metadata.plan_id || 'pro_monthly'

  // Upsert la subscription dans Supabase
  // En Stripe SDK v20, current_period_end est sur les items, pas sur la subscription
  const firstItem = subscription.items?.data?.[0]
  const periodEnd = firstItem?.current_period_end
  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .upsert({
      id: subscription.id,
      user_id: userId,
      status: subscription.status,
      plan_id: planId,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'id',
    })

  if (error) {
    console.error('Erreur mise a jour subscription:', error)
    throw error
  }

  console.log('Subscription updated:', subscription.id, 'status:', subscription.status)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.supabase_user_id

  if (!userId) {
    console.error('User ID manquant dans les metadata de la subscription')
    return
  }

  // Mettre a jour le statut a canceled
  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
    })
    .eq('id', subscription.id)

  if (error) {
    console.error('Erreur suppression subscription:', error)
    throw error
  }

  console.log('Subscription deleted:', subscription.id)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.customer) return

  // Recuperer le user_id depuis le customer
  const customer = await getStripeClient().customers.retrieve(invoice.customer as string)
  if (customer.deleted) return

  const userId = customer.metadata.supabase_user_id
  if (!userId) return

  // Sauvegarder la facture
  const { error } = await getSupabaseAdmin()
    .from('invoices')
    .upsert({
      id: invoice.id,
      user_id: userId,
      amount_paid: invoice.amount_paid,
      invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      created_at: new Date(invoice.created * 1000).toISOString(),
    }, {
      onConflict: 'id',
    })

  if (error) {
    console.error('Erreur sauvegarde facture:', error)
    throw error
  }

  console.log('Invoice saved:', invoice.id)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed for invoice:', invoice.id)
  // On pourrait envoyer un email de notification ici
}
