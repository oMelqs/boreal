import { useColorScheme } from 'react-native';

import type { ThemeColors } from './tokens';
import { darkColors, lightColors, minTouchTarget, radius, spacing, typography } from './tokens';

export type Theme = {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  minTouchTarget: number;
};

/** Tema resolvido pelo esquema de cores do sistema (dark é o modo-assinatura). */
export function useTheme(): Theme {
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark';
  return {
    scheme,
    colors: scheme === 'light' ? lightColors : darkColors,
    spacing,
    radius,
    typography,
    minTouchTarget,
  };
}
