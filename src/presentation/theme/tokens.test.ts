import { darkColors, lightColors, type ThemeColors } from './tokens';

/**
 * Guard de acessibilidade: todo par texto/fundo dos dois temas precisa de
 * contraste AA (4.5:1). Fórmula de luminância relativa do WCAG 2.1.
 */

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const AA_TEXT = 4.5;

function textPairs(colors: ThemeColors): [string, string, string][] {
  return [
    ['textPrimary/background', colors.textPrimary, colors.background],
    ['textPrimary/surface', colors.textPrimary, colors.surface],
    ['textSecondary/background', colors.textSecondary, colors.background],
    ['textSecondary/surface', colors.textSecondary, colors.surface],
    ['accent/background', colors.accent, colors.background],
    ['accent/surface', colors.accent, colors.surface],
    ['danger/background', colors.danger, colors.background],
    ['onAccent/accent', colors.onAccent, colors.accent],
    ['score.otimo/background', colors.score.otimo, colors.background],
    ['score.otimo/surface', colors.score.otimo, colors.surface],
    ['score.bom/background', colors.score.bom, colors.background],
    ['score.bom/surface', colors.score.bom, colors.surface],
    ['score.razoavel/background', colors.score.razoavel, colors.background],
    ['score.razoavel/surface', colors.score.razoavel, colors.surface],
    ['score.ruim/background', colors.score.ruim, colors.background],
    ['score.ruim/surface', colors.score.ruim, colors.surface],
  ];
}

describe.each([
  ['dark', darkColors],
  ['light', lightColors],
] as const)('contraste AA — tema %s', (_name, colors) => {
  it.each(textPairs(colors))('%s ≥ 4.5:1', (_pair, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
