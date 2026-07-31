import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type BorealNowProps = {
  /** Placeholder da spike; o payload real chega no PR 3. */
  headline: string;
};

/**
 * Widget iOS (§4 do SPECS-WIDGET) — por enquanto só prova que o alvo compila,
 * que a família chega pelo environment e que o toque abre o app.
 *
 * A diretiva 'widget' faz o bundler compilar este componente num bundle
 * separado, que roda isolado do app: nada daqui pode importar hooks, stores ou
 * qualquer coisa que dependa do runtime da aplicação.
 */
const BorealNow = (props: BorealNowProps, environment: WidgetEnvironment) => {
  'widget';

  return (
    <VStack spacing={4} modifiers={[widgetURL('boreal://')]}>
      <Text modifiers={[font({ size: 24, weight: 'bold' })]}>{props.headline}</Text>
      <Text modifiers={[font({ size: 12 }), foregroundStyle('secondary')]}>
        {environment.widgetFamily}
      </Text>
    </VStack>
  );
};

export default createWidget('BorealNow', BorealNow);
