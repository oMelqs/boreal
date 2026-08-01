import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { WidgetPayload } from '@/presentation/widget/toWidgetPayload';

type BorealNowProps = {
  payload: WidgetPayload;
};

/**
 * Widget iOS (§6 do SPECS-WIDGET). Layout provisório de uma coluna: o que
 * vestir agora e a temperatura. Famílias e timeline entram no PR 4.
 *
 * A diretiva 'widget' faz o bundler compilar este componente num bundle
 * separado, que roda isolado do app: nada daqui pode importar hooks, stores
 * ou qualquer coisa presa ao runtime da aplicação — só tipos e o payload.
 */
const BorealNow = (props: BorealNowProps, environment: WidgetEnvironment) => {
  'widget';

  const { payload } = props;
  const hasOutfit = payload.outfitLabel !== '';

  return (
    <VStack spacing={2} modifiers={[widgetURL('boreal://')]}>
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 34 })]}>{hasOutfit ? payload.outfitEmoji : '🌙'}</Text>
        <Text modifiers={[font({ size: 34, weight: 'bold' })]}>{payload.temp}</Text>
        <Spacer />
      </HStack>
      <Text modifiers={[font({ size: 13, weight: 'semibold' })]}>
        {hasOutfit ? payload.outfitLabel : payload.description}
      </Text>
      <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>
        {environment.widgetFamily === 'systemSmall'
          ? payload.cityName
          : (payload.habit?.name ?? payload.cityName)}
      </Text>
    </VStack>
  );
};

export default createWidget('BorealNow', BorealNow);
