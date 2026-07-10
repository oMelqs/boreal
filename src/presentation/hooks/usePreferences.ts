import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useContainer } from '@/di/ContainerProvider';
import type { Preferences } from '@/domain/entities/preferences';

const PREFERENCES_QUERY_KEY = ['preferences'];

/**
 * Preferências locais (cidade padrão, onboarding). staleTime infinito: só
 * mudam por ação da própria pessoa, então a mutation invalida o cache.
 */
export function usePreferences() {
  const container = useContainer();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: () => container.getPreferences(),
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: (preferences: Preferences) => container.savePreferences(preferences),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY }),
  });

  return {
    preferences: query.data ?? null,
    isLoading: query.isPending,
    savePreferences: saveMutation.mutateAsync,
  };
}
