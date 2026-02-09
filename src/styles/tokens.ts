// Design tokens accessibles en JS/TS
// Pour les composants qui ont besoin de valeurs en runtime (animations, charts, etc.)

export const colors = {
  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8F9FB',
  bgTertiary: '#F1F3F7',
  bgDeep: '#F3F5F9',
  bgSidebar: '#FAFBFC',
  bgHover: '#F5F6FA',
  bgOverlay: 'rgba(15, 22, 41, 0.5)',

  // Text
  textPrimary: '#0F1629',
  textSecondary: '#4A5068',
  textTertiary: '#7C829A',
  textMuted: '#A8ADBE',
  textPlaceholder: '#B0B5C3',

  // Accent (Bleu Pro)
  accent: '#2563EB',
  accentHover: '#1D4ED8',
  accentActive: '#1E40AF',
  accentLight: '#EFF6FF',
  accentGlow: 'rgba(37, 99, 235, 0.15)',
  accentSubtle: 'rgba(37, 99, 235, 0.06)',

  // Semantic
  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  info: '#7C3AED',
  infoLight: '#EDE9FE',

  // Borders
  border: '#E2E5ED',
  borderLight: '#EEF0F5',
  borderActive: '#2563EB',
  borderHover: '#CBD0DC',
} as const

export const fonts = {
  sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace",
} as const

export const fontSizes = {
  xs: '0.6875rem',    // 11px
  sm: '0.8125rem',    // 13px
  base: '0.9375rem',  // 15px
  lg: '1.125rem',     // 18px
  xl: '1.5rem',       // 24px
  '2xl': '2rem',      // 32px
  '3xl': '2.5rem',    // 40px
  '4xl': '3.5rem',    // 56px
} as const

export const fontWeights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const

export const radius = {
  xs: '4px',
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '999px',
} as const

export const shadows = {
  xs: '0 1px 2px rgba(15, 22, 41, 0.04)',
  sm: '0 2px 8px rgba(15, 22, 41, 0.06)',
  md: '0 4px 16px rgba(15, 22, 41, 0.08)',
  lg: '0 8px 32px rgba(15, 22, 41, 0.10)',
  xl: '0 16px 48px rgba(15, 22, 41, 0.14)',
  focus: '0 0 0 3px rgba(37, 99, 235, 0.12)',
  glow: '0 0 60px rgba(37, 99, 235, 0.08)',
} as const

export const layout = {
  sidebarWidth: 272,
  sidebarCollapsed: 64,
  headerHeight: 60,
  navHeight: 72,
  chatMaxWidth: 720,
  contentMaxWidth: 1200,
} as const

export const transitions = {
  easeDefault: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeBounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  durationFast: 100,
  durationNormal: 150,
  durationSlow: 250,
  durationEntrance: 400,
} as const

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// Type exports for TypeScript
export type ColorKey = keyof typeof colors
export type FontKey = keyof typeof fonts
export type FontSizeKey = keyof typeof fontSizes
export type SpacingKey = keyof typeof spacing
export type RadiusKey = keyof typeof radius
export type ShadowKey = keyof typeof shadows
export type BreakpointKey = keyof typeof breakpoints
