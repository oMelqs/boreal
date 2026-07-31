import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { logger } from '@/data/logger';

import { BorealNowWidget } from './android/BorealNowWidget';
import BorealNowIosWidget from './BorealNowWidget';

/**
 * Publica o conteúdo do widget nas duas plataformas (§9.1 do SPECS-WIDGET). Na
 * spike é só um texto fixo; o payload real (`WidgetSnapshot`) entra no PR 3.
 *
 * iOS: o widget **não tem layout padrão** — sem nenhum snapshot publicado, a
 * galeria mostra "No layout found" em vez de um estado vazio nosso. O app
 * precisa publicar algo já no primeiro arranque. O import é estático de
 * propósito: o arquivo do widget vira um bundle isolado, e `await import()`
 * daqui derruba o app com "Requiring unknown module".
 *
 * Android: o sistema chama o task handler ao adicionar o widget, mas quem já
 * tem o widget na tela só vê o valor novo quando o app pede — daí o
 * `requestWidgetUpdate`, que redesenha cada instância adicionada.
 */
export async function publishWidgetSnapshot(headline: string): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      BorealNowIosWidget.updateSnapshot({ headline });
      return;
    }

    if (Platform.OS === 'android') {
      await requestWidgetUpdate({
        widgetName: 'BorealNow',
        renderWidget: () => ({
          light: <BorealNowWidget headline={headline} theme="light" />,
          dark: <BorealNowWidget headline={headline} theme="dark" />,
        }),
      });
    }
  } catch (error) {
    logger.warn('widget: falha ao publicar o conteúdo', error);
  }
}
