'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import type { Subscription } from '@/lib/database.types'
import { isPro } from '@/lib/stripe/plans'

// Client Supabase singleton - cree une seule fois
const supabase = createClient()

interface AuthContextType {
  user: User | null
  session: Session | null
  subscription: Subscription | null
  isLoading: boolean
  isPremium: boolean
  planName: string
  signOut: () => Promise<void>
  refreshSubscription: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  subscription: null,
  isLoading: true,
  isPremium: false,
  planName: 'Gratuit',
  signOut: async () => {},
  refreshSubscription: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fonction pour charger l'abonnement
  const loadSubscription = useCallback(async (userId: string) => {
    try {
      const { data } = await (supabase
        .from('subscriptions') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as { data: Subscription | null }

      setSubscription(data)
    } catch {
      // Pas d'abonnement actif
      setSubscription(null)
    }
  }, [])

  const refreshSubscription = useCallback(async () => {
    if (user?.id) {
      await loadSubscription(user.id)
    }
  }, [user?.id, loadSubscription])

  useEffect(() => {
    let mounted = true

    // Recuperer la session initiale
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        // Charger l'abonnement si connecte
        if (session?.user?.id) {
          await loadSubscription(session.user.id)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    // Ecouter les changements d'auth
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        // Recharger l'abonnement si connecte
        if (session?.user?.id) {
          await loadSubscription(session.user.id)
        } else {
          setSubscription(null)
        }

        setIsLoading(false)
      }
    )

    return () => {
      mounted = false
      authSubscription.unsubscribe()
    }
  }, [loadSubscription])

  const signOut = async () => {
    await supabase.auth.signOut()
    setSubscription(null)
  }

  // Calculer le statut premium et le nom du plan
  const isPremium = isPro(subscription?.plan_id)
  const getPlanName = (planId: string | undefined) => {
    switch (planId) {
      case 'pro_unlimited': return 'Pro Illimité'
      case 'pro_10': return 'Pro 10'
      case 'pro_yearly': return 'Pro Annuel (Legacy)'
      case 'pro_monthly': return 'Pro Mensuel (Legacy)'
      default: return 'Flash (Gratuit)'
    }
  }
  const planName = getPlanName(subscription?.plan_id)

  return (
    <AuthContext.Provider value={{
      user,
      session,
      subscription,
      isLoading,
      isPremium,
      planName,
      signOut,
      refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook pratique pour acceder rapidement au user
export function useUser() {
  const { user, isLoading } = useAuth()
  return { user, isLoading }
}
