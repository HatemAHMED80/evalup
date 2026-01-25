// Theme EvalUp - Configuration centralisée des couleurs et styles
// Style inspiré Rothschild/Mazars

// ============================================================
// COULEURS
// ============================================================

export const colors = {
  // Couleurs principales
  primary: {
    DEFAULT: '#1e3a5f',
    light: '#2d5a8f',
    dark: '#152a45',
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#b3c5d7',
    300: '#8da8c2',
    400: '#5d8bb3',
    500: '#1e3a5f',
    600: '#1a3354',
    700: '#152a45',
    800: '#0f1f33',
    900: '#0a1422',
  },

  // Accent doré
  gold: {
    DEFAULT: '#c9a227',
    light: '#d4b84d',
    dark: '#a68620',
    50: '#fdf9e9',
    100: '#faf0c3',
    200: '#f5e08d',
    300: '#e8c94d',
    400: '#d4b84d',
    500: '#c9a227',
    600: '#a68620',
    700: '#836a1a',
    800: '#604e13',
    900: '#3d320c',
  },

  // Succès / Validation
  success: {
    DEFAULT: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },

  // Erreur
  error: {
    DEFAULT: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },

  // Warning
  warning: {
    DEFAULT: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },

  // Grades acheteur
  grades: {
    A: '#10b981', // Vert
    B: '#3b82f6', // Bleu
    C: '#f59e0b', // Orange
    D: '#ef4444', // Rouge
    E: '#6b7280', // Gris
  },

  // Neutres
  neutral: {
    white: '#ffffff',
    black: '#000000',
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const

// ============================================================
// GRADIENTS
// ============================================================

export const gradients = {
  // Gradient principal (hero, CTA)
  primary: 'bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f]',
  primaryHover: 'hover:from-[#2d5a8f] hover:to-[#1e3a5f]',

  // Gradient doré subtil
  gold: 'bg-gradient-to-r from-[#c9a227]/0 via-[#c9a227] to-[#c9a227]/0',
  goldSubtle: 'bg-gradient-to-r from-transparent via-[#c9a227]/30 to-transparent',

  // Gradient pour les cartes
  card: 'bg-gradient-to-br from-white to-gray-50',
} as const

// ============================================================
// OMBRES
// ============================================================

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  card: 'shadow-sm hover:shadow-lg transition-shadow duration-300',
  button: 'shadow-lg hover:shadow-xl transition-shadow duration-300',
} as const

// ============================================================
// STYLES DE BOUTONS
// ============================================================

export const buttonStyles = {
  // Bouton principal (fond blanc, texte bleu)
  primary: `
    inline-flex items-center justify-center gap-2
    px-6 py-3 rounded-lg font-medium
    bg-white text-[#1e3a5f]
    hover:bg-gray-100
    transition-all duration-300
    shadow-lg hover:shadow-xl
  `.replace(/\s+/g, ' ').trim(),

  // Bouton secondaire (fond bleu foncé)
  secondary: `
    inline-flex items-center justify-center gap-2
    px-6 py-3 rounded-lg font-medium
    bg-[#1e3a5f] text-white
    hover:bg-[#2d5a8f]
    transition-all duration-300
  `.replace(/\s+/g, ' ').trim(),

  // Bouton accent (fond doré)
  accent: `
    inline-flex items-center justify-center gap-2
    px-6 py-3 rounded-lg font-medium
    bg-[#c9a227] text-white
    hover:bg-[#b8922a]
    transition-all duration-300
    shadow-lg
  `.replace(/\s+/g, ' ').trim(),

  // Bouton outline
  outline: `
    inline-flex items-center justify-center gap-2
    px-6 py-3 rounded-lg font-medium
    border-2 border-white/30 text-white
    hover:bg-white/10
    transition-all duration-300
  `.replace(/\s+/g, ' ').trim(),

  // Bouton outline foncé
  outlineDark: `
    inline-flex items-center justify-center gap-2
    px-6 py-3 rounded-lg font-medium
    border-2 border-[#1e3a5f] text-[#1e3a5f]
    hover:bg-[#1e3a5f] hover:text-white
    transition-all duration-300
  `.replace(/\s+/g, ' ').trim(),

  // Bouton succès
  success: `
    inline-flex items-center justify-center gap-2
    px-6 py-3 rounded-lg font-medium
    bg-[#10b981] text-white
    hover:bg-[#059669]
    transition-all duration-300
  `.replace(/\s+/g, ' ').trim(),

  // Lien avec flèche
  link: `
    inline-flex items-center gap-2
    font-medium
    hover:gap-3
    transition-all duration-300
  `.replace(/\s+/g, ' ').trim(),

  linkPrimary: `
    inline-flex items-center gap-2
    text-[#1e3a5f] font-medium
    hover:gap-3
    transition-all duration-300
  `.replace(/\s+/g, ' ').trim(),

  linkGold: `
    inline-flex items-center gap-2
    text-[#c9a227] font-medium
    hover:gap-3
    transition-all duration-300
  `.replace(/\s+/g, ' ').trim(),
} as const

// ============================================================
// STYLES DE CARTES
// ============================================================

export const cardStyles = {
  // Carte de base
  base: `
    bg-white rounded-2xl p-6
    border border-gray-100
    shadow-sm
  `.replace(/\s+/g, ' ').trim(),

  // Carte avec hover
  hover: `
    bg-white rounded-2xl p-6
    border border-gray-100
    shadow-sm hover:shadow-lg
    transition-all duration-300
  `.replace(/\s+/g, ' ').trim(),

  // Carte glassmorphism (pour fond sombre)
  glass: `
    bg-white/10 backdrop-blur-sm rounded-2xl p-6
    border border-white/20
    hover:bg-white/15
    transition-all duration-300
  `.replace(/\s+/g, ' ').trim(),

  // Carte avec bordure dorée au hover
  goldHover: `
    bg-white rounded-2xl p-6
    border border-gray-100
    hover:border-[#c9a227]/30
    shadow-sm hover:shadow-lg
    transition-all duration-300
  `.replace(/\s+/g, ' ').trim(),

  // Carte fond gris
  gray: `
    bg-gray-50 rounded-2xl p-6
    border border-gray-100
  `.replace(/\s+/g, ' ').trim(),

  // Carte fond bleu foncé
  dark: `
    bg-[#1e3a5f] rounded-2xl p-6
    text-white
  `.replace(/\s+/g, ' ').trim(),
} as const

// ============================================================
// STYLES D'INPUTS
// ============================================================

export const inputStyles = {
  // Input de base
  base: `
    w-full px-4 py-3 rounded-lg
    border border-gray-200
    bg-white text-gray-900
    placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]
    transition-all duration-200
  `.replace(/\s+/g, ' ').trim(),

  // Input avec erreur
  error: `
    w-full px-4 py-3 rounded-lg
    border border-red-300
    bg-red-50 text-gray-900
    placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500
    transition-all duration-200
  `.replace(/\s+/g, ' ').trim(),

  // Input succès
  success: `
    w-full px-4 py-3 rounded-lg
    border border-green-300
    bg-green-50 text-gray-900
    placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500
    transition-all duration-200
  `.replace(/\s+/g, ' ').trim(),

  // Label
  label: `
    block text-sm font-medium text-gray-700 mb-2
  `.replace(/\s+/g, ' ').trim(),

  // Message d'erreur
  errorMessage: `
    text-sm text-red-600 mt-1
  `.replace(/\s+/g, ' ').trim(),

  // Helper text
  helper: `
    text-sm text-gray-500 mt-1
  `.replace(/\s+/g, ' ').trim(),
} as const

// ============================================================
// STYLES DE BADGES
// ============================================================

export const badgeStyles = {
  // Badge principal
  primary: `
    inline-flex items-center gap-2
    px-3 py-1 rounded-full
    bg-[#1e3a5f]/10 text-[#1e3a5f]
    text-sm font-medium
  `.replace(/\s+/g, ' ').trim(),

  // Badge doré
  gold: `
    inline-flex items-center gap-2
    px-3 py-1 rounded-full
    bg-[#c9a227]/20 text-[#c9a227]
    text-sm font-medium
  `.replace(/\s+/g, ' ').trim(),

  // Badge succès
  success: `
    inline-flex items-center gap-2
    px-3 py-1 rounded-full
    bg-[#10b981]/10 text-[#10b981]
    text-sm font-medium
  `.replace(/\s+/g, ' ').trim(),

  // Badge erreur
  error: `
    inline-flex items-center gap-2
    px-3 py-1 rounded-full
    bg-red-100 text-red-600
    text-sm font-medium
  `.replace(/\s+/g, ' ').trim(),

  // Badge warning
  warning: `
    inline-flex items-center gap-2
    px-3 py-1 rounded-full
    bg-orange-100 text-orange-600
    text-sm font-medium
  `.replace(/\s+/g, ' ').trim(),

  // Badge neutre
  neutral: `
    inline-flex items-center gap-2
    px-3 py-1 rounded-full
    bg-gray-100 text-gray-600
    text-sm font-medium
  `.replace(/\s+/g, ' ').trim(),
} as const

// ============================================================
// TYPOGRAPHIE
// ============================================================

export const typography = {
  // Titres
  h1: 'text-4xl md:text-5xl lg:text-6xl font-light leading-tight',
  h2: 'text-3xl font-light',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-semibold',

  // Corps de texte
  body: 'text-base text-gray-600 leading-relaxed',
  bodySmall: 'text-sm text-gray-600',
  bodyLarge: 'text-lg text-gray-600 leading-relaxed',

  // Texte d'accent
  accent: 'font-semibold',
  muted: 'text-gray-500',

  // Labels
  label: 'text-sm font-medium text-gray-700',
  labelUppercase: 'text-sm font-semibold uppercase tracking-wider text-gray-400',
} as const

// ============================================================
// ESPACEMENTS
// ============================================================

export const spacing = {
  section: 'py-24',
  sectionSmall: 'py-16',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  containerSmall: 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8',
  containerMedium: 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8',
} as const

// ============================================================
// ANIMATIONS
// ============================================================

export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  pulse: 'animate-pulse',
  transition: 'transition-all duration-300',
  transitionFast: 'transition-all duration-150',
  transitionSlow: 'transition-all duration-500',
} as const

// ============================================================
// UTILITAIRES
// ============================================================

// Fonction pour obtenir la couleur d'un grade
export function getGradeColor(grade: 'A' | 'B' | 'C' | 'D' | 'E'): string {
  return colors.grades[grade]
}

// Fonction pour obtenir le style de badge d'un grade
export function getGradeBadgeStyle(grade: 'A' | 'B' | 'C' | 'D' | 'E'): string {
  const bgColors: Record<string, string> = {
    A: 'bg-[#10b981]/10 text-[#10b981]',
    B: 'bg-blue-100 text-blue-600',
    C: 'bg-orange-100 text-orange-600',
    D: 'bg-red-100 text-red-600',
    E: 'bg-gray-100 text-gray-600',
  }
  return `inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${bgColors[grade]}`
}

// Fonction pour obtenir le label d'un grade
export function getGradeLabel(grade: 'A' | 'B' | 'C' | 'D' | 'E'): string {
  const labels: Record<string, string> = {
    A: 'Acheteur Premium',
    B: 'Très bon profil',
    C: 'Bon profil',
    D: 'Profil à renforcer',
    E: 'Profil incomplet',
  }
  return labels[grade]
}

// Export par défaut du thème complet
const theme = {
  colors,
  gradients,
  shadows,
  buttonStyles,
  cardStyles,
  inputStyles,
  badgeStyles,
  typography,
  spacing,
  animations,
  getGradeColor,
  getGradeBadgeStyle,
  getGradeLabel,
}

export default theme
