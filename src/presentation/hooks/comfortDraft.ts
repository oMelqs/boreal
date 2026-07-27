import type { ComfortPreferences, ThermalPreset } from '@/domain/entities/preferences';
import { resolveComfortProfile } from '@/domain/usecases/resolveComfortProfile';

/**
 * Campos "achatados" do perfil de conforto — fáceis de ligar em cards e campos
 * numéricos. Servem tanto às preferências globais quanto ao conforto de um
 * hábito, então o par de conversores vive aqui e não em um dos dois fluxos.
 */
export type ComfortDraft = {
  kind: 'preset' | 'custom';
  preset: ThermalPreset;
  tempMin: number;
  tempMax: number;
  maxHumidity: number;
  maxWind: number;
};

/** Ponto de partida: equilibrado, com os números do preset já visíveis. */
export const EMPTY_COMFORT_DRAFT: ComfortDraft = {
  kind: 'preset',
  preset: 'equilibrado',
  tempMin: 18,
  tempMax: 26,
  maxHumidity: 70,
  maxWind: 20,
};

/** Perfil salvo → campos do formulário (pré-preenchimento). */
export function comfortToDraft(comfort: ComfortPreferences): ComfortDraft {
  if (comfort.kind === 'preset') {
    return { ...EMPTY_COMFORT_DRAFT, preset: comfort.preset };
  }
  return {
    kind: 'custom',
    preset: EMPTY_COMFORT_DRAFT.preset,
    tempMin: comfort.idealTempRange[0],
    tempMax: comfort.idealTempRange[1],
    maxHumidity: comfort.maxHumidity,
    maxWind: comfort.maxWind,
  };
}

/** Campos do formulário → entity do domain (o que é persistido). */
export function draftToComfort(draft: ComfortDraft): ComfortPreferences {
  if (draft.kind === 'preset') {
    return { kind: 'preset', preset: draft.preset };
  }
  return {
    kind: 'custom',
    idealTempRange: [draft.tempMin, draft.tempMax],
    maxHumidity: draft.maxHumidity,
    maxWind: draft.maxWind,
  };
}

/**
 * Sair de um preset para o modo manual não zera as respostas: os parâmetros
 * daquele preset viram os valores iniciais dos campos.
 */
export function customFromPreset(draft: ComfortDraft): ComfortDraft {
  const profile = resolveComfortProfile({
    comfort: { kind: 'preset', preset: draft.preset },
  });
  return {
    ...draft,
    kind: 'custom',
    tempMin: profile.idealTempRange[0],
    tempMax: profile.idealTempRange[1],
    maxHumidity: profile.maxHumidity,
    maxWind: profile.windToleranceKmh,
  };
}
