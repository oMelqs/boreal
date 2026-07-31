import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { logger } from '@/data/logger';

import { BorealNowWidget } from './android/BorealNowWidget';

/**
 * Handler headless do widget Android (§9.3 do SPECS-WIDGET): o sistema chama
 * este código sem UI montada — ao adicionar o widget, a cada 30 min
 * (`updatePeriodMillis`), ao redimensionar e nos cliques.
 *
 * Na spike ele só re-renderiza um texto fixo. A leitura do payload e o
 * revalidar por rede entram nos PRs 3 e 5.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const headline = 'Olá, Boreal';

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget({
        light: <BorealNowWidget headline={headline} theme="light" />,
        dark: <BorealNowWidget headline={headline} theme="dark" />,
      });
      break;

    case 'WIDGET_DELETED':
      // Nada a limpar enquanto o widget não tem configuração própria (PR 7).
      break;

    default:
      logger.warn('widget: ação não tratada', props.widgetAction);
      break;
  }
}
