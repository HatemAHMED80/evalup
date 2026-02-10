// Module d'envoi d'emails transactionnels via Resend

import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM = 'EvalUp <contact@evalup.fr>'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ============================================
// LAYOUT COMMUN
// ============================================

function emailLayout(title: string, content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #1E40AF; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">EvalUp</h1>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 24px;">${title}</h2>
        ${content}
      </div>
      <div style="background: #f9fafb; padding: 20px 24px; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          EvalUp - Valorisation d'entreprise par IA<br>
          <a href="https://evalup.fr" style="color: #1E40AF;">evalup.fr</a>
        </p>
      </div>
    </div>
  `
}

function button(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${url}" style="display: inline-block; background: #1E40AF; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px;">${text}</a>
    </div>
  `
}

// ============================================
// 1. CONFIRMATION DE PAIEMENT
// ============================================

export async function sendPaymentConfirmation(params: {
  to: string
  siren: string
  entreprise?: string
  montant: number
}) {
  const resend = getResend()
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY non configuree - email paiement non envoye')
    return
  }

  const { to, siren, entreprise, montant } = params
  const nomEntreprise = entreprise ? escapeHtml(entreprise) : `SIREN ${siren}`
  const montantFormate = (montant / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  const content = `
    <p style="color: #374151; line-height: 1.6;">
      Votre paiement de <strong>${montantFormate}</strong> a bien ete recu.
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #166534; margin: 0; font-weight: 600;">Paiement confirme</p>
      <p style="color: #374151; margin: 8px 0 0;">
        Evaluation complete de <strong>${nomEntreprise}</strong>
      </p>
    </div>
    <p style="color: #374151; line-height: 1.6;">
      Votre rapport professionnel (32 pages) est maintenant disponible.
      Vous pouvez y acceder directement depuis votre conversation.
    </p>
    ${button('Acceder a mon evaluation', `https://evalup.fr/chat/${siren}`)}
    <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
      Votre facture est disponible dans votre <a href="https://evalup.fr/compte/abonnement" style="color: #1E40AF;">espace compte</a>.
      Pour toute question, contactez-nous a <a href="mailto:contact@evalup.fr" style="color: #1E40AF;">contact@evalup.fr</a>.
    </p>
  `

  try {
    await resend.emails.send({
      from: FROM,
      to: [to],
      subject: `Paiement confirme - Evaluation ${nomEntreprise}`,
      html: emailLayout('Merci pour votre achat !', content),
    })
    console.log('[Email] Confirmation paiement envoyee a', to)
  } catch (error) {
    console.error('[Email] Erreur envoi confirmation paiement:', error)
  }
}

// ============================================
// 2. ECHEC DE PAIEMENT
// ============================================

export async function sendPaymentFailed(params: {
  to: string
  montant: number
  invoiceUrl?: string | null
}) {
  const resend = getResend()
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY non configuree - email echec non envoye')
    return
  }

  const { to, montant, invoiceUrl } = params
  const montantFormate = (montant / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  const content = `
    <p style="color: #374151; line-height: 1.6;">
      Le paiement de <strong>${montantFormate}</strong> pour votre abonnement EvalUp n'a pas pu etre traite.
    </p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #991b1b; margin: 0; font-weight: 600;">Paiement echoue</p>
      <p style="color: #374151; margin: 8px 0 0;">
        Veuillez mettre a jour votre moyen de paiement pour eviter l'interruption de votre abonnement.
      </p>
    </div>
    ${button('Mettre a jour mon paiement', 'https://evalup.fr/compte/abonnement')}
    ${invoiceUrl ? `<p style="color: #6b7280; font-size: 13px;"><a href="${escapeHtml(invoiceUrl)}" style="color: #1E40AF;">Voir la facture</a></p>` : ''}
    <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
      Si le probleme persiste, contactez-nous a <a href="mailto:contact@evalup.fr" style="color: #1E40AF;">contact@evalup.fr</a>.
    </p>
  `

  try {
    await resend.emails.send({
      from: FROM,
      to: [to],
      subject: 'Action requise - Echec de paiement EvalUp',
      html: emailLayout('Echec de paiement', content),
    })
    console.log('[Email] Echec paiement envoye a', to)
  } catch (error) {
    console.error('[Email] Erreur envoi echec paiement:', error)
  }
}

// ============================================
// 3. BIENVENUE ABONNEMENT
// ============================================

export async function sendSubscriptionWelcome(params: {
  to: string
  planName: string
}) {
  const resend = getResend()
  if (!resend) return

  const { to, planName } = params

  const content = `
    <p style="color: #374151; line-height: 1.6;">
      Bienvenue dans votre abonnement <strong>${escapeHtml(planName)}</strong> !
    </p>
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #1e40af; margin: 0; font-weight: 600;">Votre abonnement est actif</p>
      <p style="color: #374151; margin: 8px 0 0;">
        Vous avez maintenant acces a toutes les fonctionnalites du plan ${escapeHtml(planName)}.
      </p>
    </div>
    <p style="color: #374151; line-height: 1.6;">Vous pouvez maintenant :</p>
    <ul style="color: #374151; line-height: 2;">
      <li>Realiser des evaluations completes avec rapport PDF</li>
      <li>Uploader des documents comptables</li>
      <li>Poser des questions illimitees a l'IA</li>
    </ul>
    ${button('Commencer une evaluation', 'https://evalup.fr')}
    <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
      Gerez votre abonnement dans votre <a href="https://evalup.fr/compte/abonnement" style="color: #1E40AF;">espace compte</a>.
    </p>
  `

  try {
    await resend.emails.send({
      from: FROM,
      to: [to],
      subject: `Bienvenue sur EvalUp ${escapeHtml(planName)} !`,
      html: emailLayout('Bienvenue !', content),
    })
    console.log('[Email] Bienvenue abonnement envoye a', to)
  } catch (error) {
    console.error('[Email] Erreur envoi bienvenue:', error)
  }
}

// ============================================
// 4. CONFIRMATION DE REMBOURSEMENT
// ============================================

export async function sendRefundConfirmation(params: {
  to: string
  montant: number
  siren?: string
}) {
  const resend = getResend()
  if (!resend) return

  const { to, montant, siren } = params
  const montantFormate = (montant / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  const content = `
    <p style="color: #374151; line-height: 1.6;">
      Votre remboursement de <strong>${montantFormate}</strong> a ete traite avec succes.
    </p>
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #1e40af; margin: 0; font-weight: 600;">Remboursement confirme</p>
      <p style="color: #374151; margin: 8px 0 0;">
        Le montant sera credite sur votre moyen de paiement d'origine sous 5 a 10 jours ouvrés.
      </p>
    </div>
    <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
      L'acces a l'evaluation complete${siren ? ` (SIREN ${siren})` : ''} a ete revoque.
      Pour toute question, contactez-nous a <a href="mailto:contact@evalup.fr" style="color: #1E40AF;">contact@evalup.fr</a>.
    </p>
  `

  try {
    await resend.emails.send({
      from: FROM,
      to: [to],
      subject: 'Remboursement confirme - EvalUp',
      html: emailLayout('Remboursement traite', content),
    })
    console.log('[Email] Confirmation remboursement envoyee a', to)
  } catch (error) {
    console.error('[Email] Erreur envoi confirmation remboursement:', error)
  }
}
