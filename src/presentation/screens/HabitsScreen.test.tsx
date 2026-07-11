import { fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';

import type { Container } from '@/di/container';
import type { Habit } from '@/domain/entities/habit';
import { buildHabit } from '@/domain/usecases/testing/buildHabit';
import { useOnboarding } from '@/presentation/hooks/useOnboarding';
import { strings } from '@/presentation/i18n/strings';
import { createFakeContainer, createProvidersWrapper } from '@/presentation/testing/providers';

import { HabitsScreen } from './HabitsScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
}));

const walk = buildHabit({ id: 'walk', name: 'Passear com o Thor', enabled: true });

async function renderHabits(container: Container) {
  const Wrapper = createProvidersWrapper(container);
  return render(
    <Wrapper>
      <HabitsScreen />
    </Wrapper>,
  );
}

describe('HabitsScreen', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    useOnboarding.getState().reset();
  });

  it('desativar pelo switch persiste enabled=false e mantém o hábito na lista', async () => {
    const saved: Habit[] = [];
    let stored = [walk];
    const container = createFakeContainer({
      getHabits: async () => stored,
      saveHabit: async (habit) => {
        saved.push(habit);
        stored = [habit];
      },
    });
    await renderHabits(container);
    await screen.findByText('Passear com o Thor');

    const toggle = screen.getByRole('switch', {
      name: strings.habits.toggleLabel('Passear com o Thor'),
    });
    fireEvent(toggle, 'valueChange', false);

    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0]).toMatchObject({ id: 'walk', enabled: false });
    // continua na lista, marcado como pausado
    expect(await screen.findByText(/pausado/)).toBeOnTheScreen();
    expect(screen.getByText('Passear com o Thor')).toBeOnTheScreen();
  });

  it('excluir exige confirmação; cancelar não remove', async () => {
    const removeHabit = jest.fn(async () => {});
    await renderHabits(createFakeContainer({ getHabits: async () => [walk], removeHabit }));
    await screen.findByText('Passear com o Thor');

    await user.press(
      screen.getByRole('button', { name: strings.habits.removeLabel('Passear com o Thor') }),
    );
    expect(screen.getByText(strings.habits.confirmRemove)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: strings.habits.confirmNo }));
    expect(removeHabit).not.toHaveBeenCalled();

    await user.press(
      screen.getByRole('button', { name: strings.habits.removeLabel('Passear com o Thor') }),
    );
    await user.press(screen.getByRole('button', { name: strings.habits.confirmYes }));
    await waitFor(() => expect(removeHabit).toHaveBeenCalledWith('walk'));
  });

  it('editar carrega o mini-fluxo em modo manage com os valores do hábito', async () => {
    await renderHabits(createFakeContainer({ getHabits: async () => [walk] }));
    await screen.findByText('Passear com o Thor');

    await user.press(
      screen.getByRole('button', { name: strings.habits.editLabel('Passear com o Thor') }),
    );

    const state = useOnboarding.getState();
    expect(state.mode).toBe('manage');
    expect(state.editingId).toBe('walk');
    expect(state.draft.name).toBe('Passear com o Thor');
    expect(mockPush).toHaveBeenCalledWith('/onboarding/habit/name');
  });

  it('adicionar abre o mini-fluxo em modo manage com draft vazio', async () => {
    await renderHabits(createFakeContainer({ getHabits: async () => [] }));

    expect(await screen.findByText(strings.habits.empty)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: strings.habits.add }));

    expect(useOnboarding.getState().mode).toBe('manage');
    expect(useOnboarding.getState().editingId).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/onboarding/habit/name');
  });
});
