import type { FlexibleSchedule, Habit } from '../entities/habit';
import type { HourlyForecast } from '../entities/hourlyForecast';
import type { UserPreferences } from '../entities/preferences';
import { DEFAULT_USER_PREFERENCES } from '../entities/preferences';
import type { Recommendation } from '../entities/recommendation';
import { splitByLocalDay } from './localDay';
import { nextCyclePreview } from './nextCyclePreview';
import type { ScoringProfile } from './recommendBestWindow';
import { recommendBestWindow } from './recommendBestWindow';
import { resolveComfortProfile } from './resolveComfortProfile';

/** Resultado para hábitos de horário livre: janela ou impossibilidade com razão. */
export type HabitWindowResult =
  | Extract<Recommendation, { kind: 'window' }>
  | { kind: 'no-slot'; reason: string };

/**
 * Duração do hábito → janela em horas cheias (§6): a granularidade da API é
 * horária, então 30/60 min viram 1 h e 90/120 min viram 2 h.
 */
function windowHoursFor(durationMinutes: FlexibleSchedule['durationMinutes']): {
  min: number;
  max: number;
} {
  const hours = durationMinutes <= 60 ? 1 : 2;
  return { min: hours, max: hours };
}

/**
 * Perfil do hábito (§4.3): preferências → perfil pessoal → modificador de
 * intensidade, mais janela/bounds do hábito e a rotina de sono da pessoa.
 * Bounds e janela acordada se intersectam naturalmente — a mais restritiva
 * vence, porque os dois filtros de elegibilidade se aplicam.
 */
function profileFor(
  habit: Habit,
  schedule: FlexibleSchedule,
  preferences: UserPreferences,
): ScoringProfile {
  return {
    ...resolveComfortProfile(preferences, habit.intensity),
    windowHours: windowHoursFor(schedule.durationMinutes),
    ...(schedule.earliest !== undefined || schedule.latest !== undefined
      ? {
          bounds: {
            ...(schedule.earliest !== undefined ? { earliest: schedule.earliest } : {}),
            ...(schedule.latest !== undefined ? { latest: schedule.latest } : {}),
          },
        }
      : {}),
    ...(preferences.sleep !== undefined ? { sleep: preferences.sleep } : {}),
  };
}

/** "6h–8h" para a razão do no-slot, a partir dos bounds do hábito. */
function boundsLabel(schedule: FlexibleSchedule): string | null {
  if (schedule.earliest === undefined || schedule.latest === undefined) return null;
  const hour = (time: string) => `${Number(time.split(':')[0])}h`;
  return `${hour(schedule.earliest)}–${hour(schedule.latest)}`;
}

/**
 * Frase da prévia na razão do no-slot. Com rotina de sono o texto segue o
 * §6.2 ("Amanhã a partir das {acordar}: …"); sem rotina, a forma original.
 */
function previewSentence(
  hours: readonly HourlyForecast[],
  now: Date,
  profile: ScoringProfile,
  hasSleep: boolean,
): string | null {
  const preview = nextCyclePreview({
    hours,
    now,
    params: profile,
    ...(profile.sleep !== undefined ? { sleep: profile.sleep } : {}),
    ...(profile.bounds !== undefined ? { bounds: profile.bounds } : {}),
  });
  if (preview === null) return null;

  const { startHour, temp, precipitationProb } = preview;
  const rain = precipitationProb < 20 ? 'sem chuva' : `${precipitationProb}% de chuva`;
  return hasSleep
    ? `Amanhã a partir das ${startHour}h: ${temp} °C, ${rain}.`
    : `Amanhã: ${startHour}h, ${temp} °C, ${rain}.`;
}

/**
 * Melhor janela de HOJE para um hábito de horário livre (§6). Recebe o
 * forecast de até 2 dias: "hoje" é o dia local — ou o ciclo acordado corrente,
 * quando a pessoa configurou rotina de sono; amanhã só entra como prévia na
 * razão quando nenhuma janela é possível hoje.
 *
 * `day-over`, bounds impossíveis e falta de dados colapsam em `no-slot` com
 * razões distintas — para o painel, tudo é "sem janela hoje, e aqui está o
 * porquê".
 */
export function recommendBestWindowForHabit(
  hours: readonly HourlyForecast[],
  now: Date,
  habit: Habit,
  preferences: UserPreferences = DEFAULT_USER_PREFERENCES,
): HabitWindowResult {
  if (habit.schedule.kind !== 'flexible') {
    return { kind: 'no-slot', reason: 'Hábito de horário fixo não usa janela recomendada.' };
  }

  const schedule = habit.schedule;
  const profile = profileFor(habit, schedule, preferences);
  const sleep = preferences.sleep;

  // Com rotina de sono a cerca é o próprio ciclo acordado (que pode cruzar a
  // meia-noite); o motor recorta. Sem rotina, a cerca segue o dia local.
  const today = splitByLocalDay(hours, now).today;
  const result = recommendBestWindow(sleep !== undefined ? hours : today, now, profile);
  if (result.kind === 'window') {
    return result;
  }

  const preview = previewSentence(hours, now, profile, sleep !== undefined);
  const label = boundsLabel(schedule);

  let base: string;
  if (result.kind === 'no-data') {
    base = 'A previsão de hoje veio sem dados utilizáveis.';
  } else if (label !== null) {
    base = `Sua janela é ${label} e já passou hoje.`;
  } else if (sleep !== undefined) {
    base = 'Por hoje é isso!';
  } else {
    base = 'O dia já está acabando por aí.';
  }

  return { kind: 'no-slot', reason: preview ? `${base} ${preview}` : base };
}
