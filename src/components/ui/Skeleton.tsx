interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'shimmer' | 'none'
}

const variantStyles = {
  text: 'rounded-[var(--radius-sm)]',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-[var(--radius-md)]',
}

const animationStyles = {
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer',
  none: '',
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      className={`
        bg-[var(--bg-tertiary)]
        ${variantStyles[variant]}
        ${animationStyles[animation]}
        ${className}
      `}
      style={style}
    />
  )
}

// Skeleton Text component - for text placeholders
interface SkeletonTextProps {
  lines?: number
  className?: string
  lastLineWidth?: string
}

export function SkeletonText({ lines = 3, className = '', lastLineWidth = '60%' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  )
}

// Skeleton Card component
interface SkeletonCardProps {
  showAvatar?: boolean
  showTitle?: boolean
  showDescription?: boolean
  className?: string
}

export function SkeletonCard({
  showAvatar = true,
  showTitle = true,
  showDescription = true,
  className = '',
}: SkeletonCardProps) {
  return (
    <div
      className={`
        p-4
        bg-[var(--bg-primary)]
        border border-[var(--border)]
        rounded-[var(--radius-lg)]
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {showAvatar && (
          <Skeleton variant="circular" width={40} height={40} />
        )}
        <div className="flex-1">
          {showTitle && (
            <Skeleton height={16} width="60%" className="mb-2" />
          )}
          {showDescription && (
            <SkeletonText lines={2} />
          )}
        </div>
      </div>
    </div>
  )
}

// Skeleton Table Row component
interface SkeletonTableRowProps {
  columns?: number
  className?: string
}

export function SkeletonTableRow({ columns = 4, className = '' }: SkeletonTableRowProps) {
  return (
    <div className={`flex items-center gap-4 py-3 ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === 0 ? '30%' : '20%'}
          className="flex-shrink-0"
        />
      ))}
    </div>
  )
}

export default Skeleton
