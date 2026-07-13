import { useThemeStore } from './useThemeStore';

describe('useThemeStore', () => {
  beforeEach(() => useThemeStore.setState({ override: null }));

  it('começa sem override (segue o sistema)', () => {
    expect(useThemeStore.getState().override).toBeNull();
  });

  it('setOverride fixa o tema escolhido', () => {
    useThemeStore.getState().setOverride('dark');
    expect(useThemeStore.getState().override).toBe('dark');

    useThemeStore.getState().setOverride('light');
    expect(useThemeStore.getState().override).toBe('light');
  });
});
