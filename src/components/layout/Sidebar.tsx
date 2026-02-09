'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { useTheme } from '../../contexts/ThemeContext'

interface Evaluation {
  id: string
  companyName: string
  sector: string
  currentStep: number
  totalSteps: number
  status: 'in_progress' | 'completed'
  updatedAt: Date
}

interface SidebarProps {
  evaluations?: Evaluation[]
  currentEvaluationId?: string
  user?: {
    name: string
    email: string
    plan: 'free' | 'pro'
    avatarUrl?: string
  }
  onNewEvaluation?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

// Helper to get company initials
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 1)
}

export function Sidebar({
  evaluations = [],
  currentEvaluationId,
  user,
  onNewEvaluation,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  // Separate in progress and recent evaluations
  const inProgress = evaluations.filter(e => e.status === 'in_progress')
  const recent = evaluations.filter(e => e.status === 'completed').slice(0, 5)

  if (isCollapsed) {
    return (
      <aside className="w-[var(--sidebar-collapsed)] h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col py-5">
        {/* Collapsed Logo */}
        <div className="px-4 mb-6">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-[14px]">
            E
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggleCollapse}
          className="mx-auto mb-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-sm)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-[var(--sidebar-width)] h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col overflow-hidden">
      {/* Header with Logo */}
      <div className="p-5 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-[14px]">
            E
          </div>
          <span className="text-[18px] font-bold text-[var(--text-primary)]">
            Eval<span className="text-[var(--accent)]">Up</span>
          </span>
        </Link>
      </div>

      {/* New Evaluation Button */}
      <div className="px-4 mb-4">
        <Button
          variant="primary"
          className="w-full justify-center"
          onClick={onNewEvaluation}
          leftIcon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Nouvelle évaluation
        </Button>
      </div>

      {/* Evaluations List */}
      <div className="flex-1 overflow-y-auto px-3">
        {/* In Progress */}
        {inProgress.length > 0 && (
          <div className="mb-4">
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              En cours
            </p>
            <div className="space-y-1">
              {inProgress.map(evaluation => (
                <EvaluationItem
                  key={evaluation.id}
                  evaluation={evaluation}
                  isActive={evaluation.id === currentEvaluationId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Separator */}
        {inProgress.length > 0 && recent.length > 0 && (
          <div className="border-t border-[var(--border)] my-3" />
        )}

        {/* Recent */}
        {recent.length > 0 && (
          <div>
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Récentes
            </p>
            <div className="space-y-1">
              {recent.map(evaluation => (
                <EvaluationItem
                  key={evaluation.id}
                  evaluation={evaluation}
                  isActive={evaluation.id === currentEvaluationId}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Section */}
      {user && (
        <div className="p-4 border-t border-[var(--border)] space-y-1">
          {/* User Info */}
          <Link
            href="/compte"
            className="flex items-center gap-3 p-2 -mx-2 rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Avatar
              src={user.avatarUrl}
              initials={user.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {user.plan === 'pro' ? 'Plan Pro' : 'Plan Gratuit'}
              </p>
            </div>
          </Link>

          {/* Quick Links */}
          <div className="flex gap-1 pt-1">
            <Link
              href="/compte"
              className={`
                flex-1 flex items-center justify-center gap-1.5
                py-1.5 px-2
                text-[11px] font-medium
                rounded-[var(--radius-sm)]
                transition-colors
                ${pathname?.startsWith('/compte')
                  ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }
              `}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Compte
            </Link>
            <Link
              href="/app/settings"
              className={`
                flex-1 flex items-center justify-center gap-1.5
                py-1.5 px-2
                text-[11px] font-medium
                rounded-[var(--radius-sm)]
                transition-colors
                ${pathname === '/app/settings'
                  ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }
              `}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Reglages
            </Link>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] transition-colors text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              title={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
            >
              {theme === 'light' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

// Evaluation Item Component
function EvaluationItem({
  evaluation,
  isActive,
}: {
  evaluation: Evaluation
  isActive: boolean
}) {
  return (
    <Link
      href={`/app/evaluation/${evaluation.id}`}
      className={`
        flex items-center gap-3
        p-2.5
        rounded-[var(--radius-md)]
        transition-all duration-150
        ${
          isActive
            ? 'bg-[var(--accent-light)]'
            : 'hover:bg-[var(--bg-tertiary)]'
        }
      `}
    >
      {/* Company Icon */}
      <div
        className={`
          w-9 h-9
          rounded-[var(--radius-sm)]
          flex items-center justify-center
          text-[13px] font-bold
          ${
            isActive
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
          }
        `}
      >
        {getInitials(evaluation.companyName)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`
          text-[13.5px] font-semibold truncate
          ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}
        `}>
          {evaluation.companyName}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] text-[var(--text-tertiary)] truncate">
            {evaluation.sector}
          </span>
          <span className="font-mono text-[11px] bg-[var(--bg-tertiary)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-[var(--radius-xs)]">
            {evaluation.currentStep}/{evaluation.totalSteps}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default Sidebar
