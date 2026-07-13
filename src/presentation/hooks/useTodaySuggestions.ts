import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { LocationPermission } from '@/data/datasources/locationClient';
import { nowInTimezone } from '@/data/time/nowInTimezone';
import { useContainer } from '@/di/ContainerProvider';
import type { City } from '@/domain/entities/city';
import type { HabitSuggestion } from '@/domain/entities/clothing';
import type { CurrentConditions } from '@/domain/entities/currentConditions';
import type { HourlyForecast } from '@/domain/entities/hourlyForecast';
import type { Recommendation } from '@/domain/entities/recommendation';
import { getCurrentConditions } from '@/domain/usecases/getCurrentConditions';
import { getTodaySuggestions } from '@/domain/usecases/getTodaySuggestions';
import { splitByLocalDay } from '@/domain/usecases/localDay';
import { recommendBestWindow } from '@/domain/usecases/recommendBestWindow';
import { mapErrorToMessage } from '@/presentation/i18n/errorMessages';

import { useResolvedCity } from './useResolvedCity';

/** Mesmo staleTime do fluxo de recomendação (§4.3) — cache compartilhado. */
const FORECAST_STALE_TIME_MS = 5 * 60 * 1000;

/** Clima resumido do card da home: condição de agora + melhor janela de hoje. */
export type PanelWeather = {
  current: CurrentConditions | null;
  bestWindow: Recommendation;
};

export type TodaySuggestionsViewModel =
  | { status: 'loading' }
  | {
      status: 'no-city';
      /** Estado da permissão de GPS para a UI de fallback (null = ainda resolvendo). */
      locationStatus: LocationPermission | null;
      requestLocation: () => void;
    }
  | { status: 'error'; city: City; errorMessage: string; retry: () => void }
  | {
      status: 'empty';
      city: City;
      now: Date;
      /** Clima da cidade mesmo sem hábitos — o card sempre aparece. */
      weather: PanelWeather;
      refresh: () => void;
      isRefreshing: boolean;
    }
  | {
      status: 'ready';
      city: City;
      now: Date;
      suggestions: HabitSuggestion[];
      /** Horas restantes de hoje — timeline expansível dos cards de janela. */
      todayHours: HourlyForecast[];
      weather: PanelWeather;
      refresh: () => void;
      isRefreshing: boolean;
    };

type Options = {
  /** Injetável nos testes; produção usa o relógio da cidade resolvida. */
  now?: Date;
};

/**
 * ViewModel do painel "Hoje" (§8.2): cidade resolvida (GPS sobrepõe a padrão)
 * + hábitos + forecast de 2 dias → clima do card e sugestões ordenadas. O card
 * de clima aparece sempre que há cidade, mesmo sem hábitos. Pull-to-refresh
 * invalida só o forecast.
 */
export function useTodaySuggestions(options: Options = {}): TodaySuggestionsViewModel {
  const container = useContainer();
  const queryClient = useQueryClient();
  const resolved = useResolvedCity();
  const city = resolved.city;

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

  if (resolved.isLoading) return { status: 'loading' };
  if (city === null) {
    return {
      status: 'no-city',
      locationStatus: resolved.locationStatus,
      requestLocation: resolved.requestLocation,
    };
  }
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

  const hours = forecastQuery.data;
  const now = options.now ?? nowInTimezone(city.timezone);
  const todayHours = splitByLocalDay(hours, now).today;
  const weather: PanelWeather = {
    current: getCurrentConditions(todayHours, now),
    bestWindow: recommendBestWindow(todayHours, now),
  };
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['forecast', city.id] });

  const habits = habitsQuery.data;
  if (habits.length === 0) {
    return {
      status: 'empty',
      city,
      now,
      weather,
      refresh,
      isRefreshing: forecastQuery.isRefetching,
    };
  }

  return {
    status: 'ready',
    city,
    now,
    suggestions: getTodaySuggestions(habits, hours, now),
    todayHours,
    weather,
    refresh,
    isRefreshing: forecastQuery.isRefetching,
  };
}
