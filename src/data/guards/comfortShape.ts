import type { ComfortPreferences } from '@/domain/entities/preferences';

const THERMAL_PRESETS = ['friorento', 'equilibrado', 'calorento'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Checagem estrutural de um `ComfortPreferences` vindo do storage (shape, não
 * regra — os limites são do `validateComfortPreferences`).
 *
 * Compartilhada porque o perfil de conforto é persistido em dois lugares: nas
 * preferências globais e no override de um hábito. Sem isso, um valor
 * malformado passaria pela camada de shape e quebraria a validação adiante.
 */
export function isComfortShape(value: unknown): value is ComfortPreferences {
  if (!isRecord(value)) return false;

  if (value.kind === 'preset') {
    return typeof value.preset === 'string' && THERMAL_PRESETS.includes(value.preset);
  }

  if (value.kind === 'custom') {
    return (
      Array.isArray(value.idealTempRange) &&
      value.idealTempRange.length === 2 &&
      value.idealTempRange.every((edge) => typeof edge === 'number') &&
      typeof value.maxHumidity === 'number' &&
      typeof value.maxWind === 'number'
    );
  }

  return false;
}
