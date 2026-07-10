import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import type { Container } from '@/di/container';
import { EMPTY_DRAFT, useOnboarding } from '@/presentation/hooks/useOnboarding';
import { strings } from '@/presentation/i18n/strings';
import { createFakeContainer, createProvidersWrapper } from '@/presentation/testing/providers';

import { HabitDaysScreen } from './HabitDaysScreen';
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

  it('days: salvar fica desabilitado sem dias e habilita ao escolher', async () => {
    useOnboarding.getState().startDraft(validDraft);
    await renderWith(<HabitDaysScreen />);

    const save = screen.getByRole('button', { name: strings.onboarding.save });
    expect(save.props.accessibilityState.disabled).toBe(true);

    await user.press(screen.getByRole('button', { name: 'segunda-feira' }));
    await user.press(screen.getByRole('button', { name: 'quarta-feira' }));

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
