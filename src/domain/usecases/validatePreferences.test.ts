import type { SleepSchedule, UserPreferences } from '../entities/preferences';
import { DEFAULT_USER_PREFERENCES } from '../entities/preferences';
import { validatePreferences } from './validatePreferences';

function custom(
  idealTempRange: [number, number],
  maxHumidity = 70,
  maxWind = 20,
  sleep?: SleepSchedule,
): UserPreferences {
  return {
    comfort: { kind: 'custom', idealTempRange, maxHumidity, maxWind },
    ...(sleep ? { sleep } : {}),
  };
}

function withSleep(sleep: SleepSchedule): UserPreferences {
  return { ...DEFAULT_USER_PREFERENCES, sleep };
}

function fieldsOf(preferences: UserPreferences): string[] {
  return validatePreferences(preferences).map((error) => error.field);
}

describe('validatePreferences', () => {
  it('preset sem sleep é sempre válido', () => {
    expect(validatePreferences(DEFAULT_USER_PREFERENCES)).toEqual([]);
  });

  it('custom dentro dos limites é válido', () => {
    expect(validatePreferences(custom([18, 26], 70, 20))).toEqual([]);
    expect(validatePreferences(custom([-10, 45], 40, 5))).toEqual([]);
    expect(validatePreferences(custom([24, 30], 100, 60))).toEqual([]);
  });

  it('faixa de temperatura fora dos limites ou invertida', () => {
    expect(fieldsOf(custom([-11, 20]))).toEqual(['tempRange']);
    expect(fieldsOf(custom([20, 46]))).toEqual(['tempRange']);
    expect(fieldsOf(custom([26, 18]))).toEqual(['tempRange']);
  });

  it('amplitude mínima de 4 °C', () => {
    expect(fieldsOf(custom([20, 23]))).toEqual(['tempRange']);
    expect(validatePreferences(custom([20, 24]))).toEqual([]);
  });

  it('umidade e vento fora dos limites', () => {
    expect(fieldsOf(custom([18, 26], 39))).toEqual(['humidity']);
    expect(fieldsOf(custom([18, 26], 101))).toEqual(['humidity']);
    expect(fieldsOf(custom([18, 26], 70, 4))).toEqual(['wind']);
    expect(fieldsOf(custom([18, 26], 70, 61))).toEqual(['wind']);
  });

  it('acumula erros por campo', () => {
    expect(fieldsOf(custom([26, 18], 20, 90))).toEqual(['tempRange', 'humidity', 'wind']);
  });

  it('rotina de sono válida, inclusive cruzando meia-noite', () => {
    expect(validatePreferences(withSleep({ wakeTime: '07:00', sleepTime: '23:00' }))).toEqual([]);
    expect(validatePreferences(withSleep({ wakeTime: '14:00', sleepTime: '02:00' }))).toEqual([]);
  });

  it('formato de horário inválido nunca crasha', () => {
    expect(fieldsOf(withSleep({ wakeTime: '7h', sleepTime: '23:00' }))).toEqual(['sleep']);
    expect(fieldsOf(withSleep({ wakeTime: '07:00', sleepTime: '25:00' }))).toEqual(['sleep']);
  });

  it('acordar e dormir iguais é rejeitado', () => {
    expect(fieldsOf(withSleep({ wakeTime: '07:00', sleepTime: '07:00' }))).toEqual(['sleep']);
  });

  it('janela acordada menor que 6h é bloqueada com mensagem clara (§11)', () => {
    const errors = validatePreferences(withSleep({ wakeTime: '07:00', sleepTime: '12:00' }));
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('sleep');
    expect(errors[0].message).toMatch(/menos de 6 horas/);
  });

  it('janela de exatamente 6h passa', () => {
    expect(validatePreferences(withSleep({ wakeTime: '07:00', sleepTime: '13:00' }))).toEqual([]);
  });
});
