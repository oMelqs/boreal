import type { FlexibleSchedule, Habit } from '../entities/habit';
import type { HourlyForecast } from '../entities/hourlyForecast';
import type { SleepSchedule, UserPreferences } from '../entities/preferences';
import { DEFAULT_USER_PREFERENCES } from '../entities/preferences';
import type { Recommendation } from '../entities/recommendation';
import type { AwakeCycle } from './awakeWindow';
import { currentAwakeCycle, isWithinAwakeCycle } from './awakeWindow';
import { computeComfortScore } from './computeComfortScore';
import { sameLocalDay, splitByLocalDay } from './localDay';
import type { ScoringProfile } from './recommendBestWindow';
import { recommendBestWindow } from './recommendBestWindow';
import { resolveComfortProfile } from './resolveComfortProfile';

const DAY_MS = 24 * 60 * 60 * 1000;

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
 * Horas do próximo ciclo acordado (a "manhã seguinte" de quem tem rotina):
 * o ciclo corrente deslocado um dia — ou o próprio ciclo devolvido por
 * `currentAwakeCycle` quando ele já é o de amanhã (consulta pós-sono).
 */
function nextCycleHours(
  hours: readonly HourlyForecast[],
  now: Date,
  sleep: SleepSchedule,
): HourlyForecast[] {
  const cycle = currentAwakeCycle(now, sleep);
  const startsTomorrow =
    cycle.start.getTime() > now.getTime() && !sameLocalDay(cycle.start, now);
  const next: AwakeCycle = startsTomorrow
    ? cycle
    : {
        start: new Date(cycle.start.getTime() + DAY_MS),
        end: new Date(cycle.end.getTime() + DAY_MS),
      };
  return hours.filter((hour) => isWithinAwakeCycle(hour.time, next));
}

/**
 * Prévia da primeira hora de amanhã elegível para o hábito (dados, bounds e
 * dia/janela acordada) — usada na razão do no-slot. Com rotina de sono, o
 * texto segue o §6.2: "Amanhã a partir das {acordar}: …".
 */
function tomorrowPreview(
  tomorrow: readonly HourlyForecast[],
  profile: ScoringProfile,
  hasSleep: boolean,
): string | null {
  const withinBounds = (hour: HourlyForecast): boolean => {
    const minutes = hour.time.getUTCHours() * 60 + hour.time.getUTCMinutes();
    const parse = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    if (profile.bounds?.earliest !== undefined && minutes < parse(profile.bounds.earliest)) {
      return false;
    }
    if (profile.bounds?.latest !== undefined && minutes + 60 > parse(profile.bounds.latest)) {
      return false;
    }
    return true;
  };

  const candidate = tomorrow.find(
    (hour) =>
      (hasSleep || hour.isDay) &&
      withinBounds(hour) &&
      computeComfortScore(hour, profile) !== null,
  );
  if (!candidate || candidate.apparentTemp === null) return null;

  const startHour = candidate.time.getUTCHours();
  const temp = Math.round(candidate.apparentTemp);
  const prob = Math.round(candidate.precipitationProb ?? 0);
  const rain = prob < 20 ? 'sem chuva' : `${prob}% de chuva`;
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
  const { today, tomorrow } = splitByLocalDay(hours, now);

  // Com rotina de sono a cerca é o próprio ciclo acordado (que pode cruzar a
  // meia-noite); o motor recorta. Sem rotina, a cerca segue o dia local.
  const result = recommendBestWindow(sleep !== undefined ? hours : today, now, profile);
  if (result.kind === 'window') {
    return result;
  }

  const previewHours = sleep !== undefined ? nextCycleHours(hours, now, sleep) : tomorrow;
  const preview = tomorrowPreview(previewHours, profile, sleep !== undefined);
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
