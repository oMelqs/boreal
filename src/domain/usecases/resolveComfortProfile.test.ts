import type { UserPreferences } from '../entities/preferences';
import { DEFAULT_USER_PREFERENCES } from '../entities/preferences';
import { DEFAULT_COMFORT_PARAMS } from './computeComfortScore';
import { INTENSITY_PROFILES } from './habitScoringProfiles';
import { resolveComfortProfile } from './resolveComfortProfile';

function preset(name: 'friorento' | 'equilibrado' | 'calorento'): UserPreferences {
  return { comfort: { kind: 'preset', preset: name } };
}

function custom(
  idealTempRange: [number, number],
  maxHumidity = 70,
  maxWind = 20,
): UserPreferences {
  return { comfort: { kind: 'custom', idealTempRange, maxHumidity, maxWind } };
}

describe('resolveComfortProfile — presets (§4.1)', () => {
  it('friorento: faixa desloca para cima, menos vento, veste mais (−3)', () => {
    expect(resolveComfortProfile(preset('friorento'))).toEqual({
      idealTempRange: [21, 28],
      tempPenaltyPerDegree: 4,
      uvWeight: 'normal',
      windToleranceKmh: 15,
      maxHumidity: 75,
      tempOffset: -3,
    });
  });

  it('equilibrado reproduz o motor genérico, exceto o vento fixado em 20 (§4.1)', () => {
    const profile = resolveComfortProfile(preset('equilibrado'));
    expect(profile).toEqual({
      ...DEFAULT_COMFORT_PARAMS,
      windToleranceKmh: 20,
      maxHumidity: 70,
      tempOffset: 0,
    });
  });

  it('calorento: faixa mais fria, mais vento, menos umidade, veste menos (+3)', () => {
    expect(resolveComfortProfile(preset('calorento'))).toEqual({
      idealTempRange: [15, 23],
      tempPenaltyPerDegree: 4,
      uvWeight: 'normal',
      windToleranceKmh: 25,
      maxHumidity: 60,
      tempOffset: 3,
    });
  });
});

describe('resolveComfortProfile — modo personalizado (§4.2)', () => {
  it('faixas manuais entram direto no perfil', () => {
    const profile = resolveComfortProfile(custom([12, 20], 85, 40));
    expect(profile.idealTempRange).toEqual([12, 20]);
    expect(profile.maxHumidity).toBe(85);
    expect(profile.windToleranceKmh).toBe(40);
  });

  it('offset derivado: 24–30 → midpoint 27 → clamp em −4 (exemplo do spec)', () => {
    expect(resolveComfortProfile(custom([24, 30])).tempOffset).toBe(-4);
  });

  it('offset derivado: faixa neutra 18–26 → 0; faixa fria 10–18 → clamp em +4', () => {
    expect(resolveComfortProfile(custom([18, 26])).tempOffset).toBe(0);
    expect(resolveComfortProfile(custom([10, 18])).tempOffset).toBe(4);
  });

  it('offset arredondado a inteiro antes do clamp (20–25 → midpoint 22,5 → 0)', () => {
    expect(resolveComfortProfile(custom([20, 25])).tempOffset).toBe(-0);
  });
});

describe('resolveComfortProfile — composição com intensidade (§4.3)', () => {
  it.each(['leve', 'moderada', 'intensa'] as const)(
    'equilibrado + %s reproduz exatamente o perfil antigo por intensidade',
    (intensity) => {
      const profile = resolveComfortProfile(DEFAULT_USER_PREFERENCES, intensity);
      expect(profile).toMatchObject(INTENSITY_PROFILES[intensity]);
    },
  );

  it('friorento + intensa: deltas sobre a faixa pessoal e +5 de vento', () => {
    const profile = resolveComfortProfile(preset('friorento'), 'intensa');
    expect(profile.idealTempRange).toEqual([13, 22]);
    expect(profile.windToleranceKmh).toBe(20);
    expect(profile.uvWeight).toBe('alto');
  });

  it('calorento + leve: vento pessoal maior que a base leve perde para o min', () => {
    const profile = resolveComfortProfile(preset('calorento'), 'leve');
    expect(profile.idealTempRange).toEqual([13, 23]);
    expect(profile.windToleranceKmh).toBe(15);
  });

  it('custom + moderada: vento pessoal preservado, faixa deslocada', () => {
    const profile = resolveComfortProfile(custom([24, 30], 60, 35), 'moderada');
    expect(profile.idealTempRange).toEqual([21, 28]);
    expect(profile.windToleranceKmh).toBe(35);
  });

  it('intensidade não altera o tempOffset da pessoa', () => {
    expect(resolveComfortProfile(preset('friorento'), 'intensa').tempOffset).toBe(-3);
    expect(resolveComfortProfile(custom([24, 30]), 'leve').tempOffset).toBe(-4);
  });
});
