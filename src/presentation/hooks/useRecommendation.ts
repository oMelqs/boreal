import { useQuery, useQueryClient } from '@tanstack/react-query';

import { nowInTimezone } from '@/data/time/nowInTimezone';
import { useContainer } from '@/di/ContainerProvider';
import type { City } from '@/domain/entities/city';
import type { ComfortScore } from '@/domain/entities/comfortScore';
import type { HourlyForecast } from '@/domain/entities/hourlyForecast';
import type { Recommendation } from '@/domain/entities/recommendation';
import { computeComfortScore } from '@/domain/usecases/computeComfortScore';
import { recommendBestWindow } from '@/domain/usecases/recommendBestWindow';
import { mapErrorToMessage } from '@/presentation/i18n/errorMessages';

/** Forecast fica fresco por 5 minutos (§4.3). */
const FORECAST_STALE_TIME_MS = 5 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Célula da timeline: hora restante do dia com contexto visual do score. */
export type TimelineHour = {
  time: Date;
  temp: number | null;
  weatherCode: number | null;
  isDay: boolean;
  score: ComfortScore | null;
  isNow: boolean;
  inWindow: boolean;
};

/** Números agregados da janela recomendada para o grid de detalhes. */
export type WindowDetails = {
  apparentTemp: number;
  precipitationProb: number;
  windSpeed: number;
  maxUv: number;
};

export type RecommendationViewModel =
  | { status: 'loading' }
  | { status: 'error'; errorMessage: string; retry: () => void }
  | {
      status: 'success';
      recommendation: Recommendation;
      timeline: TimelineHour[];
      windowDetails: WindowDetails | null;
      refresh: () => void;
      isRefreshing: boolean;
    };

type Options = {
  /** Injetável nos testes; produção usa o relógio da cidade. */
  now?: Date;
};

function buildTimeline(
  hours: HourlyForecast[],
  now: Date,
  recommendation: Recommendation,
): TimelineHour[] {
  const currentHourStart = Math.floor(now.getTime() / HOUR_MS) * HOUR_MS;
  const window = recommendation.kind === 'window' ? recommendation : null;

  return hours
    .filter((hour) => hour.time.getTime() >= currentHourStart)
    .sort((a, b) => a.time.getTime() - b.time.getTime())
    .map((hour) => ({
      time: hour.time,
      temp: hour.temp,
      weatherCode: hour.weatherCode,
      isDay: hour.isDay,
      score: computeComfortScore(hour),
      isNow: hour.time.getTime() === currentHourStart,
      inWindow:
        window !== null &&
        hour.time.getTime() >= window.start.getTime() &&
        hour.time.getTime() < window.end.getTime(),
    }));
}

function buildWindowDetails(
  hours: HourlyForecast[],
  recommendation: Recommendation,
): WindowDetails | null {
  if (recommendation.kind !== 'window') return null;
  const windowHours = hours.filter(
    (hour) =>
      hour.time.getTime() >= recommendation.start.getTime() &&
      hour.time.getTime() < recommendation.end.getTime(),
  );
  if (windowHours.length === 0) return null;

  const average = (pick: (hour: HourlyForecast) => number | null): number => {
    const values = windowHours
      .map(pick)
      .filter((value): value is number => value !== null);
    return values.length === 0
      ? 0
      : values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  return {
    apparentTemp: average((h) => h.apparentTemp),
    precipitationProb: average((h) => h.precipitationProb),
    windSpeed: average((h) => h.windSpeed),
    maxUv: Math.max(...windowHours.map((h) => h.uvIndex ?? 0)),
  };
}

/**
 * ViewModel da tela de recomendação: busca o forecast de hoje (cache por
 * cidade), roda o motor com o "agora" no relógio da cidade e deriva hero,
 * timeline e detalhes de uma vez. Skeleton apenas no primeiro load;
 * `refresh` invalida o cache (pull-to-refresh).
 */
export function useRecommendation(city: City, options: Options = {}): RecommendationViewModel {
  const container = useContainer();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['forecast', city.id],
    queryFn: () => container.getTodayForecast(city),
    staleTime: FORECAST_STALE_TIME_MS,
  });

  if (query.isPending) {
    return { status: 'loading' };
  }

  if (query.isError) {
    return {
      status: 'error',
      errorMessage: mapErrorToMessage(query.error),
      retry: () => void query.refetch(),
    };
  }

  const hours = query.data;
  const now = options.now ?? nowInTimezone(city.timezone);
  const recommendation = recommendBestWindow(hours, now);

  return {
    status: 'success',
    recommendation,
    timeline: buildTimeline(hours, now, recommendation),
    windowDetails: buildWindowDetails(hours, recommendation),
    refresh: () =>
      void queryClient.invalidateQueries({ queryKey: ['forecast', city.id] }),
    isRefreshing: query.isRefetching,
  };
}
