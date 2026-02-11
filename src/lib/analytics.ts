// Analytics de conversion - Compatible GA4, Plausible, PostHog
// Envoie les evenements au dataLayer (GA4) et/ou a l'API custom

type ConversionEvent =
  | 'signup'
  | 'search_siren'
  | 'start_flash'
  | 'flash_complete'
  | 'click_upgrade'
  | 'start_checkout'
  | 'purchase_complete'
  | 'pdf_download'
  | 'contact_submit'
  // Diagnostic flow events
  | 'diagnostic_start'
  | 'sirene_entered'
  | 'sirene_skipped'
  | 'form_step_completed'
  | 'archetype_detected'
  | 'signup_completed'
  | 'diagnostic_viewed'
  | 'report_cta_clicked'
  | 'checkout_started'

interface EventParams {
  siren?: string
  value?: number
  currency?: string
  plan?: string
  [key: string]: string | number | boolean | undefined
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    gtag?: (...args: unknown[]) => void
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void
  }
}

/**
 * Track un evenement de conversion.
 * Envoie a GA4 (gtag/dataLayer) et Plausible si disponibles.
 */
export function trackConversion(event: ConversionEvent, params?: EventParams) {
  if (typeof window === 'undefined') return

  const eventData = {
    event,
    ...params,
    timestamp: Date.now(),
  }

  // Google Analytics 4 (via gtag)
  if (window.gtag) {
    // Mapper les evenements vers les evenements GA4 standard
    const ga4Mapping: Record<ConversionEvent, string> = {
      signup: 'sign_up',
      search_siren: 'search',
      start_flash: 'begin_checkout',
      flash_complete: 'add_to_cart',
      click_upgrade: 'select_promotion',
      start_checkout: 'begin_checkout',
      purchase_complete: 'purchase',
      pdf_download: 'file_download',
      contact_submit: 'generate_lead',
      // Diagnostic flow
      diagnostic_start: 'tutorial_begin',
      sirene_entered: 'search',
      sirene_skipped: 'tutorial_begin',
      form_step_completed: 'tutorial_complete',
      archetype_detected: 'view_item',
      signup_completed: 'sign_up',
      diagnostic_viewed: 'view_item',
      report_cta_clicked: 'select_promotion',
      checkout_started: 'begin_checkout',
    }

    const ga4Event = ga4Mapping[event] || event
    window.gtag('event', ga4Event, {
      ...params,
      event_category: 'conversion',
    })
  }

  // Plausible Analytics
  if (window.plausible) {
    const props: Record<string, string | number> = {}
    if (params) {
      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined) props[key] = val as string | number
      }
    }
    window.plausible(event, { props })
  }

  // DataLayer (GTM)
  if (window.dataLayer) {
    window.dataLayer.push(eventData)
  }

  // Console en dev
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, params || '')
  }
}

/**
 * Track une conversion d'achat (GA4 purchase event)
 */
export function trackPurchase(params: {
  siren: string
  plan: string
  value: number
}) {
  trackConversion('purchase_complete', {
    ...params,
    currency: 'EUR',
  })
}
