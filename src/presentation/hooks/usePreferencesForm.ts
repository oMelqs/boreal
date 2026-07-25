import { create } from 'zustand';

import type { ThermalPreset, UserPreferences } from '@/domain/entities/preferences';
import { resolveComfortProfile } from '@/domain/usecases/resolveComfortProfile';
import type { PreferencesValidationError } from '@/domain/usecases/validatePreferences';
import { validatePreferences } from '@/domain/usecases/validatePreferences';

/** Campos "achatados" do formulário — fáceis de ligar em sliders e time fields. */
export type PreferencesDraft = {
  kind: 'preset' | 'custom';
  preset: ThermalPreset;
  tempMin: number;
  tempMax: number;
  maxHumidity: number;
  maxWind: number;
  /** false → grava sem `sleep` (comportamento legado por luz do dia). */
  sleepEnabled: boolean;
  wakeTime: string;
  sleepTime: string;
};

/** Ponto de partida do formulário: equilibrado com rotina 07h–23h sugerida. */
export const EMPTY_PREFERENCES_DRAFT: PreferencesDraft = {
  kind: 'preset',
  preset: 'equilibrado',
  tempMin: 18,
  tempMax: 26,
  maxHumidity: 70,
  maxWind: 20,
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

  if (comfort.kind === 'preset') {
    return { ...EMPTY_PREFERENCES_DRAFT, preset: comfort.preset, ...sleepFields };
  }
  return {
    kind: 'custom',
    preset: EMPTY_PREFERENCES_DRAFT.preset,
    tempMin: comfort.idealTempRange[0],
    tempMax: comfort.idealTempRange[1],
    maxHumidity: comfort.maxHumidity,
    maxWind: comfort.maxWind,
    ...sleepFields,
  };
}

/** Campos do formulário → entity do domain (o que é persistido). */
export function draftToPreferences(draft: PreferencesDraft): UserPreferences {
  const comfort: UserPreferences['comfort'] =
    draft.kind === 'preset'
      ? { kind: 'preset', preset: draft.preset }
      : {
          kind: 'custom',
          idealTempRange: [draft.tempMin, draft.tempMax],
          maxHumidity: draft.maxHumidity,
          maxWind: draft.maxWind,
        };

  return {
    comfort,
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

  // Sair de um preset para o modo manual não deve zerar as respostas: os
  // parâmetros daquele preset viram os valores iniciais dos sliders.
  startCustom: () =>
    set((state) => {
      const profile = resolveComfortProfile({
        comfort: { kind: 'preset', preset: state.draft.preset },
      });
      return {
        draft: {
          ...state.draft,
          kind: 'custom',
          tempMin: profile.idealTempRange[0],
          tempMax: profile.idealTempRange[1],
          maxHumidity: profile.maxHumidity,
          maxWind: profile.windToleranceKmh,
        },
      };
    }),

  reset: () => set({ draft: EMPTY_PREFERENCES_DRAFT, mode: 'onboarding' }),
}));
