import type { HourlyForecast } from '../entities/hourlyForecast';
import type { SleepSchedule } from '../entities/preferences';
import type { AwakeCycle } from './awakeWindow';
import { currentAwakeCycle, isWithinAwakeCycle } from './awakeWindow';
import type { ComfortScoringParams } from './computeComfortScore';
import { computeComfortScore, DEFAULT_COMFORT_PARAMS } from './computeComfortScore';
import { sameLocalDay, splitByLocalDay } from './localDay';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Restrições de horário do hábito, quando houver ("HH:mm"). */
export type PreviewBounds = {
  earliest?: string;
  latest?: string;
};

export type NextCyclePreviewInput = {
  /** Forecast de até 2 dias, no frame fake-UTC do motor. */
  hours: readonly HourlyForecast[];
  now: Date;
  /** Presente = a elegibilidade segue a janela acordada em vez de `isDay`. */
  sleep?: SleepSchedule;
  params?: ComfortScoringParams;
  bounds?: PreviewBounds;
};

/** Primeira hora aproveitável do próximo ciclo, com os números para a frase. */
export type NextCyclePreview = {
  /** Hora cheia local em que as sugestões voltam (ex.: 7 para 07:00). */
  startHour: number;
  /** Sensação térmica arredondada. */
  temp: number;
  /** Probabilidade de chuva arredondada, 0–100. */
  precipitationProb: number;
};

/** "HH:mm" → minutos desde a meia-noite local. */
function parseMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function withinBounds(hour: HourlyForecast, bounds: PreviewBounds | undefined): boolean {
  if (!bounds) return true;
  const minutes = hour.time.getUTCHours() * 60 + hour.time.getUTCMinutes();
  if (bounds.earliest !== undefined && minutes < parseMinutes(bounds.earliest)) return false;
  if (bounds.latest !== undefined && minutes + 60 > parseMinutes(bounds.latest)) return false;
  return true;
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
 * Prévia do próximo ciclo (§6.2): a primeira hora aproveitável depois que o
 * dia de hoje acabou — com rotina de sono, a primeira do ciclo seguinte; sem
 * rotina, a primeira hora de dia de amanhã. Devolve `null` quando o forecast
 * não alcança nenhuma hora utilizável, para a UI não prometer o que não sabe.
 *
 * Alimenta tanto a razão do `no-slot` dos hábitos quanto a guarda da tela de
 * recomendação, que precisam da mesma informação.
 */
export function nextCyclePreview({
  hours,
  now,
  sleep,
  params = DEFAULT_COMFORT_PARAMS,
  bounds,
}: NextCyclePreviewInput): NextCyclePreview | null {
  const upcoming =
    sleep !== undefined ? nextCycleHours(hours, now, sleep) : splitByLocalDay(hours, now).tomorrow;

  const candidate = upcoming.find(
    (hour) =>
      (sleep !== undefined || hour.isDay) &&
      withinBounds(hour, bounds) &&
      computeComfortScore(hour, params) !== null,
  );
  if (!candidate || candidate.apparentTemp === null) return null;

  return {
    startHour: candidate.time.getUTCHours(),
    temp: Math.round(candidate.apparentTemp),
    precipitationProb: Math.round(candidate.precipitationProb ?? 0),
  };
}
