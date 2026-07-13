import { render, screen, userEvent } from '@testing-library/react-native';

import { atHour, buildHour } from '@/domain/usecases/testing/buildHourlyForecast';
import type { PanelWeather } from '@/presentation/hooks/useTodaySuggestions';
import { strings } from '@/presentation/i18n/strings';
import { joinville } from '@/presentation/testing/providers';

import { WeatherCard } from './WeatherCard';

const windowWeather: PanelWeather = {
  current: {
    hour: buildHour({
      time: atHour(12),
      temp: 23,
      apparentTemp: 24,
      weatherCode: 1,
      isDay: true,
      precipitationProb: 10,
    }),
    score: { value: 90, label: 'otimo' },
  },
  bestWindow: {
    kind: 'window',
    start: atHour(14),
    end: atHour(16),
    averageScore: { value: 80, label: 'otimo' },
    reasons: ['temperatura agradável (24 °C)'],
  },
};

describe('WeatherCard', () => {
  it('mostra a condição atual e a janela recomendada; navega ao tocar', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<WeatherCard city={joinville} weather={windowWeather} onPress={onPress} />);

    expect(await screen.findByText('Joinville')).toBeOnTheScreen();
    expect(screen.getByText('23°')).toBeOnTheScreen();
    expect(screen.getByText(strings.today.weather.bestWindow('14h–16h'))).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: /Clima em Joinville/ }));
    expect(onPress).toHaveBeenCalled();
  });

  it('sem leitura de agora usa texto neutro e a nota de dia acabando', async () => {
    const weather: PanelWeather = { current: null, bestWindow: { kind: 'day-over' } };
    await render(<WeatherCard city={joinville} weather={weather} onPress={jest.fn()} />);

    expect(await screen.findByText(strings.today.weather.noReading)).toBeOnTheScreen();
    expect(screen.getByText(strings.today.weather.dayOver)).toBeOnTheScreen();
  });
});
