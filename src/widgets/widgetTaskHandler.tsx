import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { logger } from '@/data/logger';
import { container } from '@/di/container';
import { toWidgetPayload } from '@/presentation/widget/toWidgetPayload';

import { BorealNowWidget } from './android/BorealNowWidget';

/**
 * Handler headless do widget Android (§9.3 do SPECS-WIDGET): o sistema chama
 * este código sem UI montada — ao adicionar o widget, a cada 30 min
 * (`updatePeriodMillis`), ao redimensionar e nos cliques.
 *
 * Ele lê o último payload publicado pelo app. Rodando no mesmo processo do
 * app, alcança o AsyncStorage direto; sem nada gravado, desenha o estado
 * "abra o Boreal" em vez de um widget vazio.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const snapshot = await container.readWidgetSnapshot();
      const payload = snapshot ? toWidgetPayload(snapshot) : null;
      props.renderWidget({
        light: <BorealNowWidget payload={payload} theme="light" />,
        dark: <BorealNowWidget payload={payload} theme="dark" />,
      });
      break;
    }

    case 'WIDGET_DELETED':
      // Nada a limpar enquanto o widget não tem configuração própria (PR 7).
      break;

    default:
      logger.warn('widget: ação não tratada', props.widgetAction);
      break;
  }
}
