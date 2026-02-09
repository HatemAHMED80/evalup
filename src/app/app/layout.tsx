'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '../../components/layout/Sidebar'
import { createClient } from '@/lib/supabase/client'

interface Evaluation {
  id: string
  companyName: string
  sector: string
  currentStep: number
  totalSteps: number
  status: 'in_progress' | 'completed'
  updatedAt: Date
}

interface UserData {
  name: string
  email: string
  plan: 'free' | 'pro'
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSlowConnection, setIsSlowConnection] = useState(false)

  useEffect(() => {
    // Afficher message connexion lente après 1.5s
    const slowTimer = setTimeout(() => setIsSlowConnection(true), 1500)

    async function loadUserData() {
      const supabase = createClient()

      try {
        // Timeout de 8 secondes pour eviter le blocage
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 8000)
        )

        // Charger l'utilisateur
        const { data: { user: authUser } } = await Promise.race([
          supabase.auth.getUser(),
          timeoutPromise
        ]) as { data: { user: { id: string; email?: string; user_metadata?: { full_name?: string } } | null } }

        if (!authUser) {
          setUser(null)
          setEvaluations([])
          setIsLoading(false)
          return
        }

        // Charger le profil utilisateur
        let userData: UserData = {
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Utilisateur',
          email: authUser.email || '',
          plan: 'free',
        }

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, plan')
            .eq('id', authUser.id)
            .single() as { data: { full_name: string | null; plan: string | null } | null }

          if (profile) {
            userData = {
              name: profile.full_name || userData.name,
              email: authUser.email || '',
              plan: profile.plan === 'pro_10' || profile.plan === 'pro_unlimited' ? 'pro' : 'free',
            }
          }
        } catch {
          // Profil non trouve
        }

        setUser(userData)

        // Charger les evaluations
        try {
          const { data: evals } = await supabase
            .from('evaluations')
            .select('id, siren, company_name, sector, status, updated_at')
            .eq('user_id', authUser.id)
            .order('updated_at', { ascending: false })
            .limit(10)

          if (evals) {
            const mappedEvaluations: Evaluation[] = evals.map((e: {
              id: string
              siren: string
              company_name: string | null
              sector: string | null
              status: string
              updated_at: string
            }) => ({
              id: e.siren || e.id,
              companyName: e.company_name || `Entreprise ${e.siren}`,
              sector: e.sector || 'Non defini',
              currentStep: e.status === 'completed' || e.status === 'flash_completed' ? 6 : 3,
              totalSteps: 6,
              status: e.status === 'completed' || e.status === 'flash_completed' ? 'completed' : 'in_progress',
              updatedAt: new Date(e.updated_at),
            }))
            setEvaluations(mappedEvaluations)
          }
        } catch {
          setEvaluations([])
        }

        setIsLoading(false)
      } catch {
        // Timeout ou erreur - afficher l'interface sans donnees
        console.error('Erreur chargement utilisateur')
        setUser(null)
        setEvaluations([])
        setIsLoading(false)
      }
    }

    loadUserData()

    return () => clearTimeout(slowTimer)
  }, [])

  const handleNewEvaluation = () => {
    router.push('/app')
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[var(--bg-primary)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
          {isSlowConnection && (
            <p className="text-[var(--text-muted)] text-sm animate-pulse">
              Connexion lente, veuillez patienter...
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <Sidebar
        evaluations={evaluations}
        user={user || undefined}
        onNewEvaluation={handleNewEvaluation}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
