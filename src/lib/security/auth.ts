/**
 * Utilitaires d'authentification pour les API routes
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

export interface AuthResult {
  authenticated: boolean
  user?: User
  error?: NextResponse
}

/**
 * Vérifie l'authentification d'une requête API
 * Retourne l'utilisateur si authentifié, ou une erreur prête à être retournée
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        authenticated: false,
        error: NextResponse.json(
          { error: 'Authentification requise' },
          { status: 401 }
        ),
      }
    }

    return {
      authenticated: true,
      user,
    }
  } catch (error) {
    console.error('[Auth] Erreur vérification auth:', error)
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: 'Erreur d\'authentification' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Vérifie l'authentification de manière optionnelle
 * Retourne l'utilisateur si connecté, null sinon
 */
export async function optionalAuth(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user || null
  } catch {
    return null
  }
}

/**
 * Vérifie si un utilisateur est admin
 * Pour l'instant, vérifie si l'email est dans la liste des admins
 */
const ADMIN_EMAILS = [
  'hatem@posse.fr',
  'admin@evalup.fr',
]

export async function requireAdmin(): Promise<AuthResult> {
  const authResult = await requireAuth()

  if (!authResult.authenticated || !authResult.user) {
    return authResult
  }

  if (!authResult.user.email || !ADMIN_EMAILS.includes(authResult.user.email)) {
    return {
      authenticated: false,
      error: NextResponse.json(
        { error: 'Accès administrateur requis' },
        { status: 403 }
      ),
    }
  }

  return authResult
}
