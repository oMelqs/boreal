import type { UserPreferences } from '../entities/preferences';
import { awakeDurationMinutes } from './awakeWindow';
import type { ComfortValidationField } from './validateComfortPreferences';
import { validateComfortPreferences } from './validateComfortPreferences';

/** Janela acordada mínima (§3): proteção contra erro de digitação. */
const MIN_AWAKE_MINUTES = 6 * 60;

/** Campo do formulário ao qual o erro pertence (validação inline das etapas). */
export type PreferencesValidationField = ComfortValidationField | 'sleep';

export type PreferencesValidationError = {
  field: PreferencesValidationField;
  message: string;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Valida as preferências (§3). Lista vazia = válido. Também protege contra
 * dados corrompidos do storage: valores fora dos limites viram erro de
 * validação, nunca crash.
 *
 * O perfil de conforto é validado por `validateComfortPreferences`, a mesma
 * função usada no conforto por hábito; aqui ficam só as regras de sono.
 */
export function validatePreferences(preferences: UserPreferences): PreferencesValidationError[] {
  const errors: PreferencesValidationError[] = [...validateComfortPreferences(preferences.comfort)];

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
