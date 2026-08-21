/**
 * Design tokens do MA Concepty.
 * Paleta feminina e minimalista: rosa seco, dourado/bege e branco quente.
 */
export const colors = {
  // Base
  background: '#FDF7F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F7EEE9',
  border: '#EFE0D8',

  // Marca
  primary: '#C98B8B', // rosa seco
  primarySoft: '#F3DEDE',
  primaryDark: '#A96F6F',
  gold: '#C9A66B', // dourado/bege
  goldSoft: '#F4E9D8',

  // Texto
  text: '#3A2F2B',
  textMuted: '#8C7A72',
  textInverse: '#FFFFFF',

  // Status de retorno
  onTime: '#7BA98B', // verde - no prazo
  onTimeSoft: '#E3F0E7',
  soon: '#D9A441', // amarelo - proximo
  soonSoft: '#FBF0D9',
  late: '#C96A6A', // vermelho - atrasado
  lateSoft: '#F8E1E1',

  // Feedback
  danger: '#B4453F',
  success: '#5F8F72',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
} as const;

export const shadow = {
  card: {
    shadowColor: '#8C7A72',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const theme = { colors, spacing, radius, typography, shadow };
export type Theme = typeof theme;
