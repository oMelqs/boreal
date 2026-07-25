import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/presentation/i18n/strings';

import { RangeSlider, Slider } from './RangeSlider';
import { ThermalPresetCard } from './ThermalPresetCard';
import { TimeRangePicker } from './TimeRangePicker';

/** Aciona a ação de acessibilidade do slider (o gesto é coberto no preview). */
async function adjust(label: string, actionName: 'increment' | 'decrement') {
  fireEvent(await screen.findByLabelText(label), 'accessibilityAction', {
    nativeEvent: { actionName },
  });
}

describe('ThermalPresetCard', () => {
  it('mostra nome e exemplo concreto, e anuncia a seleção', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<ThermalPresetCard preset="calorento" selected onPress={onPress} />);

    const card = await screen.findByLabelText(
      `${strings.preferences.preset.calorento.label}. ${strings.preferences.preset.calorento.hint}`,
    );
    expect(card.props.accessibilityState.selected).toBe(true);
    expect(screen.getByText(strings.preferences.preset.calorento.hint)).toBeOnTheScreen();

    await user.press(card);
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Slider', () => {
  const props = {
    label: strings.preferences.humidityLabel,
    min: 40,
    max: 100,
    formatValue: strings.preferences.humidityValue,
    describeValue: strings.preferences.humidityFeeling,
  };

  it('anuncia valor e leitura em linguagem natural', async () => {
    await render(<Slider {...props} value={70} onChange={jest.fn()} />);

    const thumb = await screen.findByLabelText(props.label);
    expect(thumb.props.accessibilityValue.text).toBe('70%, incomoda no calor úmido');
  });

  it('increment e decrement andam um passo', async () => {
    const onChange = jest.fn();
    await render(<Slider {...props} value={70} onChange={onChange} />);

    await adjust(props.label, 'increment');
    expect(onChange).toHaveBeenLastCalledWith(71);

    await adjust(props.label, 'decrement');
    expect(onChange).toHaveBeenLastCalledWith(69);
  });

  it('respeita os limites do intervalo', async () => {
    const onChange = jest.fn();
    await render(<Slider {...props} value={100} onChange={onChange} />);

    await adjust(props.label, 'increment');
    expect(onChange).toHaveBeenLastCalledWith(100);
  });
});

describe('RangeSlider', () => {
  const props = {
    label: strings.preferences.tempRangeLabel,
    min: -10,
    max: 45,
    minSpread: 4,
    formatValue: strings.preferences.tempRangeValue,
    describeValue: strings.preferences.tempFeeling,
    edgeLabels: { min: 'Temperatura mínima agradável', max: 'Temperatura máxima agradável' },
  };

  it('mostra a faixa escolhida com a leitura natural', async () => {
    await render(<RangeSlider {...props} value={[18, 26]} onChange={jest.fn()} />);

    expect(await screen.findByText('de 18 °C a 26 °C')).toBeOnTheScreen();
    expect(screen.getByText('de ameno a calor moderado')).toBeOnTheScreen();
  });

  it('cada alça move só a sua ponta', async () => {
    const onChange = jest.fn();
    await render(<RangeSlider {...props} value={[18, 26]} onChange={onChange} />);

    await adjust(props.edgeLabels.min, 'decrement');
    expect(onChange).toHaveBeenLastCalledWith([17, 26]);

    await adjust(props.edgeLabels.max, 'increment');
    expect(onChange).toHaveBeenLastCalledWith([18, 27]);
  });

  it('a alça mínima para na amplitude mínima da faixa', async () => {
    const onChange = jest.fn();
    await render(<RangeSlider {...props} value={[22, 26]} onChange={onChange} />);

    await adjust(props.edgeLabels.min, 'increment');
    expect(onChange).toHaveBeenLastCalledWith([22, 26]);
  });
});

describe('TimeRangePicker', () => {
  it('avisa quando a rotina cruza a meia-noite, sem bloquear', async () => {
    await render(
      <TimeRangePicker
        enabled
        onChange={jest.fn()}
        onToggle={jest.fn()}
        sleepTime="02:00"
        wakeTime="14:00"
      />,
    );

    expect(await screen.findByText(strings.preferences.crossMidnightNotice)).toBeOnTheScreen();
  });

  it('erro de validação substitui o aviso informativo', async () => {
    await render(
      <TimeRangePicker
        enabled
        error="Essa rotina deixa menos de 6 horas"
        onChange={jest.fn()}
        onToggle={jest.fn()}
        sleepTime="02:00"
        wakeTime="14:00"
      />,
    );

    expect(await screen.findByText('Essa rotina deixa menos de 6 horas')).toBeOnTheScreen();
    expect(screen.queryByText(strings.preferences.crossMidnightNotice)).not.toBeOnTheScreen();
  });

  it('alterna entre rotina e só com luz do dia', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    const { rerender } = await render(
      <TimeRangePicker
        enabled
        onChange={jest.fn()}
        onToggle={onToggle}
        sleepTime="23:00"
        wakeTime="07:00"
      />,
    );

    await user.press(
      await screen.findByRole('button', { name: strings.preferences.daylightOnly }),
    );
    expect(onToggle).toHaveBeenLastCalledWith(false);

    await rerender(
      <TimeRangePicker
        enabled={false}
        onChange={jest.fn()}
        onToggle={onToggle}
        sleepTime="23:00"
        wakeTime="07:00"
      />,
    );

    expect(await screen.findByText(strings.preferences.daylightOnlyActive)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: strings.preferences.useSleepRoutine }));
    expect(onToggle).toHaveBeenLastCalledWith(true);
  });
});
