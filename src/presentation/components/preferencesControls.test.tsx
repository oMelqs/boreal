import { render, screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/presentation/i18n/strings';

import { ThermalPresetCard } from './ThermalPresetCard';
import { TimeRangePicker } from './TimeRangePicker';

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
