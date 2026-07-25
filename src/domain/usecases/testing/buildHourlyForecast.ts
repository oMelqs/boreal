import type { HourlyForecast } from '../../entities/hourlyForecast';

/**
 * Dia base dos testes. Dates construídos via `Date.UTC` para que os testes
 * não dependam do timezone do processo (o motor compara apenas epochs).
 */
export const BASE_YEAR = 2026;
export const BASE_MONTH = 6; // julho (0-based)
export const BASE_DAY = 8;

/** Date no dia base, na hora cheia informada (frame "wall-clock da cidade"). */
export function atHour(hourOfDay: number, minutes = 0): Date {
  return new Date(Date.UTC(BASE_YEAR, BASE_MONTH, BASE_DAY, hourOfDay, minutes));
}

/**
 * Hora agradável por padrão (score 100): 24 °C de sensação, sem chuva,
 * vento leve, UV baixo, de dia. Sobrescreva só o que o caso de teste exige.
 */
export function buildHour(overrides: Partial<HourlyForecast> = {}): HourlyForecast {
  return {
    time: atHour(12),
    apparentTemp: 24,
    temp: 23,
    humidity: 55,
    precipitationProb: 0,
    precipitationMm: 0,
    windSpeed: 8,
    uvIndex: 4,
    weatherCode: 1,
    isDay: true,
    ...overrides,
  };
}

/** Sequência de horas consecutivas a partir de `startHour`, todas agradáveis. */
export function buildDay(
  startHour: number,
  count: number,
  overridesByHour: Record<number, Partial<HourlyForecast>> = {},
): HourlyForecast[] {
  return Array.from({ length: count }, (_, i) => {
    const hourOfDay = startHour + i;
    return buildHour({ time: atHour(hourOfDay), ...overridesByHour[hourOfDay] });
  });
}
