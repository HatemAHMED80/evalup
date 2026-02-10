import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'contact@evalup.fr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      )
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message trop long (5000 caracteres max)' },
        { status: 400 }
      )
    }

    // Mapping sujet
    const sujets: Record<string, string> = {
      question: 'Question generale',
      technique: 'Probleme technique',
      abonnement: 'Abonnement / Facturation',
      partenariat: 'Partenariat',
      autre: 'Autre',
    }

    const sujetLabel = sujets[subject] || subject

    // Envoyer l'email via Resend
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Contact] RESEND_API_KEY non configuree - message non envoye')
      console.log('[Contact] Message recu:', { name, email, subject: sujetLabel, message: message.substring(0, 100) })
      return NextResponse.json(
        { error: 'Service email non configure. Contactez-nous directement a contact@evalup.fr' },
        { status: 503 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Email de notification à l'admin
    await resend.emails.send({
      from: 'EvalUp Contact <contact@evalup.fr>',
      to: [ADMIN_EMAIL],
      replyTo: email,
      subject: `[EvalUp Contact] ${sujetLabel} - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1E40AF; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Nouveau message de contact</h2>
          </div>
          <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 100px;">Nom</td>
                <td style="padding: 8px 0; font-weight: bold;">${escapeHtml(name)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email</td>
                <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Sujet</td>
                <td style="padding: 8px 0;">${escapeHtml(sujetLabel)}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
            <div style="white-space: pre-wrap; color: #374151; line-height: 1.6;">${escapeHtml(message)}</div>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Repondez directement a cet email pour contacter ${escapeHtml(name)}.
          </p>
        </div>
      `,
    })

    // Email de confirmation à l'utilisateur
    await resend.emails.send({
      from: 'EvalUp <contact@evalup.fr>',
      to: [email],
      subject: 'Nous avons bien recu votre message - EvalUp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1E40AF; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Merci pour votre message</h2>
          </div>
          <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Bonjour ${escapeHtml(name)},</p>
            <p>Nous avons bien recu votre message concernant : <strong>${escapeHtml(sujetLabel)}</strong>.</p>
            <p>Notre equipe vous repondra dans les meilleurs delais (generalement sous 24h ouvrées).</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
            <p style="color: #6b7280; font-size: 14px;">Votre message :</p>
            <div style="background: white; padding: 12px; border-radius: 4px; color: #374151; white-space: pre-wrap; font-size: 14px;">${escapeHtml(message)}</div>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 16px; text-align: center;">
            EvalUp - Valorisation d'entreprise par IA<br>
            <a href="https://evalup.fr" style="color: #1E40AF;">evalup.fr</a>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Contact] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message. Reessayez ou contactez contact@evalup.fr' },
      { status: 500 }
    )
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
