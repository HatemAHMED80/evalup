import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Chemins autorisés pour la redirection post-auth
const ALLOWED_REDIRECT_PREFIXES = ['/compte', '/tarifs', '/aide', '/checkout', '/diagnostic', '/evaluation', '/dashboard', '/reset-password']

function isValidRedirect(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.startsWith('//')) return false // Prevent protocol-relative redirect
  return ALLOWED_REDIRECT_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '?'))
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/app'
  const next = isValidRedirect(rawNext) ? rawNext : '/app'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Retour a la page de connexion si erreur
  return NextResponse.redirect(`${origin}/connexion?error=auth_failed`)
}
