'use client'

interface ProgressTrackerProps {
  currentStep: number
  totalSteps?: number
}

const STEPS = [
  { num: 1, label: 'Découverte', icon: '🔍' },
  { num: 2, label: 'Finances', icon: '📊' },
  { num: 3, label: 'Actifs', icon: '🏢' },
  { num: 4, label: 'Équipe', icon: '👥' },
  { num: 5, label: 'Marché', icon: '🎯' },
  { num: 6, label: 'Synthèse', icon: '✨' },
]

export function ProgressTracker({ currentStep, totalSteps = 6 }: ProgressTrackerProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="flex items-center gap-3">
      {/* Barre de progression */}
      <div className="hidden md:flex items-center gap-1">
        {STEPS.map((step) => (
          <div
            key={step.num}
            className={`flex items-center`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                step.num < currentStep
                  ? 'bg-[#10b981] text-white'
                  : step.num === currentStep
                  ? 'bg-[#1e3a5f] text-white ring-2 ring-[#1e3a5f]/30'
                  : 'bg-gray-100 text-gray-400'
              }`}
              title={step.label}
            >
              {step.num < currentStep ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.num
              )}
            </div>
            {step.num < totalSteps && (
              <div
                className={`w-4 h-0.5 mx-0.5 ${
                  step.num < currentStep ? 'bg-[#10b981]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Version mobile : juste la progression */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1e3a5f] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500">{currentStep}/{totalSteps}</span>
      </div>
    </div>
  )
}
