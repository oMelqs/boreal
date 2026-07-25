import { render, screen } from '@testing-library/react-native';

import type { HourlyForecast } from '@/domain/entities/hourlyForecast';
import type { SleepSchedule } from '@/domain/entities/preferences';
import { atHour, buildDay, buildHour } from '@/domain/usecases/testing/buildHourlyForecast';
import { buildTimeline } from '@/presentation/hooks/useRecommendation';
import type { PanelWeather } from '@/presentation/hooks/useTodaySuggestions';
import { strings } from '@/presentation/i18n/strings';
import { joinville } from '@/presentation/testing/providers';

import { HourlyTimeline } from './HourlyTimeline';
import { RecommendationHero } from './RecommendationHero';
import { WeatherCard } from './WeatherCard';

const routine: SleepSchedule = { wakeTime: '07:00', sleepTime: '23:00' };

/** Dia 5h–23h com a noite marcada a partir das 19h. */
function dayIntoNight(): HourlyForecast[] {
  const nights: Record<number, Partial<HourlyForecast>> = {};
  for (const hour of [5, 19, 20, 21, 22, 23]) nights[hour] = { isDay: false };
  return buildDay(5, 19, nights);
}

describe('buildTimeline com rotina de sono', () => {
  it('inclui as horas noturnas do ciclo e para na hora de dormir', () => {
    const timeline = buildTimeline(
      dayIntoNight(),
      atHour(18),
      { kind: 'day-over' },
      undefined,
      routine,
    );

    const hours = timeline.map((cell) => cell.time.getUTCHours());
    expect(hours).toContain(21); // noite dentro da rotina aparece
    expect(hours).not.toContain(23); // 23h é a hora de dormir: fora do ciclo
  });

  it('antes de acordar, a madrugada de hoje não entra na lista', () => {
    const timeline = buildTimeline(
      dayIntoNight(),
      atHour(5),
      { kind: 'day-over' },
      undefined,
      routine,
    );

    const hours = timeline.map((cell) => cell.time.getUTCHours());
    expect(hours).not.toContain(5); // ainda dormindo
    expect(hours[0]).toBe(7); // começa quando a pessoa acorda
  });

  it('sem rotina, a timeline segue sendo o restante do dia', () => {
    const timeline = buildTimeline(dayIntoNight(), atHour(18), { kind: 'day-over' });

    const hours = timeline.map((cell) => cell.time.getUTCHours());
    expect(hours).toEqual([18, 19, 20, 21, 22, 23]);
  });
});

describe('HourlyTimeline', () => {
  const nightCell = buildTimeline(
    [buildHour({ time: atHour(21), isDay: false, temp: 19 })],
    atHour(21),
    { kind: 'day-over' },
  );

  it('noite elegível é anunciada com temperatura e score, sem apagar a célula', async () => {
    await render(<HourlyTimeline hours={nightCell} nightEligible />);

    const cell = await screen.findByLabelText(/19 graus/);
    expect(cell).toBeOnTheScreen();
    expect(screen.queryByLabelText(/21h, noite/)).not.toBeOnTheScreen();
  });

  it('sem rotina, a noite continua anunciada apenas como noite', async () => {
    await render(<HourlyTimeline hours={nightCell} />);

    expect(await screen.findByLabelText(/noite/)).toBeOnTheScreen();
  });
});

describe('WeatherCard à noite', () => {
  const nightWindow: PanelWeather = {
    current: { hour: buildHour({ time: atHour(20), isDay: false }), score: null },
    bestWindow: {
      kind: 'window',
      start: atHour(20),
      end: atHour(22),
      averageScore: { value: 82, label: 'otimo' },
      reasons: ['já de noite', 'temperatura agradável (22 °C)'],
    },
    hasSleepRoutine: true,
  };

  it('marca a janela quando ela cai à noite', async () => {
    await render(
      <WeatherCard city={joinville} hasSleepRoutine weather={nightWindow} onPress={jest.fn()} />,
    );

    expect(
      await screen.findByText(strings.today.weather.nightWindow('20h–22h')),
    ).toBeOnTheScreen();
  });

  it('com rotina, o fim do dia fala da rotina em vez do anoitecer', async () => {
    await render(
      <WeatherCard
        city={joinville}
        hasSleepRoutine
        weather={{ current: null, bestWindow: { kind: 'day-over' }, hasSleepRoutine: true }}
        onPress={jest.fn()}
      />,
    );

    expect(await screen.findByText(strings.today.weather.routineOver)).toBeOnTheScreen();
  });
});

describe('RecommendationHero no fim do dia', () => {
  it('com rotina, diz quando as sugestões voltam e como estará', async () => {
    await render(
      <RecommendationHero
        recommendation={{ kind: 'day-over' }}
        resume={{
          wakeTime: '07:00',
          preview: { startHour: 7, temp: 18, precipitationProb: 5 },
        }}
      />,
    );

    expect(await screen.findByText(strings.recommendation.routineOverTitle)).toBeOnTheScreen();
    expect(screen.getByText('Amanhã a partir das 07:00: 18 °C, sem chuva.')).toBeOnTheScreen();
  });

  it('sem prévia utilizável, informa só o horário de retomada', async () => {
    await render(
      <RecommendationHero
        recommendation={{ kind: 'day-over' }}
        resume={{ wakeTime: '06:30', preview: null }}
      />,
    );

    expect(await screen.findByText('Amanhã a partir das 06:30.')).toBeOnTheScreen();
  });

  it('sem rotina, os textos originais permanecem', async () => {
    await render(<RecommendationHero recommendation={{ kind: 'day-over' }} />);

    expect(await screen.findByText(strings.recommendation.dayOverTitle)).toBeOnTheScreen();
    expect(screen.getByText(strings.recommendation.dayOverHint)).toBeOnTheScreen();
  });
});
