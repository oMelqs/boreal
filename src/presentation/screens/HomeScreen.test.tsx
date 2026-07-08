import { render, screen } from '@testing-library/react-native';

import { strings } from '@/presentation/i18n/strings';

import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('renderiza o título e o subtítulo', async () => {
    await render(<HomeScreen />);

    expect(screen.getByText(strings.home.title)).toBeOnTheScreen();
    expect(screen.getByText(strings.home.subtitle)).toBeOnTheScreen();
  });
});
