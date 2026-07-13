import { act, renderHook, waitFor } from '@testing-library/react-native';

import { NetworkError } from '@/data/errors';
import { buildHabit } from '@/domain/usecases/testing/buildHabit';
import { atHour, buildDay } from '@/domain/usecases/testing/buildHourlyForecast';
import {
  createFakeContainer,
  createProvidersWrapper,
  joinville,
} from '@/presentation/testing/providers';

import { useTodaySuggestions } from './useTodaySuggestions';

// 2026-07-08 (dia base) é quarta = 3
const habit = buildHabit({ days: [3] });

function readyContainer(overrides = {}) {
  return createFakeContainer({
    getPreferences: async () => ({ defaultCity: joinville, onboardingDone: true }),
    getHabits: async () => [habit],
    getForecast: async () => buildDay(0, 48),
    ...overrides,
  });
}

async function renderToday(container = readyContainer(), now = atHour(9)) {
  return renderHook(() => useTodaySuggestions({ now }), {
    wrapper: createProvidersWrapper(container),
  });
}

describe('useTodaySuggestions', () => {
  it('deriva ready com as sugestões do orquestrador e as horas de hoje', async () => {
    const { result } = await renderToday();

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const vm = result.current;
    if (vm.status !== 'ready') throw new Error('esperava ready');

    expect(vm.city.name).toBe('Joinville');
    expect(vm.suggestions).toHaveLength(1);
    expect(vm.suggestions[0]).toMatchObject({ kind: 'window', when: 'hoje' });
    expect(vm.todayHours).toHaveLength(24);
    // Clima do card: condição de agora (9h) + melhor janela de hoje.
    expect(vm.weather.current?.hour.time).toEqual(atHour(9));
    expect(vm.weather.bestWindow.kind).toBe('window');
  });

  it('GPS concedido sobrepõe a cidade padrão no painel', async () => {
    const { result } = await renderToday(
      readyContainer({
        ensureLocationPermission: async () => 'granted',
        getCurrentPosition: async () => ({ latitude: -23.55, longitude: -46.63 }),
      }),
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const vm = result.current;
    if (vm.status !== 'ready') throw new Error('esperava ready');
    expect(vm.city.id).toBe(0); // cidade sentinela do device, não Joinville
  });

  it('empty ainda expõe o clima da cidade para o card', async () => {
    const { result } = await renderToday(readyContainer({ getHabits: async () => [] }));

    await waitFor(() => expect(result.current.status).toBe('empty'));
    const vm = result.current;
    if (vm.status !== 'empty') throw new Error('esperava empty');
    expect(vm.city.name).toBe('Joinville');
    expect(vm.weather.current?.hour.time).toEqual(atHour(9));
  });

  it('sem cidade padrão → no-city', async () => {
    const { result } = await renderToday(
      readyContainer({
        getPreferences: async () => ({ defaultCity: null, onboardingDone: true }),
      }),
    );

    await waitFor(() => expect(result.current.status).toBe('no-city'));
  });

  it('sem hábitos → empty', async () => {
    const { result } = await renderToday(readyContainer({ getHabits: async () => [] }));

    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('erro de rede no forecast → error com retry funcional', async () => {
    let shouldFail = true;
    const getForecast = jest.fn(async () => {
      if (shouldFail) throw new NetworkError();
      return buildDay(0, 48);
    });
    const { result } = await renderToday(readyContainer({ getForecast }));

    await waitFor(() => expect(result.current.status).toBe('error'));

    shouldFail = false;
    const vm = result.current;
    if (vm.status !== 'error') throw new Error('esperava erro');
    await act(async () => vm.retry());

    await waitFor(() => expect(result.current.status).toBe('ready'));
  });
});
