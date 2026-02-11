// Client Supabase pour le navigateur (Client Components)
// Utilise un singleton pour eviter les AbortErrors lors des remontages de composants
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'
import { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient<Database> | null = null

export function createClient(): SupabaseClient<Database> {
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // No-op lock pour éviter les AbortError de navigator.locks lors des navigations
        lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
          return fn()
        },
        persistSession: true,
      },
    }
  )

  return supabaseClient
}
