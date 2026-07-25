import type { HourlyForecast } from '../entities/hourlyForecast';
import type { UserPreferences } from '../entities/preferences';
import { getTodaySuggestions } from './getTodaySuggestions';
import { atHour, buildDay } from './testing/buildHourlyForecast';
import { buildHabit } from './testing/buildHabit';

// 2026-07-08 (dia base dos builders) é quarta-feira = 3
const WEDNESDAY = 3 as const;

function preset(name: 'friorento' | 'equilibrado' | 'calorento'): UserPreferences {
  return { comfort: { kind: 'preset', preset: name } };
}

describe('getTodaySuggestions com preferências (§6.2)', () => {
  it('às 00h30 de quem dorme à 01h, o hábito de "ontem" ainda é hoje (§11)', () => {
    const nightHours: Record<number, Partial<HourlyForecast>> = {};
    for (let h = 20; h <= 25; h++) nightHours[h] = { isDay: false };
    const hours = buildDay(14, 12, nightHours); // qua 14h até qui 01h

    const lateWalk = buildHabit({
      days: [WEDNESDAY],
      schedule: { kind: 'flexible', durationMinutes: 30 },
    });
    const nightOwl: UserPreferences = {
      ...preset('equilibrado'),
      sleep: { wakeTime: '14:00', sleepTime: '01:00' },
    };

    // atHour(24, 30) = 00h30 de quinta; âncora do ciclo = quarta 14h.
    const suggestions = getTodaySuggestions([lateWalk], hours, atHour(24, 30), nightOwl);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].kind).toBe('window');
    if (suggestions[0].kind !== 'window') return;
    expect(suggestions[0].when).toBe('hoje');
    // Único slot restante do ciclo: 00h–01h de quinta.
    expect(suggestions[0].recommendation.start).toEqual(atHour(24));
  });

  it('critério §11: com calorento a frase de vestimenta do fixo fica mais leve', () => {
    const hours = buildDay(6, 16, { 19: { apparentTemp: 17 }, 20: { apparentTemp: 17 } });
    const college = buildHabit({
      days: [WEDNESDAY],
      outdoor: false,
      schedule: { kind: 'fixed', startTime: '19:00', endTime: '20:00' },
    });

    const [balanced] = getTodaySuggestions([college], hours, atHour(9), preset('equilibrado'));
    const [heatSensitive] = getTodaySuggestions([college], hours, atHour(9), preset('calorento'));

    expect(balanced.kind).toBe('clothing');
    expect(heatSensitive.kind).toBe('clothing');
    if (balanced.kind !== 'clothing' || heatSensitive.kind !== 'clothing') return;
    // 17 °C reais: equilibrado veste jaqueta leve; calorento (+3, sente 20) veste leve.
    expect(balanced.suggestion.outfit).toBe('camada-leve');
    expect(heatSensitive.suggestion.outfit).toBe('leve');
  });

  it('sem preferências explícitas, comportamento default preservado', () => {
    const hours = buildDay(6, 14);
    const walk = buildHabit({ days: [WEDNESDAY] });

    const withDefault = getTodaySuggestions([walk], hours, atHour(9));
    const withExplicit = getTodaySuggestions([walk], hours, atHour(9), preset('equilibrado'));

    expect(withDefault).toEqual(withExplicit);
  });
});
