import type { UserPreferences } from '../entities/preferences';
import { awakeDurationMinutes } from './awakeWindow';

/** Limites do modo personalizado (§3). */
const TEMP_MIN_C = -10;
const TEMP_MAX_C = 45;
const TEMP_SPAN_MIN_C = 4;
const HUMIDITY_MIN = 40;
const HUMIDITY_MAX = 100;
const WIND_MIN_KMH = 5;
const WIND_MAX_KMH = 60;

/** Janela acordada mínima (§3): proteção contra erro de digitação. */
const MIN_AWAKE_MINUTES = 6 * 60;

/** Campo do formulário ao qual o erro pertence (validação inline nas etapas). */
export type PreferencesValidationField = 'tempRange' | 'humidity' | 'wind' | 'sleep';

export type PreferencesValidationError = {
  field: PreferencesValidationField;
  message: string;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Valida as preferências (§3). Lista vazia = válido. Também protege contra
 * dados corrompidos do storage: valores fora dos limites viram erro de
 * validação, nunca crash.
 */
export function validatePreferences(preferences: UserPreferences): PreferencesValidationError[] {
  const errors: PreferencesValidationError[] = [];

  if (preferences.comfort.kind === 'custom') {
    const { idealTempRange, maxHumidity, maxWind } = preferences.comfort;
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
  }

  if (preferences.sleep !== undefined) {
    const { wakeTime, sleepTime } = preferences.sleep;

    if (!TIME_PATTERN.test(wakeTime) || !TIME_PATTERN.test(sleepTime)) {
      errors.push({ field: 'sleep', message: 'Horário inválido (use o formato HH:mm).' });
    } else if (wakeTime === sleepTime) {
      errors.push({
        field: 'sleep',
        message: 'Os horários de acordar e dormir precisam ser diferentes.',
      });
    } else if (awakeDurationMinutes(preferences.sleep) < MIN_AWAKE_MINUTES) {
      errors.push({
        field: 'sleep',
        message:
          'Essa rotina deixa menos de 6 horas de dia acordado — confira se os horários não estão trocados.',
      });
    }
  }

  return errors;
}
