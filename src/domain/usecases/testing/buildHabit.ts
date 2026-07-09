import type { Habit } from '../../entities/habit';

/** Hábito válido por padrão; sobrescreva só o que o caso exige. */
export function buildHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Passear com o Thor',
    category: 'pet',
    intensity: 'leve',
    outdoor: true,
    days: [1, 3, 5],
    schedule: { kind: 'flexible', durationMinutes: 30 },
    enabled: true,
    createdAt: '2026-07-08T12:00:00.000Z',
    ...overrides,
  };
}
