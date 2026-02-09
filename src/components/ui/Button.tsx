'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode, isValidElement, cloneElement } from 'react'

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'ghost-dark' | 'white' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children?: ReactNode
  asChild?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] active:scale-[0.98] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
  outline: 'bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] active:scale-[0.98]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] active:scale-[0.98]',
  'ghost-dark': 'bg-transparent text-white/80 hover:bg-white/10 hover:text-white active:scale-[0.98]',
  white: 'bg-white text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] active:scale-[0.98]',
  danger: 'bg-[var(--danger)] text-white hover:bg-[#B91C1C] active:scale-[0.98]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[13px] gap-1.5 rounded-[var(--radius-sm)]',
  md: 'px-5 py-2.5 text-[14px] gap-2 rounded-[var(--radius-md)]',
  lg: 'px-7 py-3.5 text-[15px] gap-2.5 rounded-[var(--radius-lg)]',
  icon: 'p-2.5 rounded-[var(--radius-md)]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer'

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

    // Handle asChild - render child element with button styles
    if (asChild && isValidElement(children)) {
      // Ne pas passer les props specifiques aux boutons (type, disabled, etc.) aux elements enfants
      const { type, disabled: _disabled, ...safeProps } = props as Record<string, unknown>
      return cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: `${combinedClassName} ${(children.props as { className?: string }).className || ''}`,
        ...safeProps,
      })
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClassName}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
