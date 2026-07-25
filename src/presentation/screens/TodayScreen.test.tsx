import { render, screen, userEvent } from '@testing-library/react-native';

import type { Container } from '@/di/container';
import type { Habit } from '@/domain/entities/habit';
import { DEFAULT_USER_PREFERENCES } from '@/domain/entities/preferences';
import { buildHabit } from '@/domain/usecases/testing/buildHabit';
import { atHour, buildDay } from '@/domain/usecases/testing/buildHourlyForecast';
import { useThemeStore } from '@/presentation/hooks/useThemeStore';
import { strings } from '@/presentation/i18n/strings';
import {
  createFakeContainer,
  createProvidersWrapper,
  joinville,
} from '@/presentation/testing/providers';

import { TodayScreen } from './TodayScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// 2026-07-08 (dia base dos builders) é quarta-feira = 3
const WEDNESDAY = 3 as const;

const college: Habit = buildHabit({
  id: 'college',
  name: 'Faculdade',
  category: 'estudo',
  intensity: 'leve',
  outdoor: false,
  days: [WEDNESDAY],
  schedule: { kind: 'fixed', startTime: '19:00', endTime: '22:30' },
});

const dogWalk: Habit = buildHabit({
  id: 'dog',
  name: 'Passear com o cachorro',
  days: [WEDNESDAY, 4],
  schedule: { kind: 'flexible', durationMinutes: 30 },
});

/** Dia 6h–19h; esfria da ida (19h, 20 °C) para a volta (22h, 12 °C). */
function coolingDay() {
  const nights: Record<number, Partial<ReturnType<typeof buildDay>[number]>> = {};
  for (const h of [0, 1, 2, 3, 4, 5, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 44, 45, 46, 47]) {
    nights[h] = { isDay: false };
  }
  return buildDay(0, 48, {
    ...nights,
    19: { ...nights[19], apparentTemp: 20 },
    20: { isDay: false, apparentTemp: 16 },
    21: { isDay: false, apparentTemp: 14 },
    22: { isDay: false, apparentTemp: 12 },
  });
}

function readyContainer(habits: Habit[], overrides: Partial<Container> = {}) {
  return createFakeContainer({
    getPreferences: async () => ({ defaultCity: joinville, onboardingDone: true, preferences: DEFAULT_USER_PREFERENCES }),
    getHabits: async () => habits,
    getForecast: async () => coolingDay(),
    ...overrides,
  });
}

async function renderToday(container: Container, now = atHour(9)) {
  const Wrapper = createProvidersWrapper(container);
  return render(
    <Wrapper>
      <TodayScreen nowOverride={now} />
    </Wrapper>,
  );
}

describe('TodayScreen', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    useThemeStore.setState({ override: null });
  });

  it('critério §11: faculdade com vestimenta e ressalva ida/volta; passeio com janela e porquê', async () => {
    await renderToday(readyContainer([college, dogWalk]));

    // header (city.name também aparece no card de clima → busca pelo header)
    expect(await screen.findByRole('header', { name: 'Joinville' })).toBeOnTheScreen();
    expect(screen.getByText('qua, 8 de julho')).toBeOnTheScreen();

    // card da faculdade: fixo 19h com volta 8 °C mais fria → frase da mudança
    expect(screen.getByText('Faculdade')).toBeOnTheScreen();
    expect(screen.getByText('19:00–22:30')).toBeOnTheScreen();
    expect(screen.getByText(/Vai esfriar até a volta \(20 °C → 12 °C\)/)).toBeOnTheScreen();

    // card do passeio: janela + porquê
    expect(screen.getByText('Passear com o cachorro')).toBeOnTheScreen();
    expect(screen.getByText(/^\d{1,2}h–\d{1,2}h$/)).toBeOnTheScreen();
    expect(screen.getByText(/Temperatura agradável/)).toBeOnTheScreen();
  });

  it('mostra o card de clima e navega para os detalhes ao tocar', async () => {
    await renderToday(readyContainer([dogWalk]));

    const card = await screen.findByRole('button', { name: /Clima em Joinville/ });
    await user.press(card);

    expect(mockPush).toHaveBeenCalledWith(`/city/${joinville.id}`);
  });

  it('alterna o tema pelo botão sol/lua do header', async () => {
    useThemeStore.setState({ override: null });
    await renderToday(readyContainer([dogWalk]));

    // useColorScheme resolve para light nos testes → o botão oferece o escuro.
    await user.press(await screen.findByRole('button', { name: strings.today.themeToDark }));

    expect(useThemeStore.getState().override).toBe('dark');
  });

  it('sem hábitos ainda mostra o card de clima da cidade', async () => {
    await renderToday(readyContainer([]));

    expect(await screen.findByRole('button', { name: /Clima em Joinville/ })).toBeOnTheScreen();
    expect(screen.getByText(strings.today.emptyTitle)).toBeOnTheScreen();
  });

  it('expande a timeline do card de janela no toque', async () => {
    await renderToday(readyContainer([dogWalk]));
    await screen.findByText('Passear com o cachorro');

    await user.press(screen.getByRole('button', { name: strings.today.expandTimeline }));

    expect(screen.getByRole('button', { name: strings.today.collapseTimeline })).toBeOnTheScreen();
    expect(screen.getByText('agora')).toBeOnTheScreen(); // célula da hora atual
  });

  it('às 23h o fixo de amanhã aparece rotulado', async () => {
    const thursdayCollege = buildHabit({ ...college, days: [WEDNESDAY, 4] });
    await renderToday(readyContainer([thursdayCollege]), atHour(23));

    expect(await screen.findByText('Faculdade')).toBeOnTheScreen();
    expect(screen.getByText(strings.today.tomorrowBadge)).toBeOnTheScreen();
  });

  it('no-slot mostra a razão em tom neutro', async () => {
    const morningOnly = buildHabit({
      id: 'morning',
      name: 'Corrida matinal',
      days: [WEDNESDAY],
      schedule: { kind: 'flexible', durationMinutes: 60, earliest: '06:00', latest: '08:00' },
    });
    await renderToday(readyContainer([morningOnly]), atHour(10));

    expect(await screen.findByText(/Sua janela é 6h–8h e já passou hoje\./)).toBeOnTheScreen();
  });

  it('vazio: CTA para cadastrar hábitos e acesso à busca avulsa', async () => {
    await renderToday(readyContainer([]));

    expect(await screen.findByText(strings.today.emptyTitle)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: strings.today.emptyCta }));
    expect(mockPush).toHaveBeenCalledWith('/habits');

    await user.press(screen.getByRole('button', { name: strings.today.searchLink }));
    expect(mockPush).toHaveBeenCalledWith('/search');
  });

  it('sem cidade padrão: convite para escolher cidade', async () => {
    await renderToday(
      readyContainer([], {
        getPreferences: async () => ({ defaultCity: null, onboardingDone: true, preferences: DEFAULT_USER_PREFERENCES }),
      }),
    );

    expect(await screen.findByText(strings.today.noCityTitle)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: strings.today.noCityCta }));
    expect(mockPush).toHaveBeenCalledWith('/city-picker');
  });
});
