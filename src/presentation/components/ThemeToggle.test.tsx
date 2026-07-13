import { render, screen, userEvent } from '@testing-library/react-native';

import { useThemeStore } from '@/presentation/hooks/useThemeStore';
import { strings } from '@/presentation/i18n/strings';

import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  const user = userEvent.setup();

  beforeEach(() => useThemeStore.setState({ override: null }));

  it('no claro mostra o alvo escuro e fixa o tema escuro ao tocar', async () => {
    // useColorScheme nos testes resolve para light → alvo é o escuro.
    await render(<ThemeToggle />);

    await user.press(await screen.findByRole('button', { name: strings.today.themeToDark }));

    expect(useThemeStore.getState().override).toBe('dark');
  });

  it('depois de escolher o escuro, oferece voltar ao claro', async () => {
    useThemeStore.setState({ override: 'dark' });
    await render(<ThemeToggle />);

    await user.press(await screen.findByRole('button', { name: strings.today.themeToLight }));

    expect(useThemeStore.getState().override).toBe('light');
  });
});
