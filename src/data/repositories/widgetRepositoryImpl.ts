import type { WidgetSnapshot } from '@/domain/entities/widgetSnapshot';
import { WIDGET_SCHEMA_VERSION } from '@/domain/entities/widgetSnapshot';
import type { WidgetRepository } from '@/domain/ports/widgetRepository';

import type { KeyValueStorage } from '../datasources/asyncStorageClient';
import { logger } from '../logger';

/** Chave versionada do payload do widget (§5.3). */
export const WIDGET_STORAGE_KEY = 'widget:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Guarda de shape do payload. Confere só o esqueleto: se a versão bate e os
 * campos-raiz têm o tipo certo, o conteúdo veio do nosso próprio
 * `buildWidgetSnapshot` — não é entrada de usuário, é o que gravamos.
 */
function isSnapshotShape(value: unknown): value is WidgetSnapshot {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== WIDGET_SCHEMA_VERSION) return false;
  if (typeof value.generatedAt !== 'string' || typeof value.cityName !== 'string') return false;
  if (!isRecord(value.now) || typeof value.now.temp !== 'number') return false;
  return Array.isArray(value.hours) && Array.isArray(value.habits);
}

/**
 * Publica e lê o payload do widget. Leitura defensiva em duas camadas, como
 * nos demais repositories: JSON inválido morre no storage client e shape ou
 * versão desconhecidos morrem aqui — o widget prefere dizer "abra o Boreal" a
 * desenhar um número inventado.
 */
export function createWidgetRepository(storage: KeyValueStorage): WidgetRepository {
  return {
    async publish(snapshot: WidgetSnapshot): Promise<void> {
      await storage.setJson(WIDGET_STORAGE_KEY, snapshot);
    },

    async read(): Promise<WidgetSnapshot | null> {
      const stored = await storage.getJson<unknown>(WIDGET_STORAGE_KEY);
      if (stored === null) return null;
      if (!isSnapshotShape(stored)) {
        logger.warn('widget: payload em formato desconhecido, descartando');
        return null;
      }
      return stored;
    },
  };
}
