// MATRIX visual system: calm neutral foundations with semantic color in content.
// Controls stay legible; color communicates domain, status, selection, and hierarchy.
export const matrixThemes = {
  dark: {
    bg: '#050A12',
    panel: '#09111D',
    card: '#0C1623',
    raised: '#111E2D',
    text: '#F7FAFF',
    muted: '#91A0B7',
    line: '#1D2A3C',
    accent: '#2188FF',
    onAccent: '#FFFFFF',
    selected: '#102B4D',
    subtle: '#07101B',
    success: '#35D99B',
    warning: '#FFB43C',
    danger: '#FF5F70',
    cyan: '#31C8DC',
    violet: '#9B68FF',
    rose: '#FF6F91',
    amber: '#FFB43C',
  },
  light: {
    bg: '#EEF2F7',
    panel: '#F8FAFD',
    card: '#F3F6FB',
    raised: '#E7EDF6',
    text: '#172033',
    muted: '#68758A',
    line: '#D8E0EB',
    accent: '#416FEA',
    onAccent: '#FFFFFF',
    selected: '#DCE7FF',
    subtle: '#EAF0F7',
    success: '#178B68',
    warning: '#A86A00',
    danger: '#D84959',
    cyan: '#2D9CB3',
    violet: '#7659D9',
    rose: '#D95C78',
    amber: '#A66D14',
  },
} as const;

export const matrixGroupAccents = {
  Productivity: { solid: '#4C7FF0', softLight: '#E4ECFF', softDark: '#18294D' },
  Health: { solid: '#2EAE83', softLight: '#DDF5EC', softDark: '#12362D' },
  People: { solid: '#E36A85', softLight: '#FBE3EA', softDark: '#41202B' },
  Planning: { solid: '#7A67DB', softLight: '#ECE8FF', softDark: '#292343' },
  Finance: { solid: '#2798AE', softLight: '#DCF2F6', softDark: '#15343B' },
  Learning: { solid: '#A06ACF', softLight: '#F2E6FB', softDark: '#352143' },
  Other: { solid: '#6D7D91', softLight: '#E7ECF2', softDark: '#202A36' },
} as const;

export function matrixTheme(appearance: string) {
  return appearance === 'dark' ? matrixThemes.dark : matrixThemes.light;
}

export function matrixGroupColor(group: string | undefined, appearance: string) {
  const entry = matrixGroupAccents[group as keyof typeof matrixGroupAccents] ?? matrixGroupAccents.Other;
  return {
    accent: entry.solid,
    soft: appearance === 'dark' ? entry.softDark : entry.softLight,
  };
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
