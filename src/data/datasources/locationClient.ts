import * as Location from 'expo-location';

/** Coordenadas geográficas do dispositivo. */
export type Coords = { latitude: number; longitude: number };

/**
 * Resultado de permissão normalizado para o app:
 * - `granted`: pode ler a posição.
 * - `denied`: pessoa recusou (ou não dá para perguntar de novo).
 * - `unavailable`: sem suporte/serviço (ex.: web sem geolocalização, GPS off).
 */
export type LocationPermission = 'granted' | 'denied' | 'unavailable';

export type LocationClient = {
  /** Garante a permissão de foreground, pedindo uma vez se ainda indefinida. */
  ensurePermission(): Promise<LocationPermission>;
  /** Posição atual; `null` em qualquer falha (timeout, serviço off, recusa). */
  getCurrentPosition(): Promise<Coords | null>;
};

/** Subconjunto do expo-location usado — injetável para testes (sem native). */
export type LocationModule = {
  getForegroundPermissionsAsync(): Promise<{ status: string; canAskAgain: boolean }>;
  requestForegroundPermissionsAsync(): Promise<{ status: string }>;
  getCurrentPositionAsync(): Promise<{ coords: { latitude: number; longitude: number } }>;
};

/**
 * Datasource de localização: wrapper fino sobre o expo-location, na fronteira
 * de I/O (como o `openMeteoClient` sobre `fetch`). `mod` é injetável para
 * testes; falhas viram `unavailable`/`null` em vez de propagar exceção — quem
 * chama decide o fallback (cidade padrão / busca manual).
 */
export function createLocationClient(mod: LocationModule = Location): LocationClient {
  return {
    async ensurePermission(): Promise<LocationPermission> {
      try {
        const current = await mod.getForegroundPermissionsAsync();
        if (current.status === 'granted') return 'granted';
        if (current.status === 'denied' && !current.canAskAgain) return 'denied';
        const requested = await mod.requestForegroundPermissionsAsync();
        return requested.status === 'granted' ? 'granted' : 'denied';
      } catch {
        return 'unavailable';
      }
    },

    async getCurrentPosition(): Promise<Coords | null> {
      try {
        const position = await mod.getCurrentPositionAsync();
        return { latitude: position.coords.latitude, longitude: position.coords.longitude };
      } catch {
        return null;
      }
    },
  };
}
