import type { City } from '@/domain/entities/city';
import type { Preferences } from '@/domain/entities/preferences';
import { DEFAULT_PREFERENCES } from '@/domain/entities/preferences';
import type { PreferencesRepository } from '@/domain/ports/preferencesRepository';

import type { KeyValueStorage } from '../datasources/asyncStorageClient';
import { logger } from '../logger';

/** Chave versionada (§4) — mesma estratégia de migração do habits:v1. */
export const PREFERENCES_STORAGE_KEY = 'prefs:v1';

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

function isPreferencesShape(value: unknown): value is Preferences {
  if (!isRecord(value)) return false;
  if (typeof value.onboardingDone !== 'boolean') return false;
  return value.defaultCity === null || isCityShape(value.defaultCity);
}

/**
 * Preferências locais com leitura defensiva: corrompido/ausente → default
 * `{ defaultCity: null, onboardingDone: false }` — quem pulou o onboarding
 * volta a vê-lo em vez de ver um crash (§11).
 */
export function createPreferencesRepository(storage: KeyValueStorage): PreferencesRepository {
  return {
    async get() {
      const raw = await storage.getJson<unknown>(PREFERENCES_STORAGE_KEY);
      if (raw === null) return DEFAULT_PREFERENCES;
      if (!isPreferencesShape(raw)) {
        logger.warn('prefs: conteúdo corrompido, usando defaults', raw);
        return DEFAULT_PREFERENCES;
      }
      return raw;
    },

    async save(preferences) {
      await storage.setJson(PREFERENCES_STORAGE_KEY, preferences);
    },
  };
}
