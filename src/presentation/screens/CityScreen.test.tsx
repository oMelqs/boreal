import { fireEvent, render, screen } from '@testing-library/react-native';

import { NetworkError } from '@/data/errors';
import type { Container } from '@/di/container';
import { atHour, buildDay } from '@/domain/usecases/testing/buildHourlyForecast';
import { useCityStore } from '@/presentation/hooks/useCityStore';
import { strings } from '@/presentation/i18n/strings';
import {
  createFakeContainer,
  createProvidersWrapper,
  joinville,
} from '@/presentation/testing/providers';

import { CityScreen } from './CityScreen';

const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, canGoBack: () => true }),
}));

function goodDay() {
  return buildDay(6, 14, {
    12: { apparentTemp: 30 },
    13: { apparentTemp: 31 },
    14: { apparentTemp: 31 },
    15: { apparentTemp: 30 },
    16: { apparentTemp: 31 },
    19: { windSpeed: 25 },
  });
}

function rainyDay() {
  return buildDay(10, 8).map((hour) => ({
    ...hour,
    precipitationProb: 85,
    precipitationMm: 2,
  }));
}

async function renderCityScreen(
  container: Container = createFakeContainer({ getTodayForecast: async () => goodDay() }),
  now = atHour(16),
) {
  const Wrapper = createProvidersWrapper(container);
  return render(
    <Wrapper>
      <CityScreen nowOverride={now} />
    </Wrapper>,
  );
}

describe('CityScreen', () => {
  beforeEach(() => {
    mockBack.mockClear();
    useCityStore.setState({ selectedCity: joinville, recentCities: [] });
  });

  it('hero renderiza a janela, a explicação e o selo', async () => {
    await renderCityScreen();

    expect(await screen.findByText('17h–19h')).toBeOnTheScreen();
    expect(screen.getByText(strings.recommendation.heroLabel)).toBeOnTheScreen();
    expect(
      screen.getByText('Temperatura agradável (24 °C), baixa chance de chuva e vento leve.'),
    ).toBeOnTheScreen();
    expect(screen.getByText(strings.recommendation.badge.otimo)).toBeOnTheScreen();
    expect(screen.getByText(strings.recommendation.detailsTitle)).toBeOnTheScreen();
  });

  it('dia ruim mantém a recomendação com caveat honesto', async () => {
    await renderCityScreen(
      createFakeContainer({ getTodayForecast: async () => rainyDay() }),
      atHour(10),
    );

    expect(await screen.findByText('10h–12h')).toBeOnTheScreen();
    expect(
      screen.getByText(strings.recommendation.caveat('chuva provável (85%)')),
    ).toBeOnTheScreen();
    expect(screen.getByText(strings.recommendation.badge.ruim)).toBeOnTheScreen();
  });

  it('consulta à noite mostra a guarda de dia encerrado sem inventar janela', async () => {
    await renderCityScreen(undefined, atHour(21));

    expect(await screen.findByText(strings.recommendation.dayOverTitle)).toBeOnTheScreen();
    expect(screen.getByText(strings.recommendation.dayOverHint)).toBeOnTheScreen();
    expect(screen.queryByText(strings.recommendation.heroLabel)).not.toBeOnTheScreen();
  });

  it('erro de rede mostra mensagem pt-BR e retry recupera a tela', async () => {
    let shouldFail = true;
    const getTodayForecast = jest.fn(async () => {
      if (shouldFail) throw new NetworkError();
      return goodDay();
    });
    await renderCityScreen(createFakeContainer({ getTodayForecast }));

    expect(await screen.findByText(strings.errors.network)).toBeOnTheScreen();

    shouldFail = false;
    fireEvent.press(screen.getByRole('button', { name: strings.search.retry }));

    expect(await screen.findByText('17h–19h')).toBeOnTheScreen();
    expect(getTodayForecast).toHaveBeenCalledTimes(2);
  });

  it('sem cidade selecionada orienta a voltar para a busca', async () => {
    useCityStore.setState({ selectedCity: null });
    await renderCityScreen();

    expect(screen.getByText(strings.city.missingCity)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: strings.city.backLabel }));
    expect(mockBack).toHaveBeenCalled();
  });
});
