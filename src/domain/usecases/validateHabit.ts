import type { Habit } from '../entities/habit';

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 40;
const VALID_DURATIONS = [30, 60, 90, 120];

/** Campo do formulário ao qual o erro pertence (validação inline no onboarding). */
export type HabitValidationField = 'name' | 'days' | 'schedule';

export type HabitValidationError = {
  field: HabitValidationField;
  message: string;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "HH:mm" → minutos desde a meia-noite; null se o formato for inválido. */
function parseTimeToMinutes(time: string): number | null {
  if (!TIME_PATTERN.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Valida um hábito (§3). Lista vazia = válido. Também protege contra dados
 * corrompidos vindos do storage: formato de horário inválido vira erro de
 * validação, nunca crash.
 */
export function validateHabit(habit: Habit): HabitValidationError[] {
  const errors: HabitValidationError[] = [];

  const name = habit.name.trim();
  if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
    errors.push({
      field: 'name',
      message: `O nome precisa ter entre ${NAME_MIN_LENGTH} e ${NAME_MAX_LENGTH} caracteres.`,
    });
  }

  if (habit.days.length === 0) {
    errors.push({ field: 'days', message: 'Escolha pelo menos um dia da semana.' });
  }

  if (habit.schedule.kind === 'fixed') {
    const start = parseTimeToMinutes(habit.schedule.startTime);
    const end = parseTimeToMinutes(habit.schedule.endTime);
    if (start === null || end === null) {
      errors.push({ field: 'schedule', message: 'Horário inválido (use o formato HH:mm).' });
    } else if (end <= start) {
      errors.push({
        field: 'schedule',
        message: 'O horário de fim precisa ser depois do início.',
      });
    }
  } else {
    const { durationMinutes, earliest, latest } = habit.schedule;
    if (!VALID_DURATIONS.includes(durationMinutes)) {
      errors.push({ field: 'schedule', message: 'Duração inválida.' });
    }
    const earliestMinutes = earliest !== undefined ? parseTimeToMinutes(earliest) : undefined;
    const latestMinutes = latest !== undefined ? parseTimeToMinutes(latest) : undefined;
    if (earliestMinutes === null || latestMinutes === null) {
      errors.push({ field: 'schedule', message: 'Horário inválido (use o formato HH:mm).' });
    } else if (
      earliestMinutes !== undefined &&
      latestMinutes !== undefined &&
      latestMinutes - earliestMinutes < durationMinutes
    ) {
      errors.push({
        field: 'schedule',
        message: 'O intervalo escolhido é menor que a duração da atividade.',
      });
    }
  }

  return errors;
}
