import type { Habit } from '../entities/habit';
import { recommendBestWindowForHabit } from './recommendBestWindowForHabit';
import { buildHabit } from './testing/buildHabit';
import { atHour, buildDay } from './testing/buildHourlyForecast';

function flexibleHabit(
  overrides: Partial<Habit> = {},
  schedule: Partial<Extract<Habit['schedule'], { kind: 'flexible' }>> = {},
): Habit {
  return buildHabit({
    schedule: { kind: 'flexible', durationMinutes: 60, ...schedule },
    ...overrides,
  });
}

/** Dia quente: manhã amena (18–20 °C), tarde quente (28–31 °C), dia 6h–19h. */
function hotDay() {
  return buildDay(0, 48, {
    0: { isDay: false },
    1: { isDay: false },
    2: { isDay: false },
    3: { isDay: false },
    4: { isDay: false },
    5: { isDay: false },
    6: { apparentTemp: 18 },
    7: { apparentTemp: 18 },
    8: { apparentTemp: 20 },
    9: { apparentTemp: 23 },
    10: { apparentTemp: 26 },
    11: { apparentTemp: 28 },
    12: { apparentTemp: 30 },
    13: { apparentTemp: 31 },
    14: { apparentTemp: 31 },
    15: { apparentTemp: 30 },
    16: { apparentTemp: 28 },
    17: { apparentTemp: 26 },
    18: { apparentTemp: 24 },
    19: { apparentTemp: 22 },
    20: { isDay: false },
    21: { isDay: false },
    22: { isDay: false },
    23: { isDay: false },
    // amanhã (24+): madrugada de noite, dia agradável a partir das 6h (30h)
    24: { isDay: false },
    25: { isDay: false },
    26: { isDay: false },
    27: { isDay: false },
    28: { isDay: false },
    29: { isDay: false },
    30: { apparentTemp: 18 },
    31: { apparentTemp: 19 },
    44: { isDay: false },
    45: { isDay: false },
    46: { isDay: false },
    47: { isDay: false },
  });
}

describe('recommendBestWindowForHabit', () => {
  it('perfis mudam a janela no mesmo dia: corrida (intensa) mais cedo que passeio (leve)', () => {
    const hours = hotDay();
    const now = atHour(6);

    const walk = recommendBestWindowForHabit(hours, now, flexibleHabit({ intensity: 'leve' }));
    const run = recommendBestWindowForHabit(hours, now, flexibleHabit({ intensity: 'intensa' }));

    if (walk.kind !== 'window' || run.kind !== 'window') throw new Error('esperava janelas');
    // corrida (ideal 10–20 °C) prefere a manhã fria; passeio (16–26 °C) tolera mais tarde
    expect(run.start.getTime()).toBeLessThanOrEqual(walk.start.getTime());
    expect(run.start.getUTCHours()).toBeLessThanOrEqual(8);
  });

  it('duração 30/60 min vira janela de 1h; 90/120 de 2h', () => {
    const hours = hotDay();
    const now = atHour(6);

    const short = recommendBestWindowForHabit(
      hours,
      now,
      flexibleHabit({}, { durationMinutes: 30 }),
    );
    const long = recommendBestWindowForHabit(
      hours,
      now,
      flexibleHabit({}, { durationMinutes: 120 }),
    );

    if (short.kind !== 'window' || long.kind !== 'window') throw new Error('esperava janelas');
    expect(short.end.getTime() - short.start.getTime()).toBe(60 * 60 * 1000);
    expect(long.end.getTime() - long.start.getTime()).toBe(2 * 60 * 60 * 1000);
  });

  it('bounds do hábito restringem a janela', () => {
    const result = recommendBestWindowForHabit(
      hotDay(),
      atHour(6),
      flexibleHabit({ intensity: 'intensa' }, { earliest: '17:00', latest: '20:00' }),
    );

    expect(result).toMatchObject({ kind: 'window' });
    if (result.kind === 'window') {
      expect(result.start.getUTCHours()).toBeGreaterThanOrEqual(17);
    }
  });

  it('janela 6h–8h consultada às 10h → no-slot com prévia de amanhã', () => {
    const result = recommendBestWindowForHabit(
      hotDay(),
      atHour(10),
      flexibleHabit({}, { earliest: '06:00', latest: '08:00' }),
    );

    expect(result.kind).toBe('no-slot');
    if (result.kind === 'no-slot') {
      expect(result.reason).toContain('Sua janela é 6h–8h e já passou hoje.');
      expect(result.reason).toContain('Amanhã: 6h, 18 °C, sem chuva.');
    }
  });

  it('sem forecast de amanhã, o no-slot vem sem prévia', () => {
    const todayOnly = hotDay().slice(0, 24);
    const result = recommendBestWindowForHabit(
      todayOnly,
      atHour(10),
      flexibleHabit({}, { earliest: '06:00', latest: '08:00' }),
    );

    expect(result.kind).toBe('no-slot');
    if (result.kind === 'no-slot') {
      expect(result.reason).toBe('Sua janela é 6h–8h e já passou hoje.');
    }
  });

  it('dia acabou (sem bounds) → no-slot com razão própria e prévia', () => {
    const result = recommendBestWindowForHabit(hotDay(), atHour(21), flexibleHabit());

    expect(result.kind).toBe('no-slot');
    if (result.kind === 'no-slot') {
      expect(result.reason).toContain('O dia já está acabando por aí.');
      expect(result.reason).toContain('Amanhã:');
    }
  });

  it('hoje todo sem dados → no-slot de dados', () => {
    const hours = hotDay().map((hour, index) =>
      index < 24 ? { ...hour, apparentTemp: null } : hour,
    );

    const result = recommendBestWindowForHabit(hours, atHour(8), flexibleHabit());

    expect(result.kind).toBe('no-slot');
    if (result.kind === 'no-slot') {
      expect(result.reason).toContain('sem dados utilizáveis');
    }
  });
});
