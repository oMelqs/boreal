import type { HourlyForecast } from '../entities/hourlyForecast';
import type { UserPreferences } from '../entities/preferences';
import { recommendBestWindowForHabit } from './recommendBestWindowForHabit';
import { atHour, buildDay } from './testing/buildHourlyForecast';
import { buildHabit } from './testing/buildHabit';

function preset(name: 'friorento' | 'equilibrado' | 'calorento'): UserPreferences {
  return { comfort: { kind: 'preset', preset: name } };
}

const walk = buildHabit({ schedule: { kind: 'flexible', durationMinutes: 60 } });

describe('recommendBestWindowForHabit com preferências (§4.3, §6)', () => {
  it('critério §11: trocar para calorento desloca a janela no mesmo dia sintético', () => {
    // Manhã a 26 °C, fim de tarde a 18 °C, tudo de dia e sem chuva.
    const overrides: Record<number, Partial<HourlyForecast>> = {};
    for (const h of [8, 9, 10, 11, 12, 13]) overrides[h] = { apparentTemp: 26 };
    for (const h of [14, 15, 16, 17]) overrides[h] = { apparentTemp: 18 };
    const day = buildDay(8, 10, overrides);

    const balanced = recommendBestWindowForHabit(day, atHour(8), walk, preset('equilibrado'));
    const heatSensitive = recommendBestWindowForHabit(day, atHour(8), walk, preset('calorento'));

    // Equilibrado+leve (16–26): manhã sem penalidade → empate → mais cedo.
    expect(balanced.kind).toBe('window');
    if (balanced.kind === 'window') expect(balanced.start).toEqual(atHour(8));
    // Calorento+leve (13–23): 26 °C penaliza → janela migra para o fim de tarde.
    expect(heatSensitive.kind).toBe('window');
    if (heatSensitive.kind === 'window') {
      expect(heatSensitive.start.getUTCHours()).toBeGreaterThanOrEqual(14);
    }
  });

  it('bounds do hábito intersectados com a janela acordada: a mais restritiva vence', () => {
    const overrides: Record<number, Partial<HourlyForecast>> = {};
    for (const h of [19, 20, 21, 22]) overrides[h] = { isDay: false };
    const day = buildDay(8, 15, overrides); // 8h–22h

    const evening = buildHabit({
      schedule: { kind: 'flexible', durationMinutes: 60, earliest: '18:00', latest: '23:00' },
    });
    const earlySleeper: UserPreferences = {
      ...preset('equilibrado'),
      sleep: { wakeTime: '07:00', sleepTime: '21:00' },
    };

    const result = recommendBestWindowForHabit(day, atHour(8), evening, earlySleeper);

    // Bounds permitem 18h–23h; sono corta às 21h → só 18h–21h sobrevive.
    expect(result.kind).toBe('window');
    if (result.kind !== 'window') return;
    expect(result.start.getUTCHours()).toBeGreaterThanOrEqual(18);
    expect(result.end.getUTCHours()).toBeLessThanOrEqual(21);
  });

  it('guarda pós-sono: "Por hoje é isso!" com prévia a partir do acordar (§6.2)', () => {
    const overrides: Record<number, Partial<HourlyForecast>> = {
      31: { apparentTemp: 18 }, // 7h de amanhã
    };
    const twoDays = buildDay(20, 20, overrides); // 20h de hoje até 15h de amanhã
    const routine: UserPreferences = {
      ...preset('equilibrado'),
      sleep: { wakeTime: '07:00', sleepTime: '23:00' },
    };

    const result = recommendBestWindowForHabit(twoDays, atHour(23, 30), walk, routine);

    expect(result.kind).toBe('no-slot');
    if (result.kind !== 'no-slot') return;
    expect(result.reason).toBe('Por hoje é isso! Amanhã a partir das 7h: 18 °C, sem chuva.');
  });

  it('sem rotina de sono, a guarda legada permanece intacta', () => {
    const night: Record<number, Partial<HourlyForecast>> = {};
    for (const h of [20, 21, 22, 23]) night[h] = { isDay: false };
    const day = buildDay(20, 4, night);

    const result = recommendBestWindowForHabit(day, atHour(20), walk, preset('equilibrado'));

    expect(result.kind).toBe('no-slot');
    if (result.kind !== 'no-slot') return;
    expect(result.reason).toContain('O dia já está acabando por aí.');
  });
});
