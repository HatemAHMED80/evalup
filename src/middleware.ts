// Middleware Next.js pour l'authentification Supabase et sécurité
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Origines autorisées pour CORS
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
].filter(Boolean) as string[]

// Headers de sécurité
const securityHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  // CSP : unsafe-inline requis pour Stripe et les styles Tailwind en mode dev
  // En production, idéalement utiliser des nonces
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    `connect-src 'self' https://api.anthropic.com https://*.supabase.co https://api.stripe.com https://api.pappers.fr wss://*.supabase.co`,
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

export async function middleware(request: NextRequest) {
  // Mettre à jour la session Supabase
  const response = await updateSession(request)

  // Ajouter les headers de sécurité
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // CORS pour les routes API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
