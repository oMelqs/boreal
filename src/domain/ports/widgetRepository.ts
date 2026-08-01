import type { WidgetSnapshot } from '../entities/widgetSnapshot';

/**
 * Porta do payload do widget (§5.3 do SPECS-WIDGET): o app publica, o widget
 * lê. `read` nunca falha por dado corrompido — devolve `null` e quem desenha
 * cai no estado "abra o Boreal".
 */
export interface WidgetRepository {
  publish(snapshot: WidgetSnapshot): Promise<void>;
  read(): Promise<WidgetSnapshot | null>;
}
