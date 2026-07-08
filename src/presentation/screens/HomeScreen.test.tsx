import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { NetworkError, NoResultsError } from '@/data/errors';
import type { Container } from '@/di/container';
import { useCityStore } from '@/presentation/hooks/useCityStore';
import { strings } from '@/presentation/i18n/strings';
import {
  createFakeContainer,
  createProvidersWrapper,
  joinville,
} from '@/presentation/testing/providers';

import { HomeScreen } from './HomeScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

async function renderHome(container: Container = createFakeContainer()) {
  const Wrapper = createProvidersWrapper(container);
  return render(
    <Wrapper>
      <HomeScreen searchDebounceMs={0} />
    </Wrapper>,
  );
}

describe('HomeScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
    useCityStore.setState({ selectedCity: null, recentCities: [] });
  });

  it('estado inicial convida à busca', async () => {
    await renderHome();

    expect(screen.getByText(strings.search.emptyTitle)).toBeOnTheScreen();
    expect(screen.getByPlaceholderText(strings.search.placeholder)).toBeOnTheScreen();
  });

  it('fluxo completo: digitar → resultados desambiguados → selecionar navega e registra recente', async () => {
    await renderHome();

    fireEvent.changeText(
      screen.getByPlaceholderText(strings.search.placeholder),
      'Joinville',
    );

    const result = await screen.findByText('Joinville');
    expect(screen.getByText('Santa Catarina, Brasil')).toBeOnTheScreen();

    fireEvent.press(result);

    expect(mockPush).toHaveBeenCalledWith('/city/3459712');
    expect(useCityStore.getState().selectedCity).toEqual(joinville);
    expect(useCityStore.getState().recentCities).toEqual([joinville]);
  });

  it('sem resultados mostra estado vazio amigável com a query', async () => {
    await renderHome(
      createFakeContainer({
        searchCity: async () => {
          throw new NoResultsError();
        },
      }),
    );

    fireEvent.changeText(screen.getByPlaceholderText(strings.search.placeholder), 'xyzzy');

    expect(await screen.findByText(strings.search.noResults('xyzzy'))).toBeOnTheScreen();
  });

  it('erro de rede mostra mensagem pt-BR e retry refaz a busca', async () => {
    let shouldFail = true;
    const searchCity = jest.fn(async () => {
      if (shouldFail) throw new NetworkError();
      return [joinville];
    });
    await renderHome(createFakeContainer({ searchCity }));

    fireEvent.changeText(
      screen.getByPlaceholderText(strings.search.placeholder),
      'Joinville',
    );

    expect(await screen.findByText(strings.errors.network)).toBeOnTheScreen();

    shouldFail = false;
    fireEvent.press(screen.getByRole('button', { name: strings.search.retry }));

    expect(await screen.findByText('Joinville')).toBeOnTheScreen();
    expect(searchCity).toHaveBeenCalledTimes(2);
  });

  it('mostra buscas recentes sem query, re-seleciona no toque e permite limpar', async () => {
    useCityStore.setState({ recentCities: [joinville] });
    await renderHome();

    await waitFor(() => expect(screen.getByText(strings.search.recentTitle)).toBeOnTheScreen());

    fireEvent.press(screen.getByText('Joinville'));
    expect(mockPush).toHaveBeenCalledWith('/city/3459712');

    fireEvent.press(
      screen.getByRole('button', { name: strings.search.clearRecentsLabel }),
    );

    await waitFor(() =>
      expect(screen.queryByText(strings.search.recentTitle)).not.toBeOnTheScreen(),
    );
    expect(screen.getByText(strings.search.emptyTitle)).toBeOnTheScreen();
  });
});
