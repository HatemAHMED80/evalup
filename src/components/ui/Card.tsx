import { ReactNode, HTMLAttributes } from 'react'

type CardVariant = 'default' | 'outlined' | 'elevated' | 'ghost'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  children: ReactNode
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-[var(--bg-primary)] border border-[var(--border)]',
  outlined: 'bg-transparent border border-[var(--border)]',
  elevated: 'bg-[var(--bg-primary)] shadow-[var(--shadow-md)]',
  ghost: 'bg-[var(--bg-secondary)]',
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  children,
  className = '',
  ...props
}: CardProps) {
  const hoverStyles = hover
    ? 'transition-all duration-[var(--duration-normal)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 cursor-pointer'
    : ''

  return (
    <div
      className={`
        rounded-[var(--radius-lg)]
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hoverStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Header component
interface CardHeaderProps {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
  children?: ReactNode
}

export function CardHeader({ title, description, action, className = '', children }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        {title ? (
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
        ) : children}
        {description && (
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Card Content component
interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>
}

// Card Footer component
interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-[var(--border)] ${className}`}>
      {children}
    </div>
  )
}

export default Card
