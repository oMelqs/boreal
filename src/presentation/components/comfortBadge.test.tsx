import { render, screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/presentation/i18n/strings';

import { ComfortBadge } from './ComfortBadge';

const beachComfort = {
  kind: 'custom' as const,
  idealTempRange: [27, 34] as [number, number],
  maxHumidity: 70,
  maxWind: 20,
};

describe('ComfortBadge', () => {
  it('faixa manual aparece no selo e no rótulo acessível', async () => {
    await render(<ComfortBadge comfort={beachComfort} habitName="Praia" />);

    expect(await screen.findByText(/27–34 °C/)).toBeOnTheScreen();
    expect(
      screen.getByLabelText(strings.preferences.ownComfortLabel('27–34 °C')),
    ).toBeOnTheScreen();
  });

  it('override por preset mostra o nome do perfil', async () => {
    await render(
      <ComfortBadge comfort={{ kind: 'preset', preset: 'calorento' }} habitName="Praia" />,
    );

    expect(await screen.findByText(/Calorento/)).toBeOnTheScreen();
  });

  it('sem atalho, o selo é só leitura', async () => {
    await render(<ComfortBadge comfort={beachComfort} habitName="Praia" />);

    await screen.findByText(/27–34 °C/);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('com atalho, vira botão que leva a editar o conforto do hábito', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    await render(<ComfortBadge comfort={beachComfort} habitName="Praia" onEdit={onEdit} />);

    await user.press(
      await screen.findByRole('button', {
        name: strings.preferences.ownComfortEdit('Praia', '27–34 °C'),
      }),
    );

    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
