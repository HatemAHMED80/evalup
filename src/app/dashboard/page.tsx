'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    async function redirect() {
      try {
        const res = await fetch('/api/user/evaluations/latest')
        if (res.status === 401) {
          router.replace('/connexion')
          return
        }
        const data = await res.json()
        if (data.evaluation?.id) {
          router.replace(`/evaluation/${data.evaluation.id}/chat`)
        } else {
          router.replace('/evaluation/new')
        }
      } catch {
        router.replace('/evaluation/new')
      }
    }
    redirect()
  }, [router])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-3 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-[var(--text-secondary)]">Chargement...</p>
      </div>
    </div>
  )
}
