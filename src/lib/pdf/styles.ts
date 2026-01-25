// Styles et couleurs pour la génération PDF EvalUp

// Palette de couleurs EvalUp
export const COLORS = {
  // Primaires
  primary: '#1E40AF',        // Bleu foncé
  primaryLight: '#3B82F6',   // Bleu
  primaryDark: '#1E3A8A',    // Bleu très foncé

  // Secondaires
  secondary: '#10B981',      // Vert
  secondaryLight: '#34D399', // Vert clair

  // Or EvalUp
  gold: '#C9A227',           // Or EvalUp
  goldLight: '#E8C547',      // Or clair

  // Alertes
  success: '#22C55E',        // Vert succès
  warning: '#F59E0B',        // Orange warning
  danger: '#EF4444',         // Rouge danger

  // Neutres
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#111827',

  // Fonds de sections
  bgLight: '#F0F9FF',        // Bleu très clair
  bgGreen: '#ECFDF5',        // Vert très clair
  bgOrange: '#FFF7ED',       // Orange très clair
  bgRed: '#FEF2F2',          // Rouge très clair
  bgGold: '#FFFBEB',         // Or très clair
}

// Typographie
export const FONTS = {
  title: { size: 24, weight: 'bold' as const },
  h1: { size: 18, weight: 'bold' as const },
  h2: { size: 14, weight: 'bold' as const },
  h3: { size: 12, weight: 'bold' as const },
  body: { size: 10, weight: 'normal' as const },
  small: { size: 8, weight: 'normal' as const },
  caption: { size: 7, weight: 'normal' as const },
}

// Espacements
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

// Bordures et radius
export const BORDERS = {
  radius: 8,
  radiusSmall: 4,
  radiusLarge: 12,
  width: 1,
}

// Couleurs de statut
export function getStatusColor(status: 'good' | 'average' | 'bad'): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case 'good':
      return { bg: COLORS.bgGreen, text: COLORS.success, border: COLORS.success }
    case 'average':
      return { bg: COLORS.bgOrange, text: COLORS.warning, border: COLORS.warning }
    case 'bad':
      return { bg: COLORS.bgRed, text: COLORS.danger, border: COLORS.danger }
  }
}

// Couleur basée sur la valeur (positif/négatif)
export function getValueColor(value: number): string {
  if (value > 0) return COLORS.success
  if (value < 0) return COLORS.danger
  return COLORS.gray700
}
