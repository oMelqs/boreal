import type { ComfortPreferences } from '../entities/preferences';
import { DEFAULT_USER_PREFERENCES } from '../entities/preferences';
import type { HourlyForecast } from '../entities/hourlyForecast';
import { recommendBestWindowForHabit } from './recommendBestWindowForHabit';
import { resolveComfortProfile } from './resolveComfortProfile';
import { buildHabit } from './testing/buildHabit';
import { atHour, buildDay } from './testing/buildHourlyForecast';
import { validateHabit } from './validateHabit';

/** Praia: gosta de calor, tolera abafamento e quer pouco vento. */
const BEACH_COMFORT: ComfortPreferences = {
  kind: 'custom',
  idealTempRange: [27, 34],
  maxHumidity: 90,
  maxWind: 15,
};

describe('conforto por hábito — resolução (§3.2)', () => {
  it('sem override, o hábito segue o perfil global com o modificador de intensidade', () => {
    const profile = resolveComfortProfile(DEFAULT_USER_PREFERENCES, { intensity: 'intensa' });

    // Equilibrado 18–26 com os deltas de intensa: 10–20.
    expect(profile.idealTempRange).toEqual([10, 20]);
  });

  it('com override, a faixa vem do hábito e o modificador de intensidade NÃO se aplica', () => {
    const overridden = resolveComfortProfile(DEFAULT_USER_PREFERENCES, {
      intensity: 'intensa',
      comfortOverride: BEACH_COMFORT,
    });

    // A faixa é exatamente a escolhida — sem o −8/−6 de "intensa" por cima.
    expect(overridden.idealTempRange).toEqual([27, 34]);
    expect(overridden.maxHumidity).toBe(90);
    expect(overridden.windToleranceKmh).toBe(15);
    // Exposição ao ar livre continua pesando no UV, como em qualquer hábito.
    expect(overridden.uvWeight).toBe('alto');
  });

  it('o tempOffset da vestimenta também passa a vir do override', () => {
    const { tempOffset } = resolveComfortProfile(DEFAULT_USER_PREFERENCES, {
      intensity: 'leve',
      comfortOverride: BEACH_COMFORT,
    });

    // Faixa 27–34 → ponto médio 30,5 → offset clamp(22 − 30,5) = −4.
    expect(tempOffset).toBe(-4);
  });

  it('override de preset também desliga o modificador', () => {
    const profile = resolveComfortProfile(DEFAULT_USER_PREFERENCES, {
      intensity: 'intensa',
      comfortOverride: { kind: 'preset', preset: 'calorento' },
    });

    expect(profile.idealTempRange).toEqual([15, 23]);
  });
});

describe('conforto por hábito — efeito na janela (§10)', () => {
  /** Manhã amena (21 °C) e tarde quente (31 °C), tudo de dia e sem chuva. */
  function warmAfternoon(): HourlyForecast[] {
    const overrides: Record<number, Partial<HourlyForecast>> = {};
    for (const hour of [8, 9, 10, 11]) overrides[hour] = { apparentTemp: 21 };
    for (const hour of [12, 13, 14, 15, 16]) overrides[hour] = { apparentTemp: 31 };
    return buildDay(8, 10, overrides);
  }

  it('a praia com conforto próprio escolhe outra janela que o perfil global', () => {
    const hours = warmAfternoon();
    const beach = buildHabit({
      name: 'Praia',
      category: 'lazer',
      intensity: 'leve',
      outdoor: true,
      schedule: { kind: 'flexible', durationMinutes: 60 },
    });

    const globalProfile = recommendBestWindowForHabit(hours, atHour(8), beach);
    const withOverride = recommendBestWindowForHabit(hours, atHour(8), {
      ...beach,
      comfortOverride: BEACH_COMFORT,
    });

    expect(globalProfile.kind).toBe('window');
    expect(withOverride.kind).toBe('window');
    if (globalProfile.kind !== 'window' || withOverride.kind !== 'window') return;

    // Perfil global (leve: 16–26) prefere a manhã amena; a praia quer o calor.
    expect(globalProfile.start.getUTCHours()).toBeLessThan(12);
    expect(withOverride.start.getUTCHours()).toBeGreaterThanOrEqual(12);
  });
});

describe('conforto por hábito — validação', () => {
  it('override válido não gera erro', () => {
    const habit = buildHabit({ comfortOverride: BEACH_COMFORT });

    expect(validateHabit(habit)).toEqual([]);
  });

  it('override com amplitude menor que 4 °C é acusado no campo comfort', () => {
    const habit = buildHabit({
      comfortOverride: { kind: 'custom', idealTempRange: [20, 22], maxHumidity: 70, maxWind: 20 },
    });

    const errors = validateHabit(habit);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('comfort');
    expect(errors[0].message).toMatch(/4 °C de amplitude/);
  });

  it('hábito sem o campo continua válido (nada muda para quem já tinha hábitos)', () => {
    expect(validateHabit(buildHabit())).toEqual([]);
  });
});
