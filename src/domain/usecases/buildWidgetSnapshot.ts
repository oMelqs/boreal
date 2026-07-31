import type { City } from '../entities/city';
import type { HabitSuggestion } from '../entities/clothing';
import type { Habit } from '../entities/habit';
import type { HourlyForecast } from '../entities/hourlyForecast';
import type { UserPreferences } from '../entities/preferences';
import { DEFAULT_USER_PREFERENCES } from '../entities/preferences';
import type {
  WidgetHabit,
  WidgetHour,
  WidgetSnapshot,
  WidgetTimeRange,
} from '../entities/widgetSnapshot';
import { WIDGET_SCHEMA_VERSION } from '../entities/widgetSnapshot';
import { currentAwakeCycle, isWithinAwakeCycle } from './awakeWindow';
import { getTodaySuggestions } from './getTodaySuggestions';
import { resolveComfortProfile } from './resolveComfortProfile';
import { suggestOutfit } from './suggestOutfit';

/** Quantas horas à frente o painel médio/grande mostra (§6.1). */
const DEFAULT_HOURS_AHEAD = 6;

export type BuildWidgetSnapshotInput = {
  city: City;
  forecast: readonly HourlyForecast[];
  habits: readonly Habit[];
  preferences?: UserPreferences;
  /** Agora no relógio da cidade (frame fake-UTC), como o resto do motor. */
  now: Date;
  /** Instante real da geração — injetado para o use case seguir determinístico. */
  generatedAt: Date;
  hoursAhead?: number;
};

/** Hora cheia do forecast que cobre `now`. */
function hourAt(forecast: readonly HourlyForecast[], now: Date): HourlyForecast | undefined {
  return forecast.find(
    (hour) =>
      hour.time.getUTCFullYear() === now.getUTCFullYear() &&
      hour.time.getUTCMonth() === now.getUTCMonth() &&
      hour.time.getUTCDate() === now.getUTCDate() &&
      hour.time.getUTCHours() === now.getUTCHours(),
  );
}

/** Próximas horas com dado utilizável, a partir da hora corrente. */
function nextHours(
  forecast: readonly HourlyForecast[],
  now: Date,
  hoursAhead: number,
): WidgetHour[] {
  return forecast
    .filter((hour) => hour.time.getTime() >= now.getTime() && hour.temp !== null)
    .slice(0, hoursAhead)
    .map((hour) => ({
      hour: hour.time.getUTCHours(),
      temp: Math.round(hour.temp as number),
      rainProb: hour.precipitationProb ?? 0,
      weatherCode: hour.weatherCode,
      isDay: hour.isDay,
    }));
}

function timeRangeOf(suggestion: HabitSuggestion): WidgetTimeRange {
  if (suggestion.kind === 'window' && suggestion.recommendation.kind === 'window') {
    return {
      kind: 'window',
      startHour: suggestion.recommendation.start.getUTCHours(),
      endHour: suggestion.recommendation.end.getUTCHours(),
    };
  }
  const { schedule } = suggestion.habit;
  return schedule.kind === 'fixed'
    ? { kind: 'fixed', startTime: schedule.startTime, endTime: schedule.endTime }
    : { kind: 'none' };
}

/** `HabitSuggestion` (com Date e entities) → item achatado do widget. */
function toWidgetHabit(suggestion: HabitSuggestion): WidgetHabit {
  const { habit } = suggestion;
  const common = {
    id: habit.id,
    name: habit.name,
    when: suggestion.kind === 'no-slot' ? ('hoje' as const) : suggestion.when,
    ownComfort: habit.comfortOverride !== undefined,
    timeRange: timeRangeOf(suggestion),
  };

  if (suggestion.kind === 'clothing') {
    const { outfit, accessories, summary } = suggestion.suggestion;
    return { ...common, kind: 'clothing', outfit: { level: outfit, accessories, summary } };
  }

  if (suggestion.kind === 'no-slot') {
    return { ...common, kind: 'no-slot', reason: suggestion.reason };
  }

  if (suggestion.kind === 'info') {
    return { ...common, kind: 'info' };
  }

  const { recommendation } = suggestion;
  if (recommendation.kind !== 'window') {
    // O orquestrador converte os demais casos em no-slot; guarda de tipo.
    return { ...common, kind: 'info' };
  }
  return {
    ...common,
    kind: 'window',
    score: recommendation.averageScore,
    reasons: [...recommendation.reasons],
    ...(recommendation.caveat !== undefined ? { caveat: recommendation.caveat } : {}),
  };
}

/**
 * Monta o payload do widget (§5.2 do SPECS-WIDGET) compondo os motores que já
 * existem — nenhuma regra nova mora aqui. O widget é uma projeção do painel
 * "Hoje", não um segundo cálculo: é o que garante que os dois digam a mesma
 * coisa no mesmo instante.
 *
 * A vestimenta de "agora" trata sair de casa como exposição leve ao ar livre
 * (`intensity: 'leve'`, `outdoor: true`) com o `tempOffset` do perfil global:
 * é a pergunta "o que visto para sair", sem hábito nenhum no contexto.
 *
 * Fora do ciclo acordado, `now.outfit` é `null` — de madrugada o widget avisa
 * que o dia acabou em vez de sugerir roupa para quem está dormindo.
 */
export function buildWidgetSnapshot(input: BuildWidgetSnapshotInput): WidgetSnapshot {
  const {
    city,
    forecast,
    habits,
    preferences = DEFAULT_USER_PREFERENCES,
    now,
    generatedAt,
    hoursAhead = DEFAULT_HOURS_AHEAD,
  } = input;

  const currentHour = hourAt(forecast, now);
  const sleep = preferences.sleep;
  const awake = sleep === undefined || isWithinAwakeCycle(now, currentAwakeCycle(now, sleep));

  const { tempOffset } = resolveComfortProfile(preferences);
  const clothing =
    awake && currentHour
      ? suggestOutfit({ atStart: currentHour, intensity: 'leve', outdoor: true, tempOffset })
      : null;

  const widgetHabits = getTodaySuggestions(habits, forecast, now, preferences).map(toWidgetHabit);

  return {
    schemaVersion: WIDGET_SCHEMA_VERSION,
    generatedAt: generatedAt.toISOString(),
    cityName: city.name,
    now: {
      temp: Math.round(currentHour?.temp ?? 0),
      apparentTemp: Math.round(currentHour?.apparentTemp ?? 0),
      weatherCode: currentHour?.weatherCode ?? null,
      isDay: currentHour?.isDay ?? false,
      outfit: clothing
        ? {
            level: clothing.outfit,
            accessories: clothing.accessories,
            summary: clothing.summary,
          }
        : null,
    },
    hours: nextHours(forecast, now, hoursAhead),
    nextHabit: widgetHabits[0] ?? null,
    habits: widgetHabits,
  };
}
