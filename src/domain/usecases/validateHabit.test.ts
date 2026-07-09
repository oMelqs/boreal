import { buildHabit } from './testing/buildHabit';
import { validateHabit } from './validateHabit';

function fieldsOf(errors: ReturnType<typeof validateHabit>): string[] {
  return errors.map((error) => error.field);
}

describe('validateHabit', () => {
  it('hábito válido não tem erros', () => {
    expect(validateHabit(buildHabit())).toEqual([]);
    expect(
      validateHabit(
        buildHabit({ schedule: { kind: 'fixed', startTime: '19:00', endTime: '22:30' } }),
      ),
    ).toEqual([]);
  });

  it('nome fora de 2–40 caracteres (após trim) falha no campo name', () => {
    expect(fieldsOf(validateHabit(buildHabit({ name: ' a ' })))).toEqual(['name']);
    expect(fieldsOf(validateHabit(buildHabit({ name: 'x'.repeat(41) })))).toEqual(['name']);
    expect(validateHabit(buildHabit({ name: 'xx' }))).toEqual([]);
    expect(validateHabit(buildHabit({ name: 'x'.repeat(40) }))).toEqual([]);
  });

  it('days vazio falha no campo days', () => {
    expect(fieldsOf(validateHabit(buildHabit({ days: [] })))).toEqual(['days']);
  });

  it('horário fixo com fim antes ou igual ao início falha no campo schedule', () => {
    expect(
      fieldsOf(
        validateHabit(
          buildHabit({ schedule: { kind: 'fixed', startTime: '19:00', endTime: '18:00' } }),
        ),
      ),
    ).toEqual(['schedule']);
    expect(
      fieldsOf(
        validateHabit(
          buildHabit({ schedule: { kind: 'fixed', startTime: '19:00', endTime: '19:00' } }),
        ),
      ),
    ).toEqual(['schedule']);
  });

  it('formato de horário corrompido vira erro de validação, nunca crash', () => {
    expect(
      fieldsOf(
        validateHabit(
          buildHabit({ schedule: { kind: 'fixed', startTime: '25:99', endTime: '26:00' } }),
        ),
      ),
    ).toEqual(['schedule']);
    expect(
      fieldsOf(
        validateHabit(
          buildHabit({ schedule: { kind: 'fixed', startTime: '9:0', endTime: '10:00' } }),
        ),
      ),
    ).toEqual(['schedule']);
    expect(
      fieldsOf(
        validateHabit(
          buildHabit({
            schedule: { kind: 'flexible', durationMinutes: 60, earliest: 'zzz' },
          }),
        ),
      ),
    ).toEqual(['schedule']);
  });

  it('flexible: intervalo menor que a duração falha; bounds folgados passam', () => {
    expect(
      fieldsOf(
        validateHabit(
          buildHabit({
            schedule: {
              kind: 'flexible',
              durationMinutes: 120,
              earliest: '06:00',
              latest: '07:00',
            },
          }),
        ),
      ),
    ).toEqual(['schedule']);
    expect(
      validateHabit(
        buildHabit({
          schedule: { kind: 'flexible', durationMinutes: 60, earliest: '06:00', latest: '08:00' },
        }),
      ),
    ).toEqual([]);
    expect(
      validateHabit(
        buildHabit({ schedule: { kind: 'flexible', durationMinutes: 90, earliest: '06:00' } }),
      ),
    ).toEqual([]);
  });

  it('duração fora do conjunto permitido falha', () => {
    expect(
      fieldsOf(
        validateHabit(
          buildHabit({
            schedule: {
              kind: 'flexible',
              durationMinutes: 45 as unknown as 30,
            },
          }),
        ),
      ),
    ).toEqual(['schedule']);
  });

  it('erros de campos diferentes se acumulam', () => {
    const habit = buildHabit({
      name: '',
      days: [],
      schedule: { kind: 'fixed', startTime: '20:00', endTime: '19:00' },
    });

    expect(fieldsOf(validateHabit(habit)).sort()).toEqual(['days', 'name', 'schedule']);
  });
});
