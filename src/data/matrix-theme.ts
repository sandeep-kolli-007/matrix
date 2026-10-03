// MATRIX design tokens. Deliberately quiet: neutral surfaces, one brand accent,
// and restrained elevation so content is the visual hierarchy.
export const matrixThemes = {
  dark: {
    bg: '#0B0D10',
    panel: '#12151A',
    card: '#15191F',
    raised: '#1B2027',
    text: '#F4F6F8',
    muted: '#8E96A3',
    line: '#252B33',
    accent: '#5B8CFF',
    onAccent: '#FFFFFF',
    selected: '#18233A',
    subtle: '#101318',
    success: '#39C793',
    warning: '#F2B84B',
    danger: '#FF6B73',
  },
  light: {
    bg: '#F7F8FA',
    panel: '#FFFFFF',
    card: '#FFFFFF',
    raised: '#EEF1F4',
    text: '#171A1F',
    muted: '#6B7380',
    line: '#E2E6EA',
    accent: '#2F6FED',
    onAccent: '#FFFFFF',
    selected: '#EAF1FF',
    subtle: '#F1F3F6',
    success: '#168A63',
    warning: '#A96800',
    danger: '#D63D4C',
  },
} as const;

export function matrixTheme(appearance: string) {
  return appearance === 'dark' ? matrixThemes.dark : matrixThemes.light;
}

export const matrixSpacing = {
  page: 20,
  section: 28,
  gap: 12,
  card: 16,
  touch: 44,
} as const;

export const matrixRadii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;
