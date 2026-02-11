// Client Stripe cote serveur
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY?.replace(/[\s"'\\n]+$/g, '').replace(/^["']+/, '')
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(key, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
      maxNetworkRetries: 3,
      timeout: 30000,
    })
  }
  return _stripe
}

// Pour la compatibilite avec le code existant
export const stripe = {
  get customers() { return getStripeClient().customers },
  get checkout() { return getStripeClient().checkout },
  get billingPortal() { return getStripeClient().billingPortal },
  get subscriptions() { return getStripeClient().subscriptions },
  get webhooks() { return getStripeClient().webhooks },
} as Stripe
