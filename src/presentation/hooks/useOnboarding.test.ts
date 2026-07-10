import { EMPTY_DRAFT, useOnboarding, validateDraft } from './useOnboarding';

const validDraft = {
  ...EMPTY_DRAFT,
  name: 'Passear com o Thor',
  category: 'pet' as const,
  days: [1, 3, 5] as (1 | 3 | 5)[],
};

describe('useOnboarding', () => {
  beforeEach(() => useOnboarding.getState().reset());

  it('startDraft com prefill de chip aplica os campos e zera o resto', () => {
    useOnboarding.getState().startDraft({ name: 'Academia', category: 'exercicio' });

    const { draft } = useOnboarding.getState();
    expect(draft.name).toBe('Academia');
    expect(draft.category).toBe('exercicio');
    expect(draft.days).toEqual([]);
  });

  it('setDraftCategory aplica defaults de intensidade e local da categoria', () => {
    useOnboarding.getState().startDraft();
    useOnboarding.getState().setDraftCategory('exercicio');

    const { draft } = useOnboarding.getState();
    expect(draft.intensity).toBe('moderada');
    expect(draft.outdoor).toBe(true);

    useOnboarding.getState().setDraftCategory('estudo');
    expect(useOnboarding.getState().draft.outdoor).toBe(false);
  });

  it('commitDraft rejeita draft inválido e não adiciona nada', () => {
    useOnboarding.getState().startDraft({ name: 'x' }); // nome curto, sem dias

    expect(useOnboarding.getState().commitDraft()).toBe(false);
    expect(useOnboarding.getState().habits).toEqual([]);
  });

  it('commitDraft válido adiciona hábito com id e limpa o draft', () => {
    useOnboarding.getState().startDraft(validDraft);

    expect(useOnboarding.getState().commitDraft()).toBe(true);

    const { habits, draft } = useOnboarding.getState();
    expect(habits).toHaveLength(1);
    expect(habits[0].name).toBe('Passear com o Thor');
    expect(habits[0].id).toBeTruthy();
    expect(habits[0].enabled).toBe(true);
    expect(draft).toEqual(EMPTY_DRAFT);
  });

  it('editHabit carrega o draft e commitDraft substitui preservando id e createdAt', () => {
    useOnboarding.getState().startDraft(validDraft);
    useOnboarding.getState().commitDraft();
    const original = useOnboarding.getState().habits[0];

    useOnboarding.getState().editHabit(original.id);
    expect(useOnboarding.getState().draft.name).toBe('Passear com o Thor');

    useOnboarding.getState().updateDraft({ name: 'Passear com o Zeus' });
    useOnboarding.getState().commitDraft();

    const { habits } = useOnboarding.getState();
    expect(habits).toHaveLength(1);
    expect(habits[0].id).toBe(original.id);
    expect(habits[0].createdAt).toBe(original.createdAt);
    expect(habits[0].name).toBe('Passear com o Zeus');
  });

  it('removeHabit tira da lista; reset limpa tudo', () => {
    useOnboarding.getState().startDraft(validDraft);
    useOnboarding.getState().commitDraft();
    const id = useOnboarding.getState().habits[0].id;

    useOnboarding.getState().removeHabit(id);
    expect(useOnboarding.getState().habits).toEqual([]);
  });

  it('bounds vazios do draft flexível viram ausentes no hábito', () => {
    useOnboarding.getState().startDraft({ ...validDraft, earliest: '06:00' });
    useOnboarding.getState().commitDraft();

    const schedule = useOnboarding.getState().habits[0].schedule;
    expect(schedule).toEqual({ kind: 'flexible', durationMinutes: 30, earliest: '06:00' });
  });

  it('validateDraft aponta o campo com problema', () => {
    const errors = validateDraft({ ...EMPTY_DRAFT, name: 'Nome ok' });

    expect(errors.map((error) => error.field)).toEqual(['days']);
  });
});
