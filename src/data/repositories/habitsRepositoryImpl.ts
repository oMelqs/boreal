import type { Habit } from '@/domain/entities/habit';
import type { HabitsRepository } from '@/domain/ports/habitsRepository';
import { validateHabit } from '@/domain/usecases/validateHabit';

import type { KeyValueStorage } from '../datasources/asyncStorageClient';
import { isComfortShape } from '../guards/comfortShape';
import { logger } from '../logger';

/**
 * Chave versionada (§4): migração futura sem lib — a v2 leria `habits:v1`,
 * converteria e passaria a escrever `habits:v2`.
 */
export const HABITS_STORAGE_KEY = 'habits:v1';

const CATEGORIES = ['pet', 'exercicio', 'estudo', 'trabalho', 'lazer', 'outro'];
const INTENSITIES = ['leve', 'moderada', 'intensa'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Checagem estrutural de um registro vindo do storage (shape, não regra). */
function isHabitShape(value: unknown): value is Habit {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return false;
  if (!CATEGORIES.includes(value.category as string)) return false;
  if (!INTENSITIES.includes(value.intensity as string)) return false;
  if (typeof value.outdoor !== 'boolean' || typeof value.enabled !== 'boolean') return false;
  if (typeof value.createdAt !== 'string') return false;
  if (
    !Array.isArray(value.days) ||
    !value.days.every((day) => typeof day === 'number' && day >= 0 && day <= 6)
  ) {
    return false;
  }

  // Campos aditivos: ausentes é o normal; presentes precisam ter shape válido,
  // ou a validação adiante quebraria ao ler a faixa de um valor qualquer.
  if (value.comfortOverride !== undefined && !isComfortShape(value.comfortOverride)) {
    return false;
  }
  if (value.skipOutfit !== undefined && typeof value.skipOutfit !== 'boolean') {
    return false;
  }

  const schedule = value.schedule;
  if (!isRecord(schedule)) return false;
  if (schedule.kind === 'fixed') {
    return typeof schedule.startTime === 'string' && typeof schedule.endTime === 'string';
  }
  if (schedule.kind === 'flexible') {
    return typeof schedule.durationMinutes === 'number';
  }
  return false;
}

/**
 * Persistência de hábitos sobre chave-valor local. Leitura defensiva em duas
 * camadas: shape estrutural + regras do `validateHabit` — registro corrompido
 * é descartado com aviso, o resto sobrevive, o app nunca cai por causa do
 * storage (§11).
 */
export function createHabitsRepository(storage: KeyValueStorage): HabitsRepository {
  async function readValid(): Promise<Habit[]> {
    const raw = await storage.getJson<unknown>(HABITS_STORAGE_KEY);
    if (raw === null) return [];
    if (!Array.isArray(raw)) {
      logger.warn('habits: conteúdo não é uma lista, descartando tudo');
      return [];
    }

    const valid: Habit[] = [];
    for (const item of raw) {
      if (isHabitShape(item) && validateHabit(item).length === 0) {
        valid.push(item);
      } else {
        logger.warn('habits: registro corrompido descartado', item);
      }
    }
    return valid;
  }

  return {
    getAll: readValid,

    async save(habit) {
      const habits = await readValid();
      const index = habits.findIndex((existing) => existing.id === habit.id);
      if (index >= 0) {
        habits[index] = habit;
      } else {
        habits.push(habit);
      }
      await storage.setJson(HABITS_STORAGE_KEY, habits);
    },

    async remove(id) {
      const habits = await readValid();
      await storage.setJson(
        HABITS_STORAGE_KEY,
        habits.filter((habit) => habit.id !== id),
      );
    },
  };
}
