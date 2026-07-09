import type { FlexibleSchedule, Habit } from '../entities/habit';
import type { HourlyForecast } from '../entities/hourlyForecast';
import type { Recommendation } from '../entities/recommendation';
import { computeComfortScore } from './computeComfortScore';
import { INTENSITY_PROFILES } from './habitScoringProfiles';
import { splitByLocalDay } from './localDay';
import type { ScoringProfile } from './recommendBestWindow';
import { recommendBestWindow } from './recommendBestWindow';

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

function profileFor(habit: Habit, schedule: FlexibleSchedule): ScoringProfile {
  return {
    ...INTENSITY_PROFILES[habit.intensity],
    windowHours: windowHoursFor(schedule.durationMinutes),
    ...(schedule.earliest !== undefined || schedule.latest !== undefined
      ? {
          bounds: {
            ...(schedule.earliest !== undefined ? { earliest: schedule.earliest } : {}),
            ...(schedule.latest !== undefined ? { latest: schedule.latest } : {}),
          },
        }
      : {}),
  };
}

/** "6h–8h" para a razão do no-slot, a partir dos bounds do hábito. */
function boundsLabel(schedule: FlexibleSchedule): string | null {
  if (schedule.earliest === undefined || schedule.latest === undefined) return null;
  const hour = (time: string) => `${Number(time.split(':')[0])}h`;
  return `${hour(schedule.earliest)}–${hour(schedule.latest)}`;
}

/**
 * Prévia da primeira hora de amanhã elegível para o hábito (dia, dados e
 * bounds): "Amanhã: 6h, 18 °C, sem chuva." — usada na razão do no-slot.
 */
function tomorrowPreview(tomorrow: HourlyForecast[], profile: ScoringProfile): string | null {
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
      hour.isDay && withinBounds(hour) && computeComfortScore(hour, profile) !== null,
  );
  if (!candidate || candidate.apparentTemp === null) return null;

  const temp = Math.round(candidate.apparentTemp);
  const prob = Math.round(candidate.precipitationProb ?? 0);
  const rain = prob < 20 ? 'sem chuva' : `${prob}% de chuva`;
  return `Amanhã: ${candidate.time.getUTCHours()}h, ${temp} °C, ${rain}.`;
}

/**
 * Melhor janela de HOJE para um hábito de horário livre (§6). Recebe o
 * forecast de até 2 dias: hoje alimenta o motor; amanhã só entra como prévia
 * na razão quando nenhuma janela é possível hoje.
 *
 * `day-over`, bounds impossíveis e falta de dados colapsam em `no-slot` com
 * razões distintas — para o painel, tudo é "sem janela hoje, e aqui está o
 * porquê".
 */
export function recommendBestWindowForHabit(
  hours: readonly HourlyForecast[],
  now: Date,
  habit: Habit,
): HabitWindowResult {
  if (habit.schedule.kind !== 'flexible') {
    return { kind: 'no-slot', reason: 'Hábito de horário fixo não usa janela recomendada.' };
  }

  const schedule = habit.schedule;
  const profile = profileFor(habit, schedule);
  const { today, tomorrow } = splitByLocalDay(hours, now);

  const result = recommendBestWindow(today, now, profile);
  if (result.kind === 'window') {
    return result;
  }

  const preview = tomorrowPreview(tomorrow, profile);
  const label = boundsLabel(schedule);

  let base: string;
  if (result.kind === 'no-data') {
    base = 'A previsão de hoje veio sem dados utilizáveis.';
  } else if (label !== null) {
    base = `Sua janela é ${label} e já passou hoje.`;
  } else {
    base = 'O dia já está acabando por aí.';
  }

  return { kind: 'no-slot', reason: preview ? `${base} ${preview}` : base };
}
