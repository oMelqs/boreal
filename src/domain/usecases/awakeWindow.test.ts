import type { SleepSchedule } from '../entities/preferences';
import { awakeDurationMinutes, currentAwakeCycle, isWithinAwakeCycle } from './awakeWindow';

/** Instante fake-UTC do dia base dos testes (2026-07-08) + deslocamento de dias. */
function at(hour: number, minute = 0, dayOffset = 0): Date {
  return new Date(Date.UTC(2026, 6, 8 + dayOffset, hour, minute));
}

const routine: SleepSchedule = { wakeTime: '07:00', sleepTime: '23:00' };
const nightOwl: SleepSchedule = { wakeTime: '14:00', sleepTime: '02:00' };

describe('awakeDurationMinutes', () => {
  it('rotina no mesmo dia: 07:00–23:00 = 16h', () => {
    expect(awakeDurationMinutes(routine)).toBe(16 * 60);
  });

  it('rotina cruzando meia-noite: 14:00–02:00 = 12h', () => {
    expect(awakeDurationMinutes(nightOwl)).toBe(12 * 60);
  });

  it('dormir 01:00 acordando 07:00 = 18h', () => {
    expect(awakeDurationMinutes({ wakeTime: '07:00', sleepTime: '01:00' })).toBe(18 * 60);
  });
});

describe('currentAwakeCycle', () => {
  it('durante o dia, o ciclo é o de hoje', () => {
    const cycle = currentAwakeCycle(at(10), routine);
    expect(cycle.start).toEqual(at(7));
    expect(cycle.end).toEqual(at(23));
  });

  it('antes de acordar, o ciclo é o que ainda vai começar hoje', () => {
    const cycle = currentAwakeCycle(at(5, 30), routine);
    expect(cycle.start).toEqual(at(7));
    expect(cycle.end).toEqual(at(23));
  });

  it('depois de dormir, o ciclo é o de amanhã', () => {
    const cycle = currentAwakeCycle(at(23, 30), routine);
    expect(cycle.start).toEqual(at(7, 0, 1));
    expect(cycle.end).toEqual(at(23, 0, 1));
  });

  it('às 00h30 de quem dorme à 01h00, o ciclo começou ontem e ainda não acabou', () => {
    const cycle = currentAwakeCycle(at(0, 30), { wakeTime: '07:00', sleepTime: '01:00' });
    expect(cycle.start).toEqual(at(7, 0, -1));
    expect(cycle.end).toEqual(at(1));
  });

  it('rotina 14h–02h: à 01h00 o ciclo é o de ontem; às 13h o de hoje ainda não começou', () => {
    const lateCycle = currentAwakeCycle(at(1), nightOwl);
    expect(lateCycle.start).toEqual(at(14, 0, -1));
    expect(lateCycle.end).toEqual(at(2));

    const preCycle = currentAwakeCycle(at(13), nightOwl);
    expect(preCycle.start).toEqual(at(14));
    expect(preCycle.end).toEqual(at(2, 0, 1));
  });

  it('exatamente no horário de dormir, o ciclo já é o próximo', () => {
    const cycle = currentAwakeCycle(at(23), routine);
    expect(cycle.start).toEqual(at(7, 0, 1));
  });
});

describe('isWithinAwakeCycle', () => {
  const cycle = currentAwakeCycle(at(10), routine);

  it('inclui o início e exclui o fim', () => {
    expect(isWithinAwakeCycle(at(7), cycle)).toBe(true);
    expect(isWithinAwakeCycle(at(22), cycle)).toBe(true);
    expect(isWithinAwakeCycle(at(23), cycle)).toBe(false);
    expect(isWithinAwakeCycle(at(6), cycle)).toBe(false);
  });

  it('horas de madrugada do dia seguinte pertencem ao ciclo cruzado', () => {
    const crossed = currentAwakeCycle(at(20), nightOwl);
    expect(isWithinAwakeCycle(at(0, 0, 1), crossed)).toBe(true);
    expect(isWithinAwakeCycle(at(1, 0, 1), crossed)).toBe(true);
    expect(isWithinAwakeCycle(at(2, 0, 1), crossed)).toBe(false);
  });
});
