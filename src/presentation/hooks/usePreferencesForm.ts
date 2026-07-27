import { create } from 'zustand';

import type { ThermalPreset, UserPreferences } from '@/domain/entities/preferences';
import type { PreferencesValidationError } from '@/domain/usecases/validatePreferences';
import { validatePreferences } from '@/domain/usecases/validatePreferences';

import type { ComfortDraft } from './comfortDraft';
import {
  comfortToDraft,
  customFromPreset,
  draftToComfort,
  EMPTY_COMFORT_DRAFT,
} from './comfortDraft';

/** O perfil de conforto (compartilhado com o hábito) mais a rotina de sono. */
export type PreferencesDraft = ComfortDraft & {
  /** false → grava sem `sleep` (comportamento legado por luz do dia). */
  sleepEnabled: boolean;
  wakeTime: string;
  sleepTime: string;
};

/** Ponto de partida do formulário: equilibrado com rotina 07h–23h sugerida. */
export const EMPTY_PREFERENCES_DRAFT: PreferencesDraft = {
  ...EMPTY_COMFORT_DRAFT,
  sleepEnabled: false,
  wakeTime: '07:00',
  sleepTime: '23:00',
};

/** Preferências persistidas → campos do formulário (pré-preenchimento). */
export function preferencesToDraft(preferences: UserPreferences): PreferencesDraft {
  const { comfort, sleep } = preferences;
  const sleepFields = sleep
    ? { sleepEnabled: true, wakeTime: sleep.wakeTime, sleepTime: sleep.sleepTime }
    : {
        sleepEnabled: false,
        wakeTime: EMPTY_PREFERENCES_DRAFT.wakeTime,
        sleepTime: EMPTY_PREFERENCES_DRAFT.sleepTime,
      };

  return { ...comfortToDraft(comfort), ...sleepFields };
}

/** Campos do formulário → entity do domain (o que é persistido). */
export function draftToPreferences(draft: PreferencesDraft): UserPreferences {
  return {
    comfort: draftToComfort(draft),
    ...(draft.sleepEnabled
      ? { sleep: { wakeTime: draft.wakeTime, sleepTime: draft.sleepTime } }
      : {}),
  };
}

/** Erros do draft atual, por campo (validação inline das etapas). */
export function validateDraft(draft: PreferencesDraft): PreferencesValidationError[] {
  return validatePreferences(draftToPreferences(draft));
}

type PreferencesFormState = {
  draft: PreferencesDraft;
  /** 'onboarding': persiste junto com os hábitos na revisão final.
   *  'standalone': o próprio fluxo de /preferences persiste ao concluir. */
  mode: 'onboarding' | 'standalone';
  /** Carrega o perfil salvo no formulário (fluxo avulso pré-preenchido). */
  hydrate: (preferences: UserPreferences, mode?: PreferencesFormState['mode']) => void;
  update: (patch: Partial<PreferencesDraft>) => void;
  /** Escolher um preset volta o formulário ao modo de preset. */
  selectPreset: (preset: ThermalPreset) => void;
  /** Entra no modo manual partindo dos valores do preset selecionado. */
  startCustom: () => void;
  reset: () => void;
};

/**
 * Estado do formulário de preferências (§8). Sem persist: nada é gravado até
 * concluir — no onboarding, junto com os hábitos; no fluxo avulso, na revisão.
 * Voltar preserva as respostas porque tudo vive aqui.
 */
export const usePreferencesForm = create<PreferencesFormState>((set) => ({
  draft: EMPTY_PREFERENCES_DRAFT,
  mode: 'onboarding',

  hydrate: (preferences, mode = 'standalone') =>
    set({ draft: preferencesToDraft(preferences), mode }),

  update: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),

  selectPreset: (preset) =>
    set((state) => ({ draft: { ...state.draft, kind: 'preset', preset } })),

  startCustom: () =>
    set((state) => ({ draft: { ...state.draft, ...customFromPreset(state.draft) } })),

  reset: () => set({ draft: EMPTY_PREFERENCES_DRAFT, mode: 'onboarding' }),
}));
