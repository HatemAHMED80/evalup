// Client Supabase pour EvalUp
// Configuration et helpers pour l'accès à la base de données

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Vérification des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variables Supabase non configurées. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local')
}

// Client Supabase singleton
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// Helper pour vérifier si Supabase est configuré
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Helper pour créer un client côté serveur (pour les Server Components)
export function createServerSupabaseClient() {
  return createClient<Database>(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
      auth: {
        persistSession: false
      }
    }
  )
}
