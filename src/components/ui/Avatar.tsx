import { ReactNode } from 'react'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type AvatarVariant = 'circle' | 'rounded'

interface AvatarProps {
  src?: string | null
  alt?: string
  initials?: string
  size?: AvatarSize
  variant?: AvatarVariant
  className?: string
  fallbackIcon?: ReactNode
  accentBg?: boolean
}

const sizeStyles: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]' },
  sm: { container: 'w-8 h-8', text: 'text-[11px]' },
  md: { container: 'w-10 h-10', text: 'text-[13px]' },
  lg: { container: 'w-12 h-12', text: 'text-[15px]' },
  xl: { container: 'w-16 h-16', text: 'text-[18px]' },
}

const variantStyles: Record<AvatarVariant, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-[var(--radius-md)]',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Avatar({
  src,
  alt = '',
  initials,
  size = 'md',
  variant = 'circle',
  className = '',
  fallbackIcon,
  accentBg = false,
}: AvatarProps) {
  const { container, text } = sizeStyles[size]
  const bgColor = accentBg ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
  const textColor = accentBg ? 'text-white' : 'text-[var(--text-secondary)]'

  if (src) {
    return (
      <div
        className={`
          ${container}
          ${variantStyles[variant]}
          overflow-hidden
          flex-shrink-0
          ${className}
        `}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`
        ${container}
        ${variantStyles[variant]}
        ${bgColor}
        ${textColor}
        flex items-center justify-center
        font-bold
        ${text}
        flex-shrink-0
        ${className}
      `}
    >
      {fallbackIcon || (initials ? getInitials(initials) : alt ? getInitials(alt) : '?')}
    </div>
  )
}

// Avatar Group component
interface AvatarGroupProps {
  children: ReactNode
  max?: number
  size?: AvatarSize
  className?: string
}

export function AvatarGroup({ children, max, size = 'md', className = '' }: AvatarGroupProps) {
  return (
    <div className={`flex -space-x-2 ${className}`}>
      {children}
      {max && (
        <Avatar
          size={size}
          initials={`+${max}`}
          className="ring-2 ring-white"
        />
      )}
    </div>
  )
}

export default Avatar
