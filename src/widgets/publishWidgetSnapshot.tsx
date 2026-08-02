import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { logger } from '@/data/logger';
import type { WidgetSnapshot } from '@/domain/entities/widgetSnapshot';
import { toIosWidgetProps, toWidgetPayload } from '@/presentation/widget/toWidgetPayload';

import { BorealNowWidget } from './android/BorealNowWidget';
import BorealNowIosWidget from './BorealNowWidget';

/**
 * Entrega a linha do tempo ao widget de cada plataforma (§9 do SPECS-WIDGET).
 * `timeline[0]` é agora; as demais entradas são as horas seguintes.
 *
 * iOS: `updateTimeline` deixa o sistema trocar de entrada sozinho na virada de
 * cada hora — é a resposta ao orçamento de 40–70 recargas por dia da Apple,
 * porque as seis horas seguintes já vão pré-calculadas. O import do widget é
 * estático de propósito: o arquivo vira um bundle isolado e `await import()`
 * daqui derruba o app com "Requiring unknown module".
 *
 * Android: o sistema desenha ao adicionar o widget e a cada `updatePeriodMillis`,
 * mas quem já tem um na tela só vê valor novo quando o app pede — daí o
 * `requestWidgetUpdate`. Lá não há timeline: o task handler redesenha a partir
 * do storage.
 */
export async function publishWidgetSnapshot(timeline: WidgetSnapshot[]): Promise<void> {
  const current = timeline[0];
  if (!current) return;

  try {
    if (Platform.OS === 'ios') {
      BorealNowIosWidget.updateTimeline(
        timeline.map((snapshot) => ({
          date: new Date(snapshot.generatedAt),
          props: toIosWidgetProps(toWidgetPayload(snapshot)),
        })),
      );
      return;
    }

    if (Platform.OS === 'android') {
      const payload = toWidgetPayload(current);
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
