import { renderHook, waitFor } from '@testing-library/react-native';

import type { Habit } from '@/domain/entities/habit';
import { buildHabit } from '@/domain/usecases/testing/buildHabit';
import { createFakeContainer, createProvidersWrapper } from '@/presentation/testing/providers';

import { useHabits } from './useHabits';

describe('useHabits', () => {
  it('lista os hábitos e toggle persiste enabled invertido', async () => {
    const habit = buildHabit({ id: 'a', enabled: true });
    const saved: Habit[] = [];
    const container = createFakeContainer({
      getHabits: async () => [habit],
      saveHabit: async (updated) => {
        saved.push(updated);
      },
    });
    const { result } = await renderHook(() => useHabits(), {
      wrapper: createProvidersWrapper(container),
    });

    await waitFor(() => expect(result.current.habits).toHaveLength(1));
    await result.current.toggle(habit);

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ id: 'a', enabled: false });
  });

  it('remove chama o container e a lista é invalidada (refetch)', async () => {
    let stored = [buildHabit({ id: 'a' }), buildHabit({ id: 'b' })];
    const container = createFakeContainer({
      getHabits: async () => stored,
      removeHabit: async (id) => {
        stored = stored.filter((habit) => habit.id !== id);
      },
    });
    const { result } = await renderHook(() => useHabits(), {
      wrapper: createProvidersWrapper(container),
    });
    await waitFor(() => expect(result.current.habits).toHaveLength(2));

    await result.current.remove('a');

    await waitFor(() => expect(result.current.habits).toHaveLength(1));
    expect(result.current.habits[0].id).toBe('b');
  });
});
