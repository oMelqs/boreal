import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from '../logger';

/**
 * Interface de armazenamento chave-valor tipado dos repositories.
 * Injetável: produção usa AsyncStorage; testes usam fake em memória —
 * mesma disciplina do `fetchFn` no cliente HTTP.
 */
export type KeyValueStorage = {
  getJson<T>(key: string): Promise<T | null>;
  setJson(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
};

type RawStorage = Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Wrapper fino sobre o AsyncStorage: serialização JSON num lugar só.
 * JSON inválido gravado (corrupção) vira `null` com aviso — o chamador
 * decide o default; nunca propaga crash de parse.
 */
export function createAsyncStorageClient(raw: RawStorage = AsyncStorage): KeyValueStorage {
  return {
    async getJson<T>(key: string): Promise<T | null> {
      const stored = await raw.getItem(key);
      if (stored === null) return null;
      try {
        return JSON.parse(stored) as T;
      } catch (error) {
        logger.warn(`storage: JSON inválido na chave "${key}", descartando`, error);
        return null;
      }
    },

    async setJson(key: string, value: unknown): Promise<void> {
      await raw.setItem(key, JSON.stringify(value));
    },

    async remove(key: string): Promise<void> {
      await raw.removeItem(key);
    },
  };
}
