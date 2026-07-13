import type { ComfortScore } from './comfortScore';
import type { HourlyForecast } from './hourlyForecast';

/**
 * Condição climática "de agora": a hora do forecast que casa com o relógio
 * atual da cidade, já com o score de conforto calculado. Alimenta o card de
 * clima da home (§ melhoria da tela inicial).
 */
export type CurrentConditions = {
  hour: HourlyForecast;
  /** `null` quando a hora tem dados faltantes da API (mesmo tratamento do motor). */
  score: ComfortScore | null;
};
