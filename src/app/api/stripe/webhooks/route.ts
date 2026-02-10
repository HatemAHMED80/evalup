import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripeClient } from '@/lib/stripe/client'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { confirmPurchase } from '@/lib/usage'
import { sendPaymentConfirmation, sendPaymentFailed, sendSubscriptionWelcome, sendRefundConfirmation } from '@/lib/emails/send'
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

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(charge)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session expired:', session.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erreur traitement webhook:', error)
    // Retourner 500 pour que Stripe retry (max 3 jours)
    // Les erreurs critiques (DB) méritent un retry
    return NextResponse.json(
      { error: 'Erreur traitement webhook' },
      { status: 500 }
    )
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

    // Envoyer l'email de confirmation de paiement
    if (session.customer_details?.email) {
      await sendPaymentConfirmation({
        to: session.customer_details.email,
        siren: session.metadata?.siren || '',
        montant: session.amount_total || 7900,
      })
    }
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

  // Envoyer un email de bienvenue lors de la creation d'un abonnement actif
  if (subscription.status === 'active') {
    const customer = await getStripeClient().customers.retrieve(subscription.customer as string)
    if (!('deleted' in customer && customer.deleted) && customer.email) {
      const planName = planId === 'pro_unlimited' ? 'Pro Illimite' : 'Pro 10'
      await sendSubscriptionWelcome({ to: customer.email, planName })
    }
  }
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

  // Envoyer un email de notification d'echec de paiement
  if (invoice.customer) {
    const customer = await getStripeClient().customers.retrieve(invoice.customer as string)
    if (!('deleted' in customer && customer.deleted) && customer.email) {
      await sendPaymentFailed({
        to: customer.email,
        montant: invoice.amount_due,
        invoiceUrl: invoice.hosted_invoice_url,
      })
    }
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = getSupabaseAdmin()
  const paymentIntentId = charge.payment_intent as string
  const isFullRefund = charge.amount_refunded >= charge.amount

  console.log('Charge refunded:', charge.id, {
    amount: charge.amount,
    amountRefunded: charge.amount_refunded,
    isFullRefund,
    paymentIntentId,
  })

  if (!paymentIntentId) return

  // Trouver l'achat correspondant via le payment_intent
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id, evaluation_id, user_id, status')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (!purchase) {
    console.warn('[Refund] Aucun achat trouve pour payment_intent:', paymentIntentId)
    return
  }

  // Mettre a jour le statut de l'achat
  await supabase
    .from('purchases')
    .update({
      status: isFullRefund ? 'refunded' : 'partially_refunded',
      refunded_at: new Date().toISOString(),
      refund_amount: charge.amount_refunded,
    })
    .eq('id', purchase.id)

  // Pour un remboursement total, revoquer l'acces a l'evaluation
  if (isFullRefund && purchase.evaluation_id) {
    await supabase
      .from('evaluations')
      .update({ status: 'refunded' })
      .eq('id', purchase.evaluation_id)

    console.log('[Refund] Acces evaluation revoque:', purchase.evaluation_id)
  }

  // Envoyer un email de confirmation de remboursement
  if (charge.billing_details?.email) {
    // Recuperer le SIREN depuis les metadata du payment_intent
    let siren: string | undefined
    try {
      const pi = await getStripeClient().paymentIntents.retrieve(paymentIntentId)
      siren = pi.metadata?.siren
    } catch {
      // Non-bloquant
    }

    await sendRefundConfirmation({
      to: charge.billing_details.email,
      montant: charge.amount_refunded,
      siren,
    })
  }
}
