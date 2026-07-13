import { resolveScheme } from './useTheme';

describe('resolveScheme', () => {
  it('override manual vence o esquema do sistema', () => {
    expect(resolveScheme('dark', 'light')).toBe('dark');
    expect(resolveScheme('light', 'dark')).toBe('light');
  });

  it('sem override segue o sistema', () => {
    expect(resolveScheme(null, 'dark')).toBe('dark');
    expect(resolveScheme(null, 'light')).toBe('light');
  });
});
