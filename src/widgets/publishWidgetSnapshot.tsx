import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import type { WidgetSnapshot } from '@/domain/entities/widgetSnapshot';
import { logger } from '@/data/logger';
import { toWidgetPayload } from '@/presentation/widget/toWidgetPayload';

import { BorealNowWidget } from './android/BorealNowWidget';
import BorealNowIosWidget from './BorealNowWidget';

/**
 * Entrega o snapshot ao widget de cada plataforma (§9.1 do SPECS-WIDGET).
 *
 * iOS: o widget **não tem layout padrão** — sem nenhum snapshot publicado, a
 * galeria mostra "No layout found" em vez de um estado vazio nosso. O import
 * é estático de propósito: o arquivo do widget vira um bundle isolado e
 * `await import()` daqui derruba o app com "Requiring unknown module"; quem
 * protege as outras plataformas é a guarda de `Platform`.
 *
 * Android: o sistema desenha ao adicionar o widget e a cada `updatePeriodMillis`,
 * mas quem já tem um na tela só vê valor novo quando o app pede — daí o
 * `requestWidgetUpdate`, que redesenha cada instância adicionada.
 *
 * Uma entrada só por enquanto; a timeline de 6 horas do iOS é o PR 4.
 */
export async function publishWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  const payload = toWidgetPayload(snapshot);

  try {
    if (Platform.OS === 'ios') {
      const hasOutfit = payload.outfitLabel !== '';
      // Campos achatados: a ponte não aceita o payload aninhado (§9.1).
      BorealNowIosWidget.updateSnapshot({
        temp: payload.temp,
        emoji: hasOutfit ? payload.outfitEmoji : payload.icon,
        headline: hasOutfit ? payload.outfitLabel : payload.description,
        footnote: payload.habit ? payload.habit.name : payload.cityName,
      });
      return;
    }

    if (Platform.OS === 'android') {
      await requestWidgetUpdate({
        widgetName: 'BorealNow',
        renderWidget: () => ({
          light: <BorealNowWidget payload={payload} theme="light" />,
          dark: <BorealNowWidget payload={payload} theme="dark" />,
        }),
      });
    }
  } catch (error) {
    logger.warn('widget: falha ao publicar o conteúdo', error);
  }
}
