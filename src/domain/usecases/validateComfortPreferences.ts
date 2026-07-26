import type { ComfortPreferences } from '../entities/preferences';

/** Limites do modo personalizado (§3). Exportados: a UI dos campos numéricos
 *  usa os mesmos valores como `min`/`max`, em vez de repetir o número. */
export const TEMP_MIN_C = -10;
export const TEMP_MAX_C = 45;
/** Amplitude mínima da faixa ideal, em °C. */
export const TEMP_SPAN_MIN_C = 4;
export const HUMIDITY_MIN = 40;
export const HUMIDITY_MAX = 100;
export const WIND_MIN_KMH = 5;
export const WIND_MAX_KMH = 60;

/** Campo do formulário ao qual o erro pertence (validação inline nas etapas). */
export type ComfortValidationField = 'tempRange' | 'humidity' | 'wind';

export type ComfortValidationError = {
  field: ComfortValidationField;
  message: string;
};

/**
 * Valida o perfil de conforto (§3). Lista vazia = válido. Um preset é sempre
 * válido; o modo personalizado precisa respeitar os limites acima.
 *
 * Vive separado do resto das preferências porque a mesma regra vale para o
 * perfil global e para o conforto de um hábito específico — duplicá-la seria
 * garantir que os dois fluxos divergissem.
 */
export function validateComfortPreferences(
  comfort: ComfortPreferences,
): ComfortValidationError[] {
  if (comfort.kind === 'preset') return [];

  const errors: ComfortValidationError[] = [];
  const { idealTempRange, maxHumidity, maxWind } = comfort;
  const [min, max] = idealTempRange;

  if (min < TEMP_MIN_C || max > TEMP_MAX_C || min >= max) {
    errors.push({
      field: 'tempRange',
      message: `A faixa de temperatura precisa estar entre ${TEMP_MIN_C} °C e ${TEMP_MAX_C} °C, do menor para o maior.`,
    });
  } else if (max - min < TEMP_SPAN_MIN_C) {
    errors.push({
      field: 'tempRange',
      message: `A faixa precisa ter pelo menos ${TEMP_SPAN_MIN_C} °C de amplitude.`,
    });
  }

  if (maxHumidity < HUMIDITY_MIN || maxHumidity > HUMIDITY_MAX) {
    errors.push({
      field: 'humidity',
      message: `O limite de umidade precisa estar entre ${HUMIDITY_MIN}% e ${HUMIDITY_MAX}%.`,
    });
  }

  if (maxWind < WIND_MIN_KMH || maxWind > WIND_MAX_KMH) {
    errors.push({
      field: 'wind',
      message: `O limite de vento precisa estar entre ${WIND_MIN_KMH} e ${WIND_MAX_KMH} km/h.`,
    });
  }

  return errors;
}
