import type { Habit, Weekday } from '../entities/habit';
import { getTodaySuggestions } from './getTodaySuggestions';
import { buildHabit } from './testing/buildHabit';
import { atHour, buildDay } from './testing/buildHourlyForecast';

// 2026-07-08 (base dos builders) é quarta-feira: hoje = 3, amanhã = 4.
const TODAY: Weekday = 3;
const TOMORROW: Weekday = 4;

/** 48h agradáveis: dia 6h–19h nos dois dias. */
function twoDays() {
  const nightHours: Record<number, { isDay: boolean }> = {};
  for (const h of [0, 1, 2, 3, 4, 5, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 44, 45, 46, 47]) {
    nightHours[h] = { isDay: false };
  }
  return buildDay(0, 48, nightHours);
}

function fixedHabit(overrides: Partial<Habit> = {}): Habit {
  return buildHabit({
    id: 'faculdade',
    name: 'Faculdade',
    category: 'estudo',
    intensity: 'leve',
    outdoor: false,
    days: [TODAY, TOMORROW],
    schedule: { kind: 'fixed', startTime: '19:00', endTime: '22:30' },
    ...overrides,
  });
}

describe('getTodaySuggestions', () => {
  it('fixo antes do horário → vestimenta de hoje com ida e volta', () => {
    const [suggestion] = getTodaySuggestions([fixedHabit()], twoDays(), atHour(16));

    expect(suggestion).toMatchObject({ kind: 'clothing', when: 'hoje' });
    if (suggestion.kind !== 'clothing') throw new Error('esperava clothing');
    expect(suggestion.suggestion.atStart.time.getUTCHours()).toBe(19);
    expect(suggestion.suggestion.atEnd?.time.getUTCHours()).toBe(22);
  });

  it('às 23h, fixo já ocorrido mostra a vestimenta de amanhã rotulada', () => {
    const [suggestion] = getTodaySuggestions([fixedHabit()], twoDays(), atHour(23));

    expect(suggestion).toMatchObject({ kind: 'clothing', when: 'amanha' });
    if (suggestion.kind !== 'clothing') throw new Error('esperava clothing');
    expect(suggestion.suggestion.atStart.time.getUTCDate()).toBe(9); // dia seguinte
  });

  it('fixo com endTime além do forecast sugere só com a ida', () => {
    const todayOnly = twoDays().slice(0, 23); // sem a hora 22 de hoje... corta até 22h
    const habit = fixedHabit({ schedule: { kind: 'fixed', startTime: '19:00', endTime: '23:30' } });

    const [suggestion] = getTodaySuggestions([habit], todayOnly, atHour(16));

    if (suggestion.kind !== 'clothing') throw new Error('esperava clothing');
    expect(suggestion.suggestion.atEnd).toBeUndefined();
  });

  it('livre que ocorre hoje ganha janela de hoje', () => {
    const habit = buildHabit({ days: [TODAY] });

    const [suggestion] = getTodaySuggestions([habit], twoDays(), atHour(9));

    expect(suggestion).toMatchObject({ kind: 'window', when: 'hoje' });
  });

  it('livre 6h–8h consultado às 10h → no-slot com prévia de amanhã (critério §11)', () => {
    const habit = buildHabit({
      days: [TODAY, TOMORROW],
      schedule: { kind: 'flexible', durationMinutes: 60, earliest: '06:00', latest: '08:00' },
    });

    const [suggestion] = getTodaySuggestions([habit], twoDays(), atHour(10));

    expect(suggestion.kind).toBe('no-slot');
    if (suggestion.kind !== 'no-slot') throw new Error('esperava no-slot');
    expect(suggestion.reason).toContain('já passou hoje');
    expect(suggestion.reason).toContain('Amanhã: 6h');
  });

  it('livre que só ocorre amanhã ganha janela de amanhã rotulada', () => {
    const habit = buildHabit({ days: [TOMORROW] });

    const [suggestion] = getTodaySuggestions([habit], twoDays(), atHour(9));

    expect(suggestion).toMatchObject({ kind: 'window', when: 'amanha' });
    if (suggestion.kind !== 'window' || suggestion.recommendation.kind !== 'window') {
      throw new Error('esperava janela');
    }
    expect(suggestion.recommendation.start.getUTCDate()).toBe(9);
  });

  it('desabilitado e dia errado ficam fora do painel', () => {
    const disabled = fixedHabit({ id: 'off', enabled: false });
    const wrongDay = buildHabit({ id: 'wrong', days: [(TODAY + 3) % 7 as Weekday] });

    expect(getTodaySuggestions([disabled, wrongDay], twoDays(), atHour(9))).toEqual([]);
  });

  it('ordena: hoje por horário (fixos e janelas juntos), depois amanhã', () => {
    const morningWalk = buildHabit({
      id: 'walk',
      days: [TODAY],
      schedule: { kind: 'flexible', durationMinutes: 60, earliest: '09:00', latest: '12:00' },
    });
    const earlyFixed = fixedHabit({
      id: 'early',
      days: [TODAY],
      schedule: { kind: 'fixed', startTime: '08:00', endTime: '09:00' },
    });
    const tomorrowOnly = buildHabit({ id: 'tmr', days: [TOMORROW] });

    const suggestions = getTodaySuggestions(
      [tomorrowOnly, morningWalk, earlyFixed],
      twoDays(),
      atHour(7),
    );

    expect(suggestions.map((s) => s.habit.id)).toEqual(['early', 'walk', 'tmr']);
  });

  it('hoje sem dados no horário do fixo vira no-slot de dados', () => {
    const hours = twoDays().map((hour, index) =>
      index === 19 ? { ...hour, apparentTemp: null } : hour,
    );

    const [suggestion] = getTodaySuggestions([fixedHabit({ days: [TODAY] })], hours, atHour(16));

    expect(suggestion.kind).toBe('no-slot');
  });
});
