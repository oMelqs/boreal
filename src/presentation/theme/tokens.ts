import type { ComfortLabel } from '@/domain/entities/comfortScore';

/**
 * Design tokens do Boreal — conceito "noite polar": o app fala de céu e
 * clima, então a UI é o céu. Dark = noite polar profunda; light = manhã de
 * gelo. Acento assinatura: verde-aurora. Duas famílias do sistema (SPECS
 * §6.3), com hierarquia agressiva de peso/tracking no display.
 */

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  /** Texto sobre superfícies pintadas com `accent`. */
  onAccent: string;
  danger: string;
  /** Cor semântica do score de conforto (contraste AA sobre `background`). */
  score: Record<ComfortLabel, string>;
};

export const darkColors: ThemeColors = {
  background: '#0A1017',
  surface: '#121B26',
  surfaceBorder: '#1E2A38',
  textPrimary: '#E9F1F7',
  textSecondary: '#8FA6B8',
  accent: '#3DDC97',
  onAccent: '#06251A',
  danger: '#FF7B72',
  score: {
    otimo: '#3DDC97',
    bom: '#53C7E8',
    razoavel: '#F4B95F',
    ruim: '#FF7B72',
  },
};

export const lightColors: ThemeColors = {
  background: '#F3F7FA',
  surface: '#FFFFFF',
  surfaceBorder: '#DCE6EE',
  textPrimary: '#101D29',
  textSecondary: '#4E6478',
  accent: '#0C7B54',
  onAccent: '#F3FBF7',
  danger: '#C6373E',
  score: {
    otimo: '#0C7B54',
    bom: '#0A6E8A',
    razoavel: '#9A5B12',
    ruim: '#C6373E',
  },
};

/** Faixa-assinatura da marca: verde → ciano → violeta da aurora. */
export const auroraColors = ['#3DDC97', '#53C7E8', '#8B7CF6'] as const;

/** Escala de espaçamento em passos de 4pt (SPECS §6.3). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Área mínima de toque (acessibilidade — ≥ 44pt exigido, 48 adotado). */
export const minTouchTarget = 48;

export const typography = {
  display: { fontSize: 40, lineHeight: 44, fontWeight: '800', letterSpacing: -1 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: 0 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.8 },
} as const;
