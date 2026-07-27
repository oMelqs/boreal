import { act, fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import type { Container } from '@/di/container';
import { draftToHabit, EMPTY_DRAFT, useOnboarding } from '@/presentation/hooks/useOnboarding';
import { strings } from '@/presentation/i18n/strings';
import { createFakeContainer, createProvidersWrapper } from '@/presentation/testing/providers';

import { HabitComfortStepScreen } from './HabitComfortStepScreen';
import { HabitDaysScreen } from './HabitDaysScreen';
import { HabitScheduleScreen } from './HabitScheduleScreen';
import { HabitsStepScreen } from './HabitsStepScreen';
import { ReviewScreen } from './ReviewScreen';
import { WelcomeScreen } from './WelcomeScreen';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    dismissTo: mockDismissTo,
  }),
}));

async function renderWith(node: React.ReactElement, container: Container = createFakeContainer()) {
  const Wrapper = createProvidersWrapper(container);
  return render(<Wrapper>{node}</Wrapper>);
}

const validDraft = {
  ...EMPTY_DRAFT,
  name: 'Passear com o cachorro',
  category: 'pet' as const,
};

/** Liga o "personalizar para este hábito" e entra no modo manual. */
async function openCustomComfort(user: ReturnType<typeof userEvent.setup>) {
  await enableCustomComfort();
  await user.press(
    await screen.findByRole('button', { name: strings.preferences.customLink }),
  );
}

/** Liga o switch "personalizar" e espera o formulário aparecer. */
async function enableCustomComfort() {
  fireEvent(await screen.findByLabelText(strings.onboarding.comfortCustomize), 'valueChange', true);
  await screen.findByRole('button', { name: strings.preferences.customLink });
}

/** Digita num campo numérico e sai dele (o valor só é reportado no blur). */
async function typeAndLeave(label: string, text: string) {
  await act(async () => {
    fireEvent(screen.getByLabelText(label), 'focus');
    fireEvent.changeText(screen.getByLabelText(label), text);
  });
  await act(async () => {
    fireEvent(screen.getByLabelText(label), 'blur');
  });
}

describe('onboarding', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    useOnboarding.getState().reset();
  });

  it('welcome: pular marca onboardingDone e não grava nenhum hábito', async () => {
    const savePreferences = jest.fn(async () => {});
    const saveHabit = jest.fn(async () => {});
    await renderWith(<WelcomeScreen />, createFakeContainer({ savePreferences, saveHabit }));

    await user.press(screen.getByRole('button', { name: strings.onboarding.skip }));

    await waitFor(() =>
      expect(savePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ onboardingDone: true }),
      ),
    );
    expect(saveHabit).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('welcome: começar navega para a etapa de cidade', async () => {
    await renderWith(<WelcomeScreen />);

    await user.press(screen.getByRole('button', { name: strings.onboarding.start }));

    expect(mockPush).toHaveBeenCalledWith('/onboarding/city');
  });

  it('habits: chip de preset pré-preenche o draft e abre o mini-fluxo', async () => {
    await renderWith(<HabitsStepScreen />);

    await user.press(screen.getByRole('button', { name: '🐕 Passear com o cachorro' }));

    const { draft } = useOnboarding.getState();
    expect(draft.name).toBe('Passear com o cachorro');
    expect(draft.category).toBe('pet');
    expect(draft.durationMinutes).toBe(30);
    expect(mockPush).toHaveBeenCalledWith('/onboarding/habit/name');
  });

  it('days: avançar fica desabilitado sem dias e habilita ao escolher', async () => {
    useOnboarding.getState().startDraft(validDraft);
    await renderWith(<HabitDaysScreen />);

    const next = screen.getByRole('button', { name: strings.onboarding.next });
    expect(next.props.accessibilityState.disabled).toBe(true);

    await user.press(screen.getByRole('button', { name: 'segunda-feira' }));
    await user.press(screen.getByRole('button', { name: 'quarta-feira' }));

    await user.press(screen.getByRole('button', { name: strings.onboarding.next }));

    expect(mockPush).toHaveBeenCalledWith('/onboarding/habit/comfort');
  });

  it('days: hábito que dispensa roupa salva ali mesmo, sem etapa de conforto', async () => {
    useOnboarding.getState().startDraft({
      ...validDraft,
      scheduleKind: 'fixed',
      startTime: '21:00',
      endTime: '21:30',
      suggestOutfit: false,
      days: [1],
    });
    await renderWith(<HabitDaysScreen />);

    await user.press(screen.getByRole('button', { name: strings.onboarding.save }));

    expect(useOnboarding.getState().habits).toHaveLength(1);
    expect(mockDismissTo).toHaveBeenCalledWith('/onboarding/habits');
  });

  it('days: atalho Seg–Sex marca os cinco dias úteis', async () => {
    useOnboarding.getState().startDraft(validDraft);
    await renderWith(<HabitDaysScreen />);

    await user.press(screen.getByRole('button', { name: strings.onboarding.weekdaysShortcut }));

    expect(useOnboarding.getState().draft.days).toEqual([1, 2, 3, 4, 5]);
  });

  it('horário: a pergunta sobre roupa só existe no horário fixo', async () => {
    useOnboarding.getState().startDraft({ ...validDraft, scheduleKind: 'flexible' });
    const { rerender } = await renderWith(<HabitScheduleScreen />);

    expect(
      screen.queryByLabelText(strings.onboarding.outfitToggleLabel),
    ).not.toBeOnTheScreen();

    useOnboarding.getState().updateDraft({ scheduleKind: 'fixed' });
    await rerender(<HabitScheduleScreen />);

    expect(
      await screen.findByLabelText(strings.onboarding.outfitToggleLabel),
    ).toBeOnTheScreen();
  });

  it('horário: desligar a sugestão de roupa marca o hábito salvo', async () => {
    const saveHabit = jest.fn(async () => {});
    useOnboarding.getState().beginManage({
      id: 'shower',
      name: 'Banho quente',
      category: 'outro',
      intensity: 'leve',
      outdoor: false,
      days: [1],
      schedule: { kind: 'fixed', startTime: '21:00', endTime: '21:30' },
      enabled: true,
      createdAt: '2026-07-01T00:00:00.000Z',
    });
    await renderWith(<HabitScheduleScreen />, createFakeContainer({ saveHabit }));

    fireEvent(
      await screen.findByLabelText(strings.onboarding.outfitToggleLabel),
      'valueChange',
      false,
    );

    expect(useOnboarding.getState().draft.suggestOutfit).toBe(false);
    expect(draftToHabit(useOnboarding.getState().draft, 'shower', '2026-07-01T00:00:00.000Z'))
      .toMatchObject({ skipOutfit: true });
  });

  it('review: concluir persiste os hábitos, marca a flag e vai para a home', async () => {
    const savePreferences = jest.fn(async () => {});
    const saveHabit = jest.fn(async () => {});
    useOnboarding.getState().startDraft({ ...validDraft, days: [1, 3] });
    useOnboarding.getState().commitDraft();
    useOnboarding.getState().startDraft({ ...validDraft, name: 'Caminhada', days: [2] });
    useOnboarding.getState().commitDraft();

    await renderWith(<ReviewScreen />, createFakeContainer({ savePreferences, saveHabit }));
    await user.press(screen.getByRole('button', { name: strings.onboarding.finish }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(saveHabit).toHaveBeenCalledTimes(2);
    expect(savePreferences).toHaveBeenCalledWith(
      expect.objectContaining({ onboardingDone: true }),
    );
    expect(useOnboarding.getState().habits).toEqual([]); // reset
  });

  it('modo manage: salvar persiste direto no repository e volta para /habits', async () => {
    const saveHabit = jest.fn(async () => {});
    const original = { ...EMPTY_DRAFT, ...validDraft, days: [1 as const] };
    useOnboarding.getState().beginManage({
      id: 'persisted',
      name: original.name,
      category: original.category,
      intensity: original.intensity,
      outdoor: original.outdoor,
      days: original.days,
      schedule: { kind: 'flexible', durationMinutes: original.durationMinutes },
      enabled: true,
      createdAt: '2026-07-01T00:00:00.000Z',
    });

    await renderWith(<HabitComfortStepScreen />, createFakeContainer({ saveHabit }));
    useOnboarding.getState().toggleDraftDay(5);
    await user.press(screen.getByRole('button', { name: strings.onboarding.save }));

    await waitFor(() => expect(saveHabit).toHaveBeenCalledTimes(1));
    expect(saveHabit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'persisted',
        createdAt: '2026-07-01T00:00:00.000Z',
        days: [1, 5],
      }),
    );
    expect(mockDismissTo).toHaveBeenCalledWith('/habits');
    expect(useOnboarding.getState().mode).toBe('onboarding');
    // sem personalizar, o hábito herda o perfil global: nada de override
    expect(saveHabit).toHaveBeenCalledWith(
      expect.not.objectContaining({ comfortOverride: expect.anything() }),
    );
    // nada foi commitado na lista local do onboarding
    expect(useOnboarding.getState().habits).toEqual([]);
  });

  it('conforto: o preset escolhido vira o override do hábito', async () => {
    useOnboarding.getState().startDraft({ ...validDraft, days: [1] });
    await renderWith(<HabitComfortStepScreen />);

    await enableCustomComfort();
    const calorento = strings.preferences.preset.calorento;
    await user.press(
      screen.getByRole('button', { name: `${calorento.label}. ${calorento.hint}` }),
    );
    await user.press(screen.getByRole('button', { name: strings.onboarding.save }));

    expect(useOnboarding.getState().habits[0]?.comfortOverride).toEqual({
      kind: 'preset',
      preset: 'calorento',
    });
  });

  it('conforto: a faixa manual grava a temperatura digitada', async () => {
    useOnboarding.getState().startDraft({ ...validDraft, days: [1] });
    await renderWith(<HabitComfortStepScreen />);

    await openCustomComfort(user);
    await typeAndLeave(strings.preferences.numeric.tempMaxLabel, '34');
    await typeAndLeave(strings.preferences.numeric.tempMinLabel, '27');

    await user.press(screen.getByRole('button', { name: strings.onboarding.save }));

    expect(useOnboarding.getState().habits[0]?.comfortOverride).toEqual({
      kind: 'custom',
      idealTempRange: [27, 34],
      maxHumidity: 70,
      maxWind: 20,
    });
  });

  it('conforto: amplitude curta mostra o erro do domain e bloqueia o salvar', async () => {
    useOnboarding.getState().startDraft({ ...validDraft, days: [1] });
    await renderWith(<HabitComfortStepScreen />);

    await openCustomComfort(user);
    await typeAndLeave(strings.preferences.numeric.tempMaxLabel, '20');

    expect(
      screen.getByText('A faixa precisa ter pelo menos 4 °C de amplitude.'),
    ).toBeOnTheScreen();
    const save = screen.getByRole('button', { name: strings.onboarding.save });
    expect(save.props.accessibilityState.disabled).toBe(true);

    await user.press(save);
    expect(useOnboarding.getState().habits).toEqual([]);
  });

  it('conforto: editar um hábito com override chega pré-preenchido', async () => {
    useOnboarding.getState().beginManage({
      id: 'beach',
      name: 'Praia',
      category: 'lazer',
      intensity: 'leve',
      outdoor: true,
      days: [6],
      schedule: { kind: 'flexible', durationMinutes: 120 },
      comfortOverride: {
        kind: 'custom',
        idealTempRange: [27, 34],
        maxHumidity: 85,
        maxWind: 25,
      },
      enabled: true,
      createdAt: '2026-07-01T00:00:00.000Z',
    });
    await renderWith(<HabitComfortStepScreen />);

    expect((await screen.findByLabelText(strings.onboarding.comfortCustomize)).props.value).toBe(
      true,
    );
    expect(screen.getByLabelText(strings.preferences.numeric.tempMinLabel).props.value).toBe('27');
    expect(screen.getByLabelText(strings.preferences.numeric.tempMaxLabel).props.value).toBe('34');
    expect(screen.getByLabelText(strings.preferences.humidityLabel).props.value).toBe('85');
  });

  it('review: remover tira o hábito da lista antes de concluir', async () => {
    useOnboarding.getState().startDraft({ ...validDraft, days: [1] });
    useOnboarding.getState().commitDraft();
    await renderWith(<ReviewScreen />);

    await user.press(
      screen.getByRole('button', {
        name: `${strings.onboarding.remove} Passear com o cachorro`,
      }),
    );

    expect(useOnboarding.getState().habits).toEqual([]);
    expect(screen.getByText(strings.onboarding.reviewEmpty)).toBeOnTheScreen();
  });
});
