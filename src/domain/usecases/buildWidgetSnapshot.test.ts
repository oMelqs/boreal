import type { City } from '../entities/city';
import { DEFAULT_USER_PREFERENCES } from '../entities/preferences';
import { WIDGET_SCHEMA_VERSION } from '../entities/widgetSnapshot';
import { buildWidgetSnapshot } from './buildWidgetSnapshot';
import { buildHabit } from './testing/buildHabit';
import { atHour, buildDay } from './testing/buildHourlyForecast';

// 2026-07-08 (dia base dos builders) é quarta-feira = 3
const WEDNESDAY = 3 as const;

const joinville: City = {
  id: 3448439,
  name: 'Joinville',
  country: 'Brasil',
  latitude: -26.3,
  longitude: -48.84,
  timezone: 'America/Sao_Paulo',
};

/** Instante real da geração — só o carimbo, não entra no cálculo. */
const GENERATED_AT = new Date('2026-07-08T15:00:00.000Z');

const college = buildHabit({
  id: 'college',
  name: 'Faculdade',
  category: 'estudo',
  outdoor: false,
  days: [WEDNESDAY],
  schedule: { kind: 'fixed', startTime: '19:00', endTime: '22:30' },
});

const walk = buildHabit({
  id: 'walk',
  name: 'Caminhada',
  days: [WEDNESDAY],
  schedule: { kind: 'flexible', durationMinutes: 60 },
});

/** Dia inteiro utilizável, com noite marcada fora do horário comercial. */
function fullDay() {
  const nights: Record<number, { isDay: boolean }> = {};
  for (const hour of [0, 1, 2, 3, 4, 5, 20, 21, 22, 23]) {
    nights[hour] = { isDay: false };
  }
  return buildDay(0, 24, nights);
}

function build(overrides: Partial<Parameters<typeof buildWidgetSnapshot>[0]> = {}) {
  return buildWidgetSnapshot({
    city: joinville,
    forecast: fullDay(),
    habits: [],
    now: atHour(12),
    generatedAt: GENERATED_AT,
    ...overrides,
  });
}

describe('buildWidgetSnapshot', () => {
  it('carimba versão, cidade e o instante real da geração', () => {
    const snapshot = build();

    expect(snapshot.schemaVersion).toBe(WIDGET_SCHEMA_VERSION);
    expect(snapshot.cityName).toBe('Joinville');
    expect(snapshot.generatedAt).toBe('2026-07-08T15:00:00.000Z');
  });

  it('descreve a hora atual e sugere roupa para sair agora', () => {
    const snapshot = build();

    expect(snapshot.now.temp).toBe(23);
    expect(snapshot.now.apparentTemp).toBe(24);
    expect(snapshot.now.isDay).toBe(true);
    expect(snapshot.now.outfit).not.toBeNull();
    expect(snapshot.now.outfit?.level).toBe('leve');
    expect(snapshot.now.outfit?.summary.length).toBeGreaterThan(0);
  });

  it('lista as próximas horas a partir de agora, no limite pedido', () => {
    const snapshot = build({ hoursAhead: 4 });

    expect(snapshot.hours).toHaveLength(4);
    expect(snapshot.hours.map((hour) => hour.hour)).toEqual([12, 13, 14, 15]);
    expect(snapshot.hours[0]).toMatchObject({ temp: 23, rainProb: 0, weatherCode: 1 });
  });

  it('pede mais horas do que o dia tem e recebe só o que existe', () => {
    const snapshot = build({ now: atHour(21), hoursAhead: 6 });

    expect(snapshot.hours).toHaveLength(3); // 21h, 22h e 23h
  });

  it('hábito de horário fixo vira vestimenta com o horário do cadastro', () => {
    const snapshot = build({ habits: [college] });

    expect(snapshot.habits).toHaveLength(1);
    const habit = snapshot.habits[0];
    expect(habit).toMatchObject({ id: 'college', kind: 'clothing', when: 'hoje' });
    expect(habit.timeRange).toEqual({ kind: 'fixed', startTime: '19:00', endTime: '22:30' });
    expect(habit.kind === 'clothing' && habit.outfit.summary.length).toBeTruthy();
  });

  it('hábito livre vira janela com score, porquês e as horas cheias', () => {
    const snapshot = build({ habits: [walk] });

    const habit = snapshot.habits[0];
    expect(habit.kind).toBe('window');
    if (habit.kind !== 'window') throw new Error('esperava janela');
    expect(habit.score.value).toBeGreaterThan(0);
    expect(habit.score.label).toBeDefined();
    expect(habit.reasons.length).toBeGreaterThan(0);
    expect(habit.timeRange.kind).toBe('window');
  });

  it('hábito que dispensa roupa vira lembrete, sem frase de vestimenta', () => {
    const shower = buildHabit({
      id: 'shower',
      name: 'Banho quente',
      category: 'outro',
      outdoor: false,
      days: [WEDNESDAY],
      schedule: { kind: 'fixed', startTime: '21:00', endTime: '21:30' },
      skipOutfit: true,
    });
    const snapshot = build({ habits: [shower] });

    expect(snapshot.habits[0]).toMatchObject({ id: 'shower', kind: 'info' });
    expect(snapshot.habits[0]).not.toHaveProperty('outfit');
  });

  it('marca o hábito que usa conforto próprio', () => {
    const beach = buildHabit({
      id: 'beach',
      name: 'Praia',
      days: [WEDNESDAY],
      comfortOverride: { kind: 'custom', idealTempRange: [27, 34], maxHumidity: 70, maxWind: 20 },
    });
    const snapshot = build({ habits: [beach, walk] });

    const byId = Object.fromEntries(snapshot.habits.map((habit) => [habit.id, habit]));
    expect(byId.beach.ownComfort).toBe(true);
    expect(byId.walk.ownComfort).toBe(false);
  });

  it('sem hábitos no dia, o painel fica vazio e sem próximo', () => {
    const snapshot = build({ habits: [buildHabit({ days: [0] })] }); // domingo

    expect(snapshot.habits).toEqual([]);
    expect(snapshot.nextHabit).toBeNull();
  });

  it('o próximo hábito é o primeiro da lista já ordenada', () => {
    const snapshot = build({ habits: [college, walk] });

    expect(snapshot.nextHabit).toEqual(snapshot.habits[0]);
  });

  it('fora do ciclo acordado não sugere roupa, mas ainda lista as horas', () => {
    const snapshot = build({
      now: atHour(3),
      preferences: {
        ...DEFAULT_USER_PREFERENCES,
        sleep: { wakeTime: '07:00', sleepTime: '23:00' },
      },
    });

    expect(snapshot.now.outfit).toBeNull();
    expect(snapshot.hours.length).toBeGreaterThan(0);
  });

  it('hora atual sem dado não derruba o snapshot', () => {
    const snapshot = build({
      forecast: buildDay(0, 24, { 12: { temp: null, apparentTemp: null } }),
    });

    expect(snapshot.now.outfit).toBeNull();
    // A hora sem dado sai da lista; a seguinte assume a frente.
    expect(snapshot.hours[0]?.hour).toBe(13);
  });

  it('o payload sobrevive a uma ida e volta por JSON', () => {
    const snapshot = build({ habits: [college, walk] });

    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  });
});
