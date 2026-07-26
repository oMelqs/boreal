import { getTodaySuggestions } from './getTodaySuggestions';
import { buildHabit } from './testing/buildHabit';
import { atHour, buildDay } from './testing/buildHourlyForecast';

// 2026-07-08 (dia base dos builders) é quarta-feira = 3
const WEDNESDAY = 3 as const;

const shower = buildHabit({
  id: 'shower',
  name: 'Banho quente',
  category: 'outro',
  outdoor: false,
  days: [WEDNESDAY],
  schedule: { kind: 'fixed', startTime: '21:00', endTime: '21:30' },
  skipOutfit: true,
});

const college = buildHabit({
  id: 'college',
  name: 'Faculdade',
  category: 'estudo',
  outdoor: false,
  days: [WEDNESDAY],
  schedule: { kind: 'fixed', startTime: '19:00', endTime: '22:30' },
});

describe('hábitos sem sugestão de roupa (§3.3)', () => {
  it('hábito marcado vira lembrete de horário, sem passar pela vestimenta', () => {
    const [suggestion] = getTodaySuggestions([shower], buildDay(0, 24), atHour(9));

    expect(suggestion).toEqual({ habit: shower, kind: 'info', when: 'hoje' });
  });

  it('hábito fixo comum continua recebendo vestimenta (regressão)', () => {
    const [suggestion] = getTodaySuggestions([college], buildDay(0, 24), atHour(9));

    expect(suggestion.kind).toBe('clothing');
  });

  it('vira lembrete mesmo quando a previsão não cobre o horário', () => {
    // Sem as horas da noite, um hábito comum viraria no-slot por falta de dados;
    // o lembrete não depende de previsão nenhuma.
    const [suggestion] = getTodaySuggestions([shower], buildDay(0, 12), atHour(9));

    expect(suggestion).toMatchObject({ kind: 'info' });
  });

  it('já passou hoje: mostra a ocorrência de amanhã como lembrete', () => {
    const daily = buildHabit({ ...shower, days: [WEDNESDAY, 4] });
    const [suggestion] = getTodaySuggestions([daily], buildDay(0, 48), atHour(23));

    expect(suggestion).toMatchObject({ kind: 'info', when: 'amanha' });
  });

  it('hábito salvo antes desta feature segue com vestimenta', () => {
    const { skipOutfit, ...legacy } = shower;
    const [suggestion] = getTodaySuggestions([legacy], buildDay(0, 24), atHour(9));

    expect(suggestion.kind).toBe('clothing');
  });
});
