import type { ComfortPreferences } from '../entities/preferences';
import { validateComfortPreferences } from './validateComfortPreferences';

function custom(
  idealTempRange: [number, number],
  maxHumidity = 70,
  maxWind = 20,
): ComfortPreferences {
  return { kind: 'custom', idealTempRange, maxHumidity, maxWind };
}

function fieldsOf(comfort: ComfortPreferences): string[] {
  return validateComfortPreferences(comfort).map((error) => error.field);
}

describe('validateComfortPreferences', () => {
  it('preset é sempre válido', () => {
    expect(validateComfortPreferences({ kind: 'preset', preset: 'friorento' })).toEqual([]);
    expect(validateComfortPreferences({ kind: 'preset', preset: 'calorento' })).toEqual([]);
  });

  it('custom dentro dos limites é válido, inclusive nos extremos', () => {
    expect(validateComfortPreferences(custom([18, 26]))).toEqual([]);
    expect(validateComfortPreferences(custom([-10, 45], 40, 5))).toEqual([]);
    expect(validateComfortPreferences(custom([24, 30], 100, 60))).toEqual([]);
  });

  it('faixa de temperatura fora dos limites ou invertida', () => {
    expect(fieldsOf(custom([-11, 20]))).toEqual(['tempRange']);
    expect(fieldsOf(custom([20, 46]))).toEqual(['tempRange']);
    expect(fieldsOf(custom([26, 18]))).toEqual(['tempRange']);
  });

  it('amplitude mínima de 4 °C', () => {
    const errors = validateComfortPreferences(custom([20, 23]));
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/4 °C de amplitude/);
    expect(validateComfortPreferences(custom([20, 24]))).toEqual([]);
  });

  it('umidade e vento fora dos limites', () => {
    expect(fieldsOf(custom([18, 26], 39))).toEqual(['humidity']);
    expect(fieldsOf(custom([18, 26], 101))).toEqual(['humidity']);
    expect(fieldsOf(custom([18, 26], 70, 4))).toEqual(['wind']);
    expect(fieldsOf(custom([18, 26], 70, 61))).toEqual(['wind']);
  });

  it('acumula um erro por campo violado', () => {
    expect(fieldsOf(custom([26, 18], 20, 90))).toEqual(['tempRange', 'humidity', 'wind']);
  });
});
