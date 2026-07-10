import type { KeyValueStorage } from '../datasources/asyncStorageClient';

/**
 * Storage em memória para testes de repository — sem jest.mock.
 * `seed` aceita valores crus (string) para simular corrupção.
 */
export function createFakeStorage(seed: Record<string, string> = {}): KeyValueStorage & {
  dump(): Record<string, string>;
} {
  const store = new Map<string, string>(Object.entries(seed));

  return {
    async getJson<T>(key: string): Promise<T | null> {
      const stored = store.get(key);
      if (stored === undefined) return null;
      try {
        return JSON.parse(stored) as T;
      } catch {
        return null;
      }
    },
    async setJson(key: string, value: unknown): Promise<void> {
      store.set(key, JSON.stringify(value));
    },
    async remove(key: string): Promise<void> {
      store.delete(key);
    },
    dump() {
      return Object.fromEntries(store);
    },
  };
}
