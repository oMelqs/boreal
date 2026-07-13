import { useColorScheme } from 'react-native';

import { useThemeStore, type ThemeOverride } from '@/presentation/hooks/useThemeStore';

import type { ThemeColors } from './tokens';
import { darkColors, lightColors, minTouchTarget, radius, spacing, typography } from './tokens';

export type Scheme = 'light' | 'dark';

export type Theme = {
  scheme: Scheme;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  minTouchTarget: number;
};

/** Override manual vence o sistema; sem override, segue o esquema do device. */
export function resolveScheme(override: ThemeOverride, system: Scheme): Scheme {
  return override ?? system;
}

/**
 * Tema efetivo: override manual (botão sol/lua da home) sobre o esquema do
 * sistema (dark é o modo-assinatura). Como todo componente consome este hook,
 * uma troca de override re-renderiza a árvore inteira via a store zustand.
 */
export function useTheme(): Theme {
  const system: Scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const override = useThemeStore((state) => state.override);
  const scheme = resolveScheme(override, system);
  return {
    scheme,
    colors: scheme === 'light' ? lightColors : darkColors,
    spacing,
    radius,
    typography,
    minTouchTarget,
  };
}
