import {
  draftToPreferences,
  EMPTY_PREFERENCES_DRAFT,
  preferencesToDraft,
  usePreferencesForm,
  validateDraft,
} from './usePreferencesForm';

describe('usePreferencesForm', () => {
  beforeEach(() => {
    usePreferencesForm.getState().reset();
  });

  it('começa no preset equilibrado sem rotina de sono', () => {
    expect(usePreferencesForm.getState().draft).toEqual(EMPTY_PREFERENCES_DRAFT);
    expect(draftToPreferences(EMPTY_PREFERENCES_DRAFT)).toEqual({
      comfort: { kind: 'preset', preset: 'equilibrado' },
    });
  });

  it('selectPreset troca o preset e volta ao modo de preset', () => {
    const { selectPreset, update } = usePreferencesForm.getState();
    update({ kind: 'custom' });
    selectPreset('calorento');

    const { draft } = usePreferencesForm.getState();
    expect(draft).toMatchObject({ kind: 'preset', preset: 'calorento' });
    expect(draftToPreferences(draft)).toEqual({
      comfort: { kind: 'preset', preset: 'calorento' },
    });
  });

  it('startCustom parte dos parâmetros do preset escolhido, sem zerar respostas', () => {
    usePreferencesForm.getState().selectPreset('friorento');
    usePreferencesForm.getState().startCustom();

    // Friorento (§4.1): 21–28 °C, umidade 75%, vento 15 km/h.
    expect(usePreferencesForm.getState().draft).toMatchObject({
      kind: 'custom',
      tempMin: 21,
      tempMax: 28,
      maxHumidity: 75,
      maxWind: 15,
    });
  });

  it('sleepEnabled controla a presença da rotina no que é persistido', () => {
    const { update } = usePreferencesForm.getState();
    update({ sleepEnabled: true, wakeTime: '06:30', sleepTime: '22:30' });

    expect(draftToPreferences(usePreferencesForm.getState().draft)).toEqual({
      comfort: { kind: 'preset', preset: 'equilibrado' },
      sleep: { wakeTime: '06:30', sleepTime: '22:30' },
    });

    update({ sleepEnabled: false });
    expect(draftToPreferences(usePreferencesForm.getState().draft).sleep).toBeUndefined();
  });

  it('hydrate pré-preenche o formulário com o perfil salvo', () => {
    usePreferencesForm.getState().hydrate({
      comfort: { kind: 'custom', idealTempRange: [24, 30], maxHumidity: 60, maxWind: 35 },
      sleep: { wakeTime: '14:00', sleepTime: '02:00' },
    });

    const { draft, mode } = usePreferencesForm.getState();
    expect(draft).toEqual({
      kind: 'custom',
      preset: 'equilibrado',
      tempMin: 24,
      tempMax: 30,
      maxHumidity: 60,
      maxWind: 35,
      sleepEnabled: true,
      wakeTime: '14:00',
      sleepTime: '02:00',
    });
    expect(mode).toBe('standalone');
  });

  it('preferencesToDraft e draftToPreferences fazem roundtrip', () => {
    const preferences = {
      comfort: { kind: 'preset' as const, preset: 'calorento' as const },
      sleep: { wakeTime: '07:00', sleepTime: '23:00' },
    };

    expect(draftToPreferences(preferencesToDraft(preferences))).toEqual(preferences);
  });

  it('validateDraft acusa a janela acordada curta demais', () => {
    const errors = validateDraft({
      ...EMPTY_PREFERENCES_DRAFT,
      sleepEnabled: true,
      wakeTime: '07:00',
      sleepTime: '11:00',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('sleep');
  });

  it('validateDraft aceita rotina cruzando meia-noite', () => {
    expect(
      validateDraft({
        ...EMPTY_PREFERENCES_DRAFT,
        sleepEnabled: true,
        wakeTime: '14:00',
        sleepTime: '02:00',
      }),
    ).toEqual([]);
  });
});
