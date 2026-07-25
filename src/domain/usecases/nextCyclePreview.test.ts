import type { HourlyForecast } from '../entities/hourlyForecast';
import type { SleepSchedule } from '../entities/preferences';
import { nextCyclePreview } from './nextCyclePreview';
import { atHour, buildDay } from './testing/buildHourlyForecast';

const routine: SleepSchedule = { wakeTime: '07:00', sleepTime: '23:00' };

/** Dois dias completos; a madrugada e a noite marcadas como noite. */
function twoDays(overrides: Record<number, Partial<HourlyForecast>> = {}) {
  const nights: Record<number, Partial<HourlyForecast>> = {};
  for (const hour of [0, 1, 2, 3, 4, 5, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 44, 45, 46, 47]) {
    nights[hour] = { isDay: false };
  }
  return buildDay(0, 48, { ...nights, ...overrides });
}

describe('nextCyclePreview', () => {
  it('com rotina, aponta a primeira hora do próximo ciclo acordado', () => {
    // 31 = 7h de amanhã, o primeiro instante acordado depois de hoje.
    const hours = twoDays({ 31: { apparentTemp: 18, precipitationProb: 5 } });

    expect(nextCyclePreview({ hours, now: atHour(23, 30), sleep: routine })).toEqual({
      startHour: 7,
      temp: 18,
      precipitationProb: 5,
    });
  });

  it('durante o dia, a prévia já é a do ciclo de amanhã', () => {
    const hours = twoDays({ 31: { apparentTemp: 21, precipitationProb: 40 } });

    expect(nextCyclePreview({ hours, now: atHour(10), sleep: routine })).toEqual({
      startHour: 7,
      temp: 21,
      precipitationProb: 40,
    });
  });

  it('sem rotina, cai na primeira hora de dia de amanhã', () => {
    const hours = twoDays({ 30: { apparentTemp: 16, precipitationProb: 0 } });

    expect(nextCyclePreview({ hours, now: atHour(20) })).toEqual({
      startHour: 6,
      temp: 16,
      precipitationProb: 0,
    });
  });

  it('respeita os bounds do hábito', () => {
    const hours = twoDays({ 33: { apparentTemp: 19, precipitationProb: 10 } });

    const preview = nextCyclePreview({
      hours,
      now: atHour(20),
      sleep: routine,
      bounds: { earliest: '09:00', latest: '18:00' },
    });

    expect(preview?.startHour).toBe(9);
  });

  it('forecast que não alcança o próximo ciclo devolve null', () => {
    const hours = buildDay(0, 24); // só hoje

    expect(nextCyclePreview({ hours, now: atHour(20), sleep: routine })).toBeNull();
  });

  it('horas sem dados utilizáveis são puladas', () => {
    const hours = twoDays({
      31: { apparentTemp: null },
      32: { apparentTemp: 17, precipitationProb: 30 },
    });

    expect(nextCyclePreview({ hours, now: atHour(23, 30), sleep: routine })).toEqual({
      startHour: 8,
      temp: 17,
      precipitationProb: 30,
    });
  });
});
