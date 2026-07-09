import type { HourlyForecast } from '../entities/hourlyForecast';
import type { Weekday } from '../entities/habit';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Helpers de "dia local" no frame fake-UTC do app (wall-clock da cidade
 * codificado como UTC): comparar componentes UTC É comparar o calendário
 * local da cidade, sem depender do timezone do device.
 */

export function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Dia da semana local (0 = domingo), no frame fake-UTC. */
export function weekdayOf(date: Date): Weekday {
  return date.getUTCDay() as Weekday;
}

export type SplitForecast = {
  today: HourlyForecast[];
  tomorrow: HourlyForecast[];
};

/**
 * Separa um forecast de até 2 dias em hoje/amanhã relativos a `now`.
 * Horas de outros dias (cache velho, payload inesperado) são descartadas.
 */
export function splitByLocalDay(hours: readonly HourlyForecast[], now: Date): SplitForecast {
  const tomorrowRef = new Date(now.getTime() + DAY_MS);
  return {
    today: hours.filter((hour) => sameLocalDay(hour.time, now)),
    tomorrow: hours.filter((hour) => sameLocalDay(hour.time, tomorrowRef)),
  };
}
