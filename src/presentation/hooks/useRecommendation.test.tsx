import { act, renderHook, waitFor } from '@testing-library/react-native';

import { NetworkError } from '@/data/errors';
import { atHour, buildDay } from '@/domain/usecases/testing/buildHourlyForecast';
import { strings } from '@/presentation/i18n/strings';
import {
  createFakeContainer,
  createProvidersWrapper,
  joinville,
} from '@/presentation/testing/providers';

import { useRecommendation } from './useRecommendation';

// Dia com 6h–19h de dia e 16h quente — janela esperada: 17h–19h (par 17/18)
function goodDay() {
  return buildDay(6, 18, {
    12: { apparentTemp: 30 },
    13: { apparentTemp: 31 },
    14: { apparentTemp: 31 },
    15: { apparentTemp: 30 },
    16: { apparentTemp: 31 },
    19: { windSpeed: 25 },
    20: { isDay: false },
    21: { isDay: false },
    22: { isDay: false },
    23: { isDay: false },
  });
}

async function renderRecommendation(
  container = createFakeContainer({ getForecast: async () => goodDay() }),
  now = atHour(16),
) {
  return renderHook(() => useRecommendation(joinville, { now }), {
    wrapper: createProvidersWrapper(container),
  });
}

describe('useRecommendation', () => {
  it('começa em loading (skeleton do primeiro load)', async () => {
    // Promise pendente: garante o estado inicial sem corrida com o fetch
    const { result } = await renderRecommendation(
      createFakeContainer({ getForecast: () => new Promise(() => {}) }),
    );

    expect(result.current.status).toBe('loading');
  });

  it('sucesso: janela do motor, timeline com marcações e detalhes agregados', async () => {
    const { result } = await renderRecommendation();
    await waitFor(() => expect(result.current.status).toBe('success'));
    const vm = result.current;
    if (vm.status !== 'success') throw new Error('esperava sucesso');

    expect(vm.recommendation).toMatchObject({
      kind: 'window',
      start: atHour(17),
      end: atHour(19),
    });

    // timeline: somente horas restantes (16h em diante), noite incluída
    expect(vm.timeline[0]).toMatchObject({ time: atHour(16), isNow: true, inWindow: false });
    expect(vm.timeline.map((h) => h.time.getUTCHours())).toEqual([16, 17, 18, 19, 20, 21, 22, 23]);
    expect(vm.timeline[1]).toMatchObject({ inWindow: true });
    expect(vm.timeline[2]).toMatchObject({ inWindow: true });
    expect(vm.timeline[3]).toMatchObject({ inWindow: false });
    expect(vm.timeline[4].isDay).toBe(false);
    expect(vm.timeline[4].score).not.toBeNull(); // noite exibe score calculado

    expect(vm.windowDetails).toMatchObject({ apparentTemp: 24, precipitationProb: 0 });
  });

  it('hora sem dados vira score null na timeline', async () => {
    const hours = buildDay(16, 3, { 17: { apparentTemp: null } });
    const { result } = await renderRecommendation(
      createFakeContainer({ getForecast: async () => hours }),
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    const vm = result.current;
    if (vm.status !== 'success') throw new Error('esperava sucesso');

    expect(vm.timeline[1].score).toBeNull();
  });

  it('consulta à noite deriva day-over', async () => {
    const { result } = await renderRecommendation(undefined, atHour(21));
    await waitFor(() => expect(result.current.status).toBe('success'));
    const vm = result.current;
    if (vm.status !== 'success') throw new Error('esperava sucesso');

    expect(vm.recommendation).toEqual({ kind: 'day-over' });
    expect(vm.windowDetails).toBeNull();
  });

  it('regressão da cerca: com 48h no cache, a noite continua day-over e a timeline é só de hoje', async () => {
    // hoje 6h–19h de dia + amanhã inteiro perfeito no mesmo payload
    const twoDays = [...goodDay(), ...buildDay(24, 24)];
    const { result } = await renderRecommendation(
      createFakeContainer({ getForecast: async () => twoDays }),
      atHour(21),
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    const vm = result.current;
    if (vm.status !== 'success') throw new Error('esperava sucesso');

    expect(vm.recommendation).toEqual({ kind: 'day-over' }); // nunca janela de amanhã
    expect(vm.timeline.every((hour) => hour.time.getUTCDate() === 8)).toBe(true);
  });

  it('erro de rede vira mensagem pt-BR com retry funcional', async () => {
    let shouldFail = true;
    const getForecast = jest.fn(async () => {
      if (shouldFail) throw new NetworkError();
      return goodDay();
    });
    const { result } = await renderRecommendation(createFakeContainer({ getForecast }));

    await waitFor(() => expect(result.current.status).toBe('error'));
    const vm = result.current;
    if (vm.status !== 'error') throw new Error('esperava erro');
    expect(vm.errorMessage).toBe(strings.errors.network);

    shouldFail = false;
    await act(async () => vm.retry());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(getForecast).toHaveBeenCalledTimes(2);
  });
});
