/**
 * Design tokens do MARCO Concept Beauty.
 * Base da marca: preto e branco (logo). Rosa seco e dourado entram como
 * acentos e nas cores de status, mantendo o visual feminino e minimalista.
 */
export const colors = {
  // Marca
  ink: '#0E0E0E',
  inkSoft: '#2B2B2B',
  paper: '#FFFFFF',

  // Base
  background: '#FAF7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#F4EDE9',
  border: '#EAE0DB',

  // Acentos
  primary: '#0E0E0E', // acoes principais seguem o preto da marca
  accent: '#C98B8B', // rosa seco
  accentSoft: '#F5E3E3',
  gold: '#C9A66B',
  goldSoft: '#F5EBDA',

  // Texto
  text: '#1C1614',
  textMuted: '#8C7A72',
  textInverse: '#FFFFFF',

  // Status de retorno
  onTime: '#7BA98B', // verde - no prazo
  onTimeSoft: '#E4F0E8',
  soon: '#C9A24B', // amarelo/dourado - proximo
  soonSoft: '#F8EFD8',
  late: '#C05B5B', // vermelho - atrasado
  lateSoft: '#F7E0E0',

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

/** Cor de fundo e de texto de cada status de retorno. */
export const statusColors = {
  no_prazo: { fg: colors.onTime, bg: colors.onTimeSoft, label: 'No prazo' },
  proximo: { fg: colors.soon, bg: colors.soonSoft, label: 'Proximo' },
  atrasado: { fg: colors.late, bg: colors.lateSoft, label: 'Atrasado' },
} as const;

export const theme = { colors, spacing, radius, typography, shadow, statusColors };
export type Theme = typeof theme;
