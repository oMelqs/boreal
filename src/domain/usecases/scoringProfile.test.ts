import { computeComfortBreakdown, DEFAULT_COMFORT_PARAMS } from './computeComfortScore';
import { DEFAULT_SCORING_PROFILE, recommendBestWindow } from './recommendBestWindow';
import { atHour, buildDay, buildHour } from './testing/buildHourlyForecast';

/**
 * Sanidade da parametrização (base dos perfis por hábito). O comportamento
 * default é coberto pelos testes originais dos motores, que permanecem
 * intactos.
 */
describe('ScoringProfile', () => {
  it('uvWeight alto dobra a penalidade de UV', () => {
    const hour = buildHour({ uvIndex: 9 });

    expect(computeComfortBreakdown(hour)?.penalties.uv).toBe(12);
    expect(
      computeComfortBreakdown(hour, { ...DEFAULT_COMFORT_PARAMS, uvWeight: 'alto' })?.penalties
        .uv,
    ).toBe(24);
  });

  it('windToleranceKmh desloca o início da penalidade de vento', () => {
    const hour = buildHour({ windSpeed: 20 });

    expect(computeComfortBreakdown(hour)?.penalties.wind).toBe(5);
    expect(
      computeComfortBreakdown(hour, { ...DEFAULT_COMFORT_PARAMS, windToleranceKmh: 25 })
        ?.penalties.wind,
    ).toBe(0);
  });

  it('idealTempRange muda a penalidade e a frase de temperatura', () => {
    // 24 °C: agradável no perfil default, calor num perfil de corrida (10–20)
    const hours = buildDay(10, 3);
    const runnerProfile = {
      ...DEFAULT_SCORING_PROFILE,
      idealTempRange: [10, 20] as [number, number],
    };

    const result = recommendBestWindow(hours, atHour(10), runnerProfile);

    expect(result.kind === 'window' && result.reasons[0]).toBe('calor de 24 °C');
  });

  it('windowHours travado em 1h recomenda janela de uma hora', () => {
    const hours = buildDay(10, 4, { 11: { apparentTemp: 24 }, 12: { apparentTemp: 30 } });
    const profile = { ...DEFAULT_SCORING_PROFILE, windowHours: { min: 1, max: 1 } };

    const result = recommendBestWindow(hours, atHour(10), profile);

    expect(result).toMatchObject({ kind: 'window', start: atHour(10), end: atHour(11) });
  });

  it('bounds recortam as horas elegíveis antes da janela deslizante', () => {
    // manhã perfeita, tarde pior — mas o hábito só pode acontecer após 14h
    const hours = buildDay(8, 10, {
      14: { windSpeed: 20 },
      15: { windSpeed: 20 },
      16: { windSpeed: 22 },
      17: { windSpeed: 22 },
    });
    const profile = { ...DEFAULT_SCORING_PROFILE, bounds: { earliest: '14:00' } };

    const result = recommendBestWindow(hours, atHour(8), profile);

    expect(result).toMatchObject({ kind: 'window', start: atHour(14) });
  });

  it('bounds sem nenhuma hora possível hoje viram day-over', () => {
    const hours = buildDay(10, 6);
    const profile = { ...DEFAULT_SCORING_PROFILE, bounds: { earliest: '06:00', latest: '08:00' } };

    expect(recommendBestWindow(hours, atHour(10), profile)).toEqual({ kind: 'day-over' });
  });

  it('latest é o fim da última hora elegível (início + 1h ≤ latest)', () => {
    const hours = buildDay(10, 6);
    const profile = {
      ...DEFAULT_SCORING_PROFILE,
      windowHours: { min: 1, max: 1 },
      bounds: { earliest: '11:00', latest: '12:00' },
    };

    const result = recommendBestWindow(hours, atHour(10), profile);

    // 11h é a única hora que começa após 11:00 e termina até 12:00
    expect(result).toMatchObject({ kind: 'window', start: atHour(11), end: atHour(12) });
  });
});
