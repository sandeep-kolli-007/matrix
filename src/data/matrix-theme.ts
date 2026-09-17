// Shared MATRIX surfaces, readable text, and semantic emphasis in both modes.
export const matrixThemes = {
  dark: { bg: '#080D0C', panel: '#101B20', card: '#101B20', raised: '#1B2A32', text: '#F1F5F9', muted: '#A6B4C1', line: '#2A3B46', accent: '#C7FF3D', onAccent: '#142000', selected: '#243416' },
  light: { bg: '#F3F6F8', panel: '#FFFFFF', card: '#FFFFFF', raised: '#E8EEF2', text: '#14212B', muted: '#556675', line: '#D4DFE7', accent: '#466C00', onAccent: '#FFFFFF', selected: '#E6F4CD' },
} as const;
export function matrixTheme(appearance: string) { return appearance === 'dark' ? matrixThemes.dark : matrixThemes.light; }
export const matrixSpacing = { page: 20, section: 24, gap: 12, card: 16, touch: 44 } as const;
