import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

/**
 * Props do widget iOS — **achatadas e só com strings**.
 *
 * A ponte do expo-widgets não digere o payload completo (objeto aninhado com
 * arrays e `null`): `updateSnapshot` falha com "Exception in HostFunction" e o
 * widget fica no estado vazio para sempre. Passar campo a campo, já formatado,
 * é o que atravessa. Quem monta esses campos é `publishWidgetSnapshot`.
 */
type BorealNowProps = {
  /** Ausentes no preview da galeria e antes da primeira publicação. */
  temp?: string;
  emoji?: string;
  headline?: string;
  footnote?: string;
};

const BorealNow = (props: BorealNowProps, environment: WidgetEnvironment) => {
  'widget';

  const temp = props.temp;

  if (!temp) {
    return (
      <VStack spacing={4} modifiers={[widgetURL('boreal://')]}>
        <Text modifiers={[font({ size: 28 })]}>🌤️</Text>
        <Text modifiers={[font({ size: 13, weight: 'semibold' })]}>Abra o Boreal</Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={2} modifiers={[widgetURL('boreal://')]}>
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 34 })]}>{props.emoji ?? '🌤️'}</Text>
        <Text modifiers={[font({ size: 34, weight: 'bold' })]}>{temp}</Text>
        <Spacer />
      </HStack>
      <Text modifiers={[font({ size: 13, weight: 'semibold' })]}>{props.headline ?? ''}</Text>
      <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>
        {environment.widgetFamily === 'systemSmall' ? '' : (props.footnote ?? '')}
      </Text>
    </VStack>
  );
};

export default createWidget('BorealNow', BorealNow);
