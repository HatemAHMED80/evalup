'use client'

import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerClassName = '',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || generatedId

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full
              px-4 py-3
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              bg-[var(--bg-primary)]
              border border-[var(--border)]
              rounded-[var(--radius-md)]
              text-[var(--text-primary)]
              text-[15px]
              placeholder:text-[var(--text-placeholder)]
              transition-all duration-[var(--duration-normal)] ease-[var(--ease-default)]
              hover:border-[var(--border-hover)]
              focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-secondary)]
              ${error ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/10' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-[12px] text-[var(--danger)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[12px] text-[var(--text-muted)]">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
