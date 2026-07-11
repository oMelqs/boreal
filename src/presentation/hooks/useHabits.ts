import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useContainer } from '@/di/ContainerProvider';
import type { Habit } from '@/domain/entities/habit';

const HABITS_QUERY_KEY = ['habits'];

/**
 * ViewModel do CRUD de hábitos (§8.3). Toda mutação invalida `['habits']` —
 * o painel Hoje recalcula sozinho (mesma chave de query).
 */
export function useHabits() {
  const container = useContainer();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: HABITS_QUERY_KEY,
    queryFn: () => container.getHabits(),
    staleTime: Infinity,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: HABITS_QUERY_KEY });

  const saveMutation = useMutation({
    mutationFn: (habit: Habit) => container.saveHabit(habit),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => container.removeHabit(id),
    onSuccess: invalidate,
  });

  return {
    habits: query.data ?? [],
    isLoading: query.isPending,
    save: saveMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    /** Ativa/desativa sem excluir (some do painel, continua na lista). */
    toggle: (habit: Habit) => saveMutation.mutateAsync({ ...habit, enabled: !habit.enabled }),
  };
}
