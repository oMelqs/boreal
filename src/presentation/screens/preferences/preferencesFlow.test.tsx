import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import type { Container } from '@/di/container';
import { DEFAULT_USER_PREFERENCES } from '@/domain/entities/preferences';
import { usePreferencesForm } from '@/presentation/hooks/usePreferencesForm';
import { strings } from '@/presentation/i18n/strings';
import { createFakeContainer, createProvidersWrapper, joinville } from '@/presentation/testing/providers';

import { ComfortSliderScreen } from './ComfortSliderScreen';
import { PreferencesEntryScreen } from './PreferencesEntryScreen';
import { PreferencesReviewScreen } from './PreferencesReviewScreen';
import { SleepStepScreen } from './SleepStepScreen';
import { ThermalStepScreen } from './ThermalStepScreen';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, dismissTo: mockDismissTo }),
}));

async function renderWith(node: React.ReactElement, container: Container = createFakeContainer()) {
  const Wrapper = createProvidersWrapper(container);
  return render(<Wrapper>{node}</Wrapper>);
}

/** Container com um perfil já salvo (fluxo avulso pré-preenchido). */
function savedProfileContainer(overrides: Partial<Container> = {}) {
  return createFakeContainer({
    getPreferences: async () => ({
      defaultCity: joinville,
      onboardingDone: true,
      preferences: {
        comfort: { kind: 'custom', idealTempRange: [24, 30], maxHumidity: 60, maxWind: 35 },
        sleep: { wakeTime: '07:00', sleepTime: '23:00' },
      },
    }),
    ...overrides,
  });
}

describe('fluxo de preferências', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePreferencesForm.getState().reset();
  });

  it('escolher um preset grava a escolha e segue para a rotina de sono', async () => {
    const user = userEvent.setup();
    await renderWith(<ThermalStepScreen />);

    await user.press(
      await screen.findByLabelText(
        `${strings.preferences.preset.calorento.label}. ${strings.preferences.preset.calorento.hint}`,
      ),
    );

    expect(usePreferencesForm.getState().draft).toMatchObject({
      kind: 'preset',
      preset: 'calorento',
    });
    expect(mockPush).toHaveBeenCalledWith('/onboarding/sleep');
  });

  it('"prefiro definir na mão" abre as sub-etapas partindo do preset atual', async () => {
    const user = userEvent.setup();
    usePreferencesForm.getState().selectPreset('friorento');
    await renderWith(<ThermalStepScreen />);

    await user.press(await screen.findByRole('button', { name: strings.preferences.customLink }));

    // Friorento (§4.1): 21–28 °C — os sliders já começam nesses valores.
    expect(usePreferencesForm.getState().draft).toMatchObject({
      kind: 'custom',
      tempMin: 21,
      tempMax: 28,
    });
    expect(mockPush).toHaveBeenCalledWith('/onboarding/comfort/temperature');
  });

  it.each([
    ['temperature', '/onboarding/comfort/humidity'],
    ['humidity', '/onboarding/comfort/wind'],
    ['wind', '/onboarding/sleep'],
  ] as const)('a sub-etapa de %s avança para %s', async (field, destination) => {
    const user = userEvent.setup();
    await renderWith(<ComfortSliderScreen field={field} />);

    await user.press(await screen.findByRole('button', { name: strings.onboarding.next }));

    expect(mockPush).toHaveBeenLastCalledWith(destination);
  });

  it('rotina de sono: janela menor que 6h bloqueia o avanço com a mensagem do domínio', async () => {
    usePreferencesForm
      .getState()
      .update({ sleepEnabled: true, wakeTime: '07:00', sleepTime: '11:00' });
    await renderWith(<SleepStepScreen />);

    expect(await screen.findByText(/menos de 6 horas/)).toBeOnTheScreen();
    const next = screen.getByRole('button', { name: strings.onboarding.next });
    expect(next.props.accessibilityState.disabled).toBe(true);
  });

  it('rotina válida libera o avanço para a etapa seguinte do onboarding', async () => {
    const user = userEvent.setup();
    usePreferencesForm
      .getState()
      .update({ sleepEnabled: true, wakeTime: '07:00', sleepTime: '23:00' });
    await renderWith(<SleepStepScreen />);

    await user.press(await screen.findByRole('button', { name: strings.onboarding.next }));

    expect(mockPush).toHaveBeenCalledWith('/onboarding/habits');
  });

  it('"só com luz do dia" mantém as preferências sem rotina de sono', async () => {
    const user = userEvent.setup();
    usePreferencesForm.getState().update({ sleepEnabled: true });
    await renderWith(<SleepStepScreen />);

    await user.press(
      await screen.findByRole('button', { name: strings.preferences.daylightOnly }),
    );

    expect(usePreferencesForm.getState().draft.sleepEnabled).toBe(false);
    expect(screen.getByText(strings.preferences.daylightOnlyActive)).toBeOnTheScreen();
  });

  it('fluxo avulso abre pré-preenchido com o perfil salvo', async () => {
    await renderWith(<PreferencesEntryScreen />, savedProfileContainer());

    await waitFor(() =>
      expect(usePreferencesForm.getState().draft).toMatchObject({
        kind: 'custom',
        tempMin: 24,
        tempMax: 30,
        maxHumidity: 60,
        maxWind: 35,
        sleepEnabled: true,
      }),
    );
    expect(usePreferencesForm.getState().mode).toBe('standalone');
    // Etapa 1 de 3 no fluxo avulso (o onboarding tem 5).
    expect(await screen.findByText(strings.onboarding.stepLabel(1, 3))).toBeOnTheScreen();
  });

  it('revisão do fluxo avulso resume e persiste o perfil, preservando a cidade', async () => {
    const user = userEvent.setup();
    const savePreferences = jest.fn(async () => {});
    usePreferencesForm.getState().hydrate({
      comfort: { kind: 'preset', preset: 'calorento' },
      sleep: { wakeTime: '07:00', sleepTime: '23:00' },
    });

    await renderWith(
      <PreferencesReviewScreen />,
      savedProfileContainer({ savePreferences }),
    );

    // Calorento (§4.1): faixa 15–23 °C.
    expect(await screen.findByText('Calorento · 15–23 °C')).toBeOnTheScreen();
    expect(screen.getByText('07:00 às 23:00')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: strings.preferences.save }));

    await waitFor(() =>
      expect(savePreferences).toHaveBeenCalledWith({
        defaultCity: joinville,
        onboardingDone: true,
        preferences: {
          comfort: { kind: 'preset', preset: 'calorento' },
          sleep: { wakeTime: '07:00', sleepTime: '23:00' },
        },
      }),
    );
    expect(mockDismissTo).toHaveBeenCalledWith('/');
  });

  it('sem rotina, a revisão mostra a nota de luz do dia', async () => {
    usePreferencesForm.getState().hydrate(DEFAULT_USER_PREFERENCES);
    await renderWith(<PreferencesReviewScreen />, savedProfileContainer());

    expect(await screen.findByText(strings.preferences.awakeDaylight)).toBeOnTheScreen();
  });
});
