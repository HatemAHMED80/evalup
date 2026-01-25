// Logo EvalUp - Design minimaliste inspiré Rothschild/Mazars

interface LogoProps {
  variant?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ variant = 'dark', size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 40, text: 'text-2xl' },
  }

  const colors = {
    dark: {
      primary: '#1e3a5f',
      accent: '#c9a227', // Or/doré subtil
      text: '#1e3a5f',
    },
    light: {
      primary: '#ffffff',
      accent: '#c9a227',
      text: '#ffffff',
    },
  }

  const currentSize = sizes[size]
  const currentColors = colors[variant]

  return (
    <div className="flex items-center gap-3">
      {/* Icône - Symbole abstrait représentant croissance/valorisation */}
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Carré de base - stabilité */}
        <rect
          x="4"
          y="12"
          width="28"
          height="24"
          rx="2"
          stroke={currentColors.primary}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Flèche vers le haut - croissance/valorisation */}
        <path
          d="M20 28V8M20 8L14 14M20 8L26 14"
          stroke={currentColors.accent}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Ligne de valeur */}
        <line
          x1="10"
          y1="24"
          x2="30"
          y2="24"
          stroke={currentColors.primary}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Texte */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-semibold tracking-tight ${currentSize.text}`}
            style={{ color: currentColors.text }}
          >
            EvalUp
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.2em] opacity-60"
            style={{ color: currentColors.text }}
          >
            Valorisation
          </span>
        </div>
      )}
    </div>
  )
}
