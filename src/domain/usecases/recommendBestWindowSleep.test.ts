import type { HourlyForecast } from '../entities/hourlyForecast';
import type { SleepSchedule } from '../entities/preferences';
import type { ScoringProfile } from './recommendBestWindow';
import { DEFAULT_SCORING_PROFILE, recommendBestWindow } from './recommendBestWindow';
import { atHour, buildDay } from './testing/buildHourlyForecast';

const routine: SleepSchedule = { wakeTime: '07:00', sleepTime: '23:00' };

function withSleep(sleep: SleepSchedule, overrides: Partial<ScoringProfile> = {}): ScoringProfile {
  return { ...DEFAULT_SCORING_PROFILE, sleep, ...overrides };
}

/** Dia 6h–22h: tarde quente (32 °C), noite (19h+) amena e escura. */
function hotDayNiceEvening(): HourlyForecast[] {
  const overrides: Record<number, Partial<HourlyForecast>> = {};
  for (const h of [12, 13, 14, 15, 16, 17, 18]) overrides[h] = { apparentTemp: 32 };
  for (const h of [19, 20, 21, 22]) overrides[h] = { isDay: false, apparentTemp: 22 };
  return buildDay(6, 17, overrides);
}

describe('recommendBestWindow com rotina de sono (§6)', () => {
  it('janela pode cair à noite, com "já de noite" na frase (§11)', () => {
    const result = recommendBestWindow(hotDayNiceEvening(), atHour(12), withSleep(routine));

    expect(result.kind).toBe('window');
    if (result.kind !== 'window') return;
    expect(result.start.getUTCHours()).toBeGreaterThanOrEqual(19);
    expect(result.reasons[0]).toBe('já de noite');
  });

  it('sem sleep, a mesma noite segue inelegível (comportamento legado)', () => {
    const result = recommendBestWindow(hotDayNiceEvening(), atHour(12));

    expect(result.kind).toBe('window');
    if (result.kind !== 'window') return;
    expect(result.end.getUTCHours()).toBeLessThanOrEqual(19);
    expect(result.reasons).not.toContain('já de noite');
  });

  it('janela diurna com sleep não menciona noite', () => {
    const result = recommendBestWindow(hotDayNiceEvening(), atHour(6), withSleep(routine));

    expect(result.kind).toBe('window');
    if (result.kind !== 'window') return;
    expect(result.reasons).not.toContain('já de noite');
  });

  it('após o horário de dormir → day-over, mesmo com forecast de amanhã em mãos', () => {
    const twoDays = buildDay(18, 24); // 18h de hoje até 17h de amanhã, tudo agradável
    const result = recommendBestWindow(twoDays, atHour(23, 30), withSleep(routine));

    expect(result).toEqual({ kind: 'day-over' });
  });

  it('antes de acordar, o ciclo de hoje vale e a janela é recomendada', () => {
    const result = recommendBestWindow(hotDayNiceEvening(), atHour(5), withSleep(routine));

    expect(result.kind).toBe('window');
    if (result.kind !== 'window') return;
    expect(result.start.getUTCHours()).toBeGreaterThanOrEqual(7);
  });

  it('às 00h30 de quem dorme à 01h00, a hora 00h ainda é elegível (§11)', () => {
    const night = [
      ...buildDay(20, 8, {
        20: { isDay: false },
        21: { isDay: false },
        22: { isDay: false },
        23: { isDay: false },
        24: { isDay: false },
        25: { isDay: false },
        26: { isDay: false },
        27: { isDay: false },
      }),
    ];
    const profile = withSleep(
      { wakeTime: '07:00', sleepTime: '01:00' },
      { windowHours: { min: 1, max: 1 } },
    );
    // 00h30 do dia seguinte às horas noturnas (atHour(24) = 00h de amanhã).
    const result = recommendBestWindow(night, atHour(24, 30), profile);

    expect(result.kind).toBe('window');
    if (result.kind !== 'window') return;
    // Único slot restante do ciclo: a própria hora 00h (termina 01h, hora de dormir).
    expect(result.start).toEqual(atHour(24));
    expect(result.end).toEqual(atHour(25));
    expect(result.reasons[0]).toBe('já de noite');
  });
});
