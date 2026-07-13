import type { CurrentConditions } from '../entities/currentConditions';
import type { HourlyForecast } from '../entities/hourlyForecast';
import { computeComfortScore } from './computeComfortScore';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Condição de "agora": a hora do forecast cujo início casa com o relógio atual
 * da cidade (`now` no frame "wall-clock da cidade"). Devolve `null` quando o
 * forecast não cobre a hora corrente (ex.: dados só de horas passadas), sem
 * inventar leitura.
 *
 * `hours` e `now` devem estar no MESMO referencial de tempo, como no motor de
 * recomendação — comparação por epoch, sem depender do timezone do device.
 */
export function getCurrentConditions(
  hours: readonly HourlyForecast[],
  now: Date,
): CurrentConditions | null {
  const currentHourStart = Math.floor(now.getTime() / HOUR_MS) * HOUR_MS;
  const hour = hours.find((h) => h.time.getTime() === currentHourStart);
  if (hour === undefined) return null;
  return { hour, score: computeComfortScore(hour) };
}
