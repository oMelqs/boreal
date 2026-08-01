import type { WidgetSnapshot } from '@/domain/entities/widgetSnapshot';
import { WIDGET_SCHEMA_VERSION } from '@/domain/entities/widgetSnapshot';

import { toWidgetPayload } from './toWidgetPayload';

function buildSnapshot(overrides: Partial<WidgetSnapshot> = {}): WidgetSnapshot {
  return {
    schemaVersion: WIDGET_SCHEMA_VERSION,
    generatedAt: '2026-07-08T15:00:00.000Z',
    cityName: 'Joinville',
    now: {
      temp: 23,
      apparentTemp: 24,
      weatherCode: 1,
      isDay: true,
      outfit: {
        level: 'leve',
        accessories: ['protetor-solar', 'agua'],
        summary: 'Roupa leve resolve.',
      },
    },
    hours: [
      { hour: 15, temp: 23, rainProb: 10, weatherCode: 1, isDay: true },
      { hour: 16, temp: 21, rainProb: 60, weatherCode: 61, isDay: true },
    ],
    nextHabit: null,
    habits: [],
    ...overrides,
  };
}

describe('toWidgetPayload', () => {
  it('traduz a condição de agora em texto e ícone', () => {
    const payload = toWidgetPayload(buildSnapshot());

    expect(payload.temp).toBe('23°');
    expect(payload.apparentTemp).toBe('24°');
    expect(payload.icon).toBe('🌤️');
    expect(payload.description).toBe('parcialmente nublado');
    expect(payload.cityName).toBe('Joinville');
  });

  it('usa os mesmos emoji e rótulo de agasalho das telas', () => {
    const payload = toWidgetPayload(buildSnapshot());

    expect(payload.outfitEmoji).toBe('👕');
    expect(payload.outfitLabel).toBe('Roupa leve');
    expect(payload.outfitSummary).toBe('Roupa leve resolve.');
    expect(payload.accessories).toBe('🧴 💧');
  });

  it('sem roupa (noite ou sem dado), os campos de vestimenta vêm vazios', () => {
    const payload = toWidgetPayload(
      buildSnapshot({
        now: { temp: 14, apparentTemp: 13, weatherCode: 0, isDay: false, outfit: null },
      }),
    );

    expect(payload.outfitEmoji).toBe('');
    expect(payload.outfitLabel).toBe('');
    expect(payload.outfitSummary).toBe('');
    expect(payload.accessories).toBe('');
    expect(payload.icon).toBe('🌙'); // ícone noturno do mesmo código
  });

  it('mostra a chance de chuva só quando ela muda a decisão', () => {
    const payload = toWidgetPayload(buildSnapshot());

    expect(payload.hours[0]).toEqual({ label: '15h', temp: '23°', icon: '🌤️', rain: '' });
    expect(payload.hours[1]).toMatchObject({ label: '16h', temp: '21°', rain: '60%' });
  });

  it('hábito de horário fixo mostra a faixa do cadastro e a frase da roupa', () => {
    const payload = toWidgetPayload(
      buildSnapshot({
        nextHabit: {
          id: 'college',
          name: 'Faculdade',
          when: 'hoje',
          ownComfort: false,
          timeRange: { kind: 'fixed', startTime: '19:00', endTime: '22:30' },
          kind: 'clothing',
          outfit: { level: 'casaco', accessories: [], summary: 'Leve um casaco.' },
        },
      }),
    );

    expect(payload.habit).toEqual({
      name: 'Faculdade',
      time: '19:00–22:30',
      detail: 'Leve um casaco.',
      ownComfort: false,
      tomorrow: false,
    });
  });

  it('hábito de janela junta os porquês numa frase só', () => {
    const payload = toWidgetPayload(
      buildSnapshot({
        nextHabit: {
          id: 'walk',
          name: 'Caminhada',
          when: 'amanha',
          ownComfort: true,
          timeRange: { kind: 'window', startHour: 14, endHour: 16 },
          kind: 'window',
          score: { value: 88, label: 'otimo' },
          reasons: ['temperatura agradável (24 °C)', 'baixa chance de chuva'],
        },
      }),
    );

    expect(payload.habit).toMatchObject({
      time: '14h–16h',
      detail: 'Temperatura agradável (24 °C) e baixa chance de chuva.',
      ownComfort: true,
      tomorrow: true,
    });
  });

  it('sem hábito no dia, o bloco vem nulo', () => {
    expect(toWidgetPayload(buildSnapshot()).habit).toBeNull();
  });
});
