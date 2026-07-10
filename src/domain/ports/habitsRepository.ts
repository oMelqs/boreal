import type { Habit } from '../entities/habit';

/**
 * Porta de persistência de hábitos. CRUD granular: casa com as mutations da
 * UI (editar, ativar/desativar, excluir) sem reescrever a lista inteira na
 * borda. Implementada na camada data sobre armazenamento local.
 */
export interface HabitsRepository {
  getAll(): Promise<Habit[]>;
  /** Insere ou substitui pelo `id`. */
  save(habit: Habit): Promise<void>;
  remove(id: string): Promise<void>;
}
