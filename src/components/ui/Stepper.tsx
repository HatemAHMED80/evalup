interface Step {
  id: string | number
  label?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number  // 0-indexed
  showLabels?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function Stepper({
  steps,
  currentStep,
  showLabels = true,
  size = 'md',
  className = '',
}: StepperProps) {
  const sizeConfig = {
    sm: {
      circle: 'w-5 h-5 text-[10px]',
      connector: 'w-6 h-0.5',
      label: 'text-[10px]',
      gap: 'gap-1',
    },
    md: {
      circle: 'w-[26px] h-[26px] text-[11px]',
      connector: 'w-10 h-0.5',
      label: 'text-[11px]',
      gap: 'gap-1.5',
    },
  }

  const config = sizeConfig[size]

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isUpcoming = index > currentStep

        return (
          <div key={step.id} className="flex items-center">
            {/* Step */}
            <div className={`flex flex-col items-center ${config.gap}`}>
              {/* Circle */}
              <div
                className={`
                  ${config.circle}
                  rounded-full
                  flex items-center justify-center
                  font-bold
                  transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-[var(--accent)] text-white'
                      : isCurrent
                      ? 'bg-white border-2 border-[var(--accent)] text-[var(--accent)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                  }
                `}
              >
                {isCompleted ? (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Label */}
              {showLabels && step.label && (
                <span
                  className={`
                    ${config.label}
                    font-medium
                    whitespace-nowrap
                    ${isCurrent ? 'text-[var(--accent)]' : isCompleted ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}
                  `}
                >
                  {step.label}
                </span>
              )}
            </div>

            {/* Connector */}
            {index < steps.length - 1 && (
              <div
                className={`
                  ${config.connector}
                  mx-1.5
                  rounded-full
                  transition-colors duration-200
                  ${isCompleted ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}
                `}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Vertical stepper variant
interface VerticalStepperProps {
  steps: (Step & { description?: string })[]
  currentStep: number
  className?: string
}

export function VerticalStepper({
  steps,
  currentStep,
  className = '',
}: VerticalStepperProps) {
  return (
    <div className={`space-y-0 ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="flex gap-3">
            {/* Left side: circle + line */}
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={`
                  w-8 h-8
                  rounded-full
                  flex items-center justify-center
                  text-[12px] font-bold
                  transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-[var(--accent)] text-white'
                      : isCurrent
                      ? 'bg-white border-2 border-[var(--accent)] text-[var(--accent)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                  }
                `}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Line */}
              {!isLast && (
                <div
                  className={`
                    w-0.5 flex-1 min-h-[24px]
                    transition-colors duration-200
                    ${isCompleted ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}
                  `}
                />
              )}
            </div>

            {/* Right side: content */}
            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
              <p
                className={`
                  text-[14px] font-semibold
                  ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}
                `}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Stepper
