import { useQuery, useQueryClient } from '@tanstack/react-query';

import { nowInTimezone } from '@/data/time/nowInTimezone';
import { useContainer } from '@/di/ContainerProvider';
import type { City } from '@/domain/entities/city';
import type { ComfortScore } from '@/domain/entities/comfortScore';
import type { HourlyForecast } from '@/domain/entities/hourlyForecast';
import { DEFAULT_USER_PREFERENCES } from '@/domain/entities/preferences';
import type { Recommendation } from '@/domain/entities/recommendation';
import type { ComfortScoringParams } from '@/domain/usecases/computeComfortScore';
import { computeComfortScore, DEFAULT_COMFORT_PARAMS } from '@/domain/usecases/computeComfortScore';
import { splitByLocalDay } from '@/domain/usecases/localDay';
import type { ScoringProfile } from '@/domain/usecases/recommendBestWindow';
import { DEFAULT_SCORING_PROFILE, recommendBestWindow } from '@/domain/usecases/recommendBestWindow';
import { resolveComfortProfile } from '@/domain/usecases/resolveComfortProfile';
import { mapErrorToMessage } from '@/presentation/i18n/errorMessages';

import { usePreferences } from './usePreferences';

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

/** Também usada pelos cards do painel Hoje (timeline expansível por hábito). */
export function buildTimeline(
  hours: HourlyForecast[],
  now: Date,
  recommendation: Recommendation,
  params: ComfortScoringParams = DEFAULT_COMFORT_PARAMS,
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
      score: computeComfortScore(hour, params),
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
  const stored = usePreferences();

  const query = useQuery({
    queryKey: ['forecast', city.id],
    queryFn: () => container.getForecast(city),
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

  // Perfil pessoal puro (§4.3): a recomendação genérica não tem intensidade.
  // O default cobre a janela em que as preferências ainda estão carregando.
  const preferences = stored.preferences?.preferences ?? DEFAULT_USER_PREFERENCES;
  const profile = resolveComfortProfile(preferences);
  const scoringProfile: ScoringProfile = {
    ...DEFAULT_SCORING_PROFILE,
    ...profile,
    ...(preferences.sleep !== undefined ? { sleep: preferences.sleep } : {}),
  };

  const now = options.now ?? nowInTimezone(city.timezone);
  // Cerca do "hoje": com rotina de sono, o ciclo acordado (que pode cruzar a
  // meia-noite) — o motor recorta. Sem rotina, o dia local: o forecast traz
  // 2 dias (hábitos) e, sem o recorte, o motor genérico recomendaria amanhã
  // de manhã em vez do guard "dia acabou" (§5.2 do SPECS original).
  const hours =
    preferences.sleep !== undefined ? query.data : splitByLocalDay(query.data, now).today;
  const recommendation = recommendBestWindow(hours, now, scoringProfile);

  return {
    status: 'success',
    recommendation,
    timeline: buildTimeline(hours, now, recommendation, profile),
    windowDetails: buildWindowDetails(hours, recommendation),
    refresh: () =>
      void queryClient.invalidateQueries({ queryKey: ['forecast', city.id] }),
    isRefreshing: query.isRefetching,
  };
}
