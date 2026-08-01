import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

/**
 * Props do widget iOS — **achatadas, só strings e arrays de strings**.
 *
 * A ponte do expo-widgets entrega os props direto ao módulo nativo: objeto
 * aninhado ou campo `null` derruba a publicação com "Exception in
 * HostFunction", silenciosa na tela. Quem monta é `toIosWidgetProps`.
 *
 * Todos opcionais porque o sistema renderiza o widget **sem prop nenhuma** no
 * preview da galeria e antes da primeira publicação.
 */
type BorealNowProps = {
  temp?: string;
  apparentTemp?: string;
  emoji?: string;
  headline?: string;
  cityName?: string;
  hours?: string[];
  habitName?: string;
  habitTime?: string;
  habitDetail?: string;
  habitBadges?: string;
};

const BorealNow = (props: BorealNowProps, environment: WidgetEnvironment) => {
  'widget';

  const family = environment.widgetFamily;
  const temp = props.temp;

  // Sem dado publicado: o widget diz o que fazer, em vez de mostrar vazio.
  if (!temp) {
    return (
      <VStack spacing={4} modifiers={[widgetURL('boreal://')]}>
        <Text modifiers={[font({ size: 28 })]}>🌤️</Text>
        <Text modifiers={[font({ size: 13, weight: 'semibold' })]}>Abra o Boreal</Text>
      </VStack>
    );
  }

  const hours = props.hours ?? [];
  const hasHabit = (props.habitName ?? '') !== '';

  /** Bloco fixo de todas as famílias: agasalho, temperatura e o nível. */
  const conditions = (
    <VStack spacing={2}>
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 34 })]}>{props.emoji ?? '🌤️'}</Text>
        <Text modifiers={[font({ size: 34, weight: 'bold' })]}>{temp}</Text>
        <Spacer />
      </HStack>
      <Text modifiers={[font({ size: 13, weight: 'semibold' })]}>{props.headline ?? ''}</Text>
      <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>
        sensação {props.apparentTemp ?? temp} · {props.cityName ?? ''}
      </Text>
    </VStack>
  );

  if (family === 'systemSmall') {
    return <VStack modifiers={[widgetURL('boreal://')]}>{conditions}</VStack>;
  }

  // Médio mostra 4 horas ao lado; grande mostra 6 e ainda o próximo hábito.
  const visibleHours = family === 'systemLarge' ? hours.slice(0, 6) : hours.slice(0, 4);

  const hoursColumn = (
    <VStack spacing={3} alignment="leading">
      {visibleHours.map((hour) => (
        <Text key={hour} modifiers={[font({ size: 12 })]}>
          {hour}
        </Text>
      ))}
    </VStack>
  );

  if (family === 'systemMedium') {
    return (
      <HStack spacing={16} modifiers={[widgetURL('boreal://')]}>
        {conditions}
        <Spacer />
        {hoursColumn}
      </HStack>
    );
  }

  return (
    <VStack spacing={10} alignment="leading" modifiers={[widgetURL('boreal://')]}>
      <HStack spacing={16}>
        {conditions}
        <Spacer />
        {hoursColumn}
      </HStack>
      {hasHabit ? (
        <VStack spacing={2} alignment="leading">
          <Text modifiers={[font({ size: 13, weight: 'semibold' })]}>
            {props.habitName} {props.habitBadges ?? ''}
          </Text>
          <Text modifiers={[font({ size: 11 }), foregroundStyle('secondary')]}>
            {props.habitTime ?? ''}
          </Text>
          <Text modifiers={[font({ size: 12 })]}>{props.habitDetail ?? ''}</Text>
        </VStack>
      ) : (
        <Text modifiers={[font({ size: 12 }), foregroundStyle('secondary')]}>
          Nenhum hábito para hoje
        </Text>
      )}
    </VStack>
  );
};

export default createWidget('BorealNow', BorealNow);
