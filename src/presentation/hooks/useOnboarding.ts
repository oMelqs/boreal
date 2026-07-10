import { create } from 'zustand';

import type { City } from '@/domain/entities/city';
import type {
  FlexibleSchedule,
  Habit,
  HabitCategory,
  HabitIntensity,
  Weekday,
} from '@/domain/entities/habit';
import { HABIT_CATEGORY_DEFAULTS } from '@/domain/entities/habit';
import type { HabitValidationError } from '@/domain/usecases/validateHabit';
import { validateHabit } from '@/domain/usecases/validateHabit';
import { generateId } from '@/presentation/utils/generateId';

/** Campos "achatados" do formulário do mini-fluxo — fácil de ligar em inputs. */
export type DraftHabit = {
  name: string;
  category: HabitCategory;
  intensity: HabitIntensity;
  outdoor: boolean;
  scheduleKind: 'fixed' | 'flexible';
  startTime: string;
  endTime: string;
  durationMinutes: FlexibleSchedule['durationMinutes'];
  earliest: string;
  latest: string;
  days: Weekday[];
};

export const EMPTY_DRAFT: DraftHabit = {
  name: '',
  category: 'outro',
  intensity: HABIT_CATEGORY_DEFAULTS.outro.intensity,
  outdoor: HABIT_CATEGORY_DEFAULTS.outro.outdoor,
  scheduleKind: 'flexible',
  startTime: '',
  endTime: '',
  durationMinutes: 30,
  earliest: '',
  latest: '',
  days: [],
};

/** Draft → Habit do domain (bounds vazios viram ausentes). */
export function draftToHabit(draft: DraftHabit, id: string, createdAt: string): Habit {
  return {
    id,
    name: draft.name.trim(),
    category: draft.category,
    intensity: draft.intensity,
    outdoor: draft.outdoor,
    days: [...draft.days].sort((a, b) => a - b),
    schedule:
      draft.scheduleKind === 'fixed'
        ? { kind: 'fixed', startTime: draft.startTime, endTime: draft.endTime }
        : {
            kind: 'flexible',
            durationMinutes: draft.durationMinutes,
            ...(draft.earliest !== '' ? { earliest: draft.earliest } : {}),
            ...(draft.latest !== '' ? { latest: draft.latest } : {}),
          },
    enabled: true,
    createdAt,
  };
}

/** Erros do draft atual, por campo (validação inline das etapas). */
export function validateDraft(draft: DraftHabit): HabitValidationError[] {
  return validateHabit(draftToHabit(draft, 'draft', new Date().toISOString()));
}

type OnboardingState = {
  city: City | null;
  habits: Habit[];
  draft: DraftHabit;
  /** Id em edição (mini-fluxo reaproveitado pela revisão); null = novo. */
  editingId: string | null;
  setCity: (city: City) => void;
  startDraft: (prefill?: Partial<DraftHabit>) => void;
  updateDraft: (patch: Partial<DraftHabit>) => void;
  /** Aplica categoria + defaults de intensidade/outdoor (chips). */
  setDraftCategory: (category: HabitCategory) => void;
  /** Toggle atômico de dia — lê o estado fresco (imune a closure velho). */
  toggleDraftDay: (day: Weekday) => void;
  /** Valida e move o draft para a lista; retorna false se inválido. */
  commitDraft: () => boolean;
  editHabit: (id: string) => void;
  removeHabit: (id: string) => void;
  reset: () => void;
};

/**
 * Estado do formulário de onboarding (§8.1). Sem persist: nada é gravado
 * até "Concluir" — exceto a cidade, que a tela salva via preferências ao
 * selecionar. Voltar preserva respostas porque tudo vive aqui.
 */
export const useOnboarding = create<OnboardingState>((set, get) => ({
  city: null,
  habits: [],
  draft: EMPTY_DRAFT,
  editingId: null,

  setCity: (city) => set({ city }),

  startDraft: (prefill = {}) => set({ draft: { ...EMPTY_DRAFT, ...prefill }, editingId: null }),

  updateDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),

  setDraftCategory: (category) =>
    set((state) => ({
      draft: { ...state.draft, category, ...HABIT_CATEGORY_DEFAULTS[category] },
    })),

  toggleDraftDay: (day) =>
    set((state) => ({
      draft: {
        ...state.draft,
        days: state.draft.days.includes(day)
          ? state.draft.days.filter((existing) => existing !== day)
          : [...state.draft.days, day],
      },
    })),

  commitDraft: () => {
    const { draft, habits, editingId } = get();
    if (validateDraft(draft).length > 0) return false;

    const id = editingId ?? generateId();
    const createdAt =
      habits.find((habit) => habit.id === editingId)?.createdAt ?? new Date().toISOString();
    const habit = draftToHabit(draft, id, createdAt);

    set({
      habits: editingId
        ? habits.map((existing) => (existing.id === editingId ? habit : existing))
        : [...habits, habit],
      draft: EMPTY_DRAFT,
      editingId: null,
    });
    return true;
  },

  editHabit: (id) => {
    const habit = get().habits.find((existing) => existing.id === id);
    if (!habit) return;
    set({
      editingId: id,
      draft: {
        name: habit.name,
        category: habit.category,
        intensity: habit.intensity,
        outdoor: habit.outdoor,
        days: habit.days,
        scheduleKind: habit.schedule.kind,
        startTime: habit.schedule.kind === 'fixed' ? habit.schedule.startTime : '',
        endTime: habit.schedule.kind === 'fixed' ? habit.schedule.endTime : '',
        durationMinutes:
          habit.schedule.kind === 'flexible' ? habit.schedule.durationMinutes : 30,
        earliest: habit.schedule.kind === 'flexible' ? (habit.schedule.earliest ?? '') : '',
        latest: habit.schedule.kind === 'flexible' ? (habit.schedule.latest ?? '') : '',
      },
    });
  },

  removeHabit: (id) =>
    set((state) => ({ habits: state.habits.filter((habit) => habit.id !== id) })),

  reset: () => set({ city: null, habits: [], draft: EMPTY_DRAFT, editingId: null }),
}));
