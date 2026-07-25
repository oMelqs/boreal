import type { City } from '@/domain/entities/city';
import type { Preferences, UserPreferences } from '@/domain/entities/preferences';
import { DEFAULT_PREFERENCES, DEFAULT_USER_PREFERENCES } from '@/domain/entities/preferences';
import type { PreferencesRepository } from '@/domain/ports/preferencesRepository';

import type { KeyValueStorage } from '../datasources/asyncStorageClient';
import { logger } from '../logger';

/** Chave versionada (§7 das preferências). */
export const PREFERENCES_STORAGE_KEY = 'prefs:v2';
/** Formato anterior, mantido intocado após a migração (rollback barato). */
export const LEGACY_PREFERENCES_STORAGE_KEY = 'prefs:v1';

const THERMAL_PRESETS = ['friorento', 'equilibrado', 'calorento'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCityShape(value: unknown): value is City {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.country === 'string' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    typeof value.timezone === 'string'
  );
}

function isComfortShape(value: unknown): boolean {
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

function isUserPreferencesShape(value: unknown): value is UserPreferences {
  if (!isRecord(value)) return false;
  if (!isComfortShape(value.comfort)) return false;
  if (value.sleep === undefined) return true;
  return (
    isRecord(value.sleep) &&
    typeof value.sleep.wakeTime === 'string' &&
    typeof value.sleep.sleepTime === 'string'
  );
}

/** Campos comuns aos dois formatos (v1 não tem `preferences`). */
type LegacyFields = Pick<Preferences, 'defaultCity' | 'onboardingDone'>;

/** Lê o formato anterior; `null` se o conteúdo não bate com o shape. */
function readLegacyFields(value: unknown): LegacyFields | null {
  if (!isRecord(value)) return null;
  const { defaultCity, onboardingDone } = value;
  if (typeof onboardingDone !== 'boolean') return null;
  if (defaultCity === null) return { defaultCity: null, onboardingDone };
  if (!isCityShape(defaultCity)) return null;
  return { defaultCity, onboardingDone };
}

/** Lê o formato atual (v1 + perfil de conforto); `null` se corrompido. */
function readPreferences(value: unknown): Preferences | null {
  const legacy = readLegacyFields(value);
  if (legacy === null || !isRecord(value)) return null;
  if (!isUserPreferencesShape(value.preferences)) return null;
  return { ...legacy, preferences: value.preferences };
}

/**
 * Preferências locais com leitura defensiva e migração transparente:
 * `prefs:v2` válido vence; sem v2, um `prefs:v1` válido é copiado para v2 com
 * o perfil default (equilibrado, sem rotina de sono — nada muda até a pessoa
 * configurar) e o v1 fica intocado. Conteúdo corrompido em qualquer formato →
 * default com log, nunca crash (§7/§11).
 */
export function createPreferencesRepository(storage: KeyValueStorage): PreferencesRepository {
  return {
    async get() {
      const raw = await storage.getJson<unknown>(PREFERENCES_STORAGE_KEY);
      if (raw !== null) {
        const stored = readPreferences(raw);
        if (stored === null) {
          logger.warn('prefs: conteúdo v2 corrompido, usando defaults', raw);
          return DEFAULT_PREFERENCES;
        }
        return stored;
      }

      const raw1 = await storage.getJson<unknown>(LEGACY_PREFERENCES_STORAGE_KEY);
      if (raw1 === null) return DEFAULT_PREFERENCES;
      const legacy = readLegacyFields(raw1);
      if (legacy === null) {
        logger.warn('prefs: conteúdo v1 corrompido, usando defaults', raw1);
        return DEFAULT_PREFERENCES;
      }

      const migrated: Preferences = { ...legacy, preferences: DEFAULT_USER_PREFERENCES };
      await storage.setJson(PREFERENCES_STORAGE_KEY, migrated);
      return migrated;
    },

    async save(preferences) {
      await storage.setJson(PREFERENCES_STORAGE_KEY, preferences);
    },
  };
}
