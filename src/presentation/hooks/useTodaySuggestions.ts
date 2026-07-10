import { useQuery, useQueryClient } from '@tanstack/react-query';

import { nowInTimezone } from '@/data/time/nowInTimezone';
import { useContainer } from '@/di/ContainerProvider';
import type { City } from '@/domain/entities/city';
import type { HabitSuggestion } from '@/domain/entities/clothing';
import type { HourlyForecast } from '@/domain/entities/hourlyForecast';
import { getTodaySuggestions } from '@/domain/usecases/getTodaySuggestions';
import { splitByLocalDay } from '@/domain/usecases/localDay';
import { mapErrorToMessage } from '@/presentation/i18n/errorMessages';

import { usePreferences } from './usePreferences';

/** Mesmo staleTime do fluxo de recomendação (§4.3) — cache compartilhado. */
const FORECAST_STALE_TIME_MS = 5 * 60 * 1000;

export type TodaySuggestionsViewModel =
  | { status: 'loading' }
  | { status: 'no-city' }
  | { status: 'error'; city: City; errorMessage: string; retry: () => void }
  | { status: 'empty'; city: City }
  | {
      status: 'ready';
      city: City;
      now: Date;
      suggestions: HabitSuggestion[];
      /** Horas restantes de hoje — timeline expansível dos cards de janela. */
      todayHours: HourlyForecast[];
      refresh: () => void;
      isRefreshing: boolean;
    };

type Options = {
  /** Injetável nos testes; produção usa o relógio da cidade padrão. */
  now?: Date;
};

/**
 * ViewModel do painel "Hoje" (§8.2): cidade padrão + hábitos + forecast de
 * 2 dias → sugestões ordenadas do orquestrador. Pull-to-refresh invalida só
 * o forecast.
 */
export function useTodaySuggestions(options: Options = {}): TodaySuggestionsViewModel {
  const container = useContainer();
  const queryClient = useQueryClient();
  const { preferences, isLoading: loadingPreferences } = usePreferences();
  const city = preferences?.defaultCity ?? null;

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: () => container.getHabits(),
    staleTime: Infinity,
  });

  const forecastQuery = useQuery({
    queryKey: ['forecast', city?.id],
    queryFn: () => container.getForecast(city as City),
    enabled: city !== null,
    staleTime: FORECAST_STALE_TIME_MS,
  });

  if (loadingPreferences) return { status: 'loading' };
  if (city === null) return { status: 'no-city' };
  if (habitsQuery.isPending || forecastQuery.isPending) return { status: 'loading' };

  if (habitsQuery.isError || forecastQuery.isError) {
    const error = habitsQuery.error ?? forecastQuery.error;
    return {
      status: 'error',
      city,
      errorMessage: mapErrorToMessage(error),
      retry: () => {
        if (habitsQuery.isError) void habitsQuery.refetch();
        if (forecastQuery.isError) void forecastQuery.refetch();
      },
    };
  }

  const habits = habitsQuery.data;
  if (habits.length === 0) return { status: 'empty', city };

  const hours = forecastQuery.data;
  const now = options.now ?? nowInTimezone(city.timezone);

  return {
    status: 'ready',
    city,
    now,
    suggestions: getTodaySuggestions(habits, hours, now),
    todayHours: splitByLocalDay(hours, now).today,
    refresh: () => void queryClient.invalidateQueries({ queryKey: ['forecast', city.id] }),
    isRefreshing: forecastQuery.isRefetching,
  };
}
