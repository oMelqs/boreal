import type { SleepSchedule } from '../entities/preferences';

const MINUTES_PER_DAY = 24 * 60;
const MINUTE_MS = 60 * 1000;

/** Janela acordada contínua no frame fake-UTC: [start, end). */
export type AwakeCycle = {
  start: Date;
  end: Date;
};

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Duração acordada em minutos. Rotina que cruza meia-noite (dormir 01:00)
 * conta as horas do dia seguinte: 14:00 → 02:00 = 12h. `wakeTime` igual a
 * `sleepTime` é bloqueado na validação; aqui viraria 0.
 */
export function awakeDurationMinutes(sleep: SleepSchedule): number {
  return (
    (parseMinutes(sleep.sleepTime) - parseMinutes(sleep.wakeTime) + MINUTES_PER_DAY) %
    MINUTES_PER_DAY
  );
}

/** Instante do "HH:mm" no dia local de `reference` (+ deslocamento em dias). */
function atTime(reference: Date, minutes: number, dayOffset: number): Date {
  const dayStart = Date.UTC(
    reference.getUTCFullYear(),
    reference.getUTCMonth(),
    reference.getUTCDate() + dayOffset,
  );
  return new Date(dayStart + minutes * MINUTE_MS);
}

/**
 * Ciclo acordado corrente (§6.1): a janela [acordar, dormir) que contém `now`
 * ou, se a pessoa está dormindo, a próxima. É o que define "hoje" nos motores
 * — às 00h30 de quem dorme à 01h00, o ciclo começou ontem e ainda não acabou.
 *
 * `now` no frame fake-UTC (wall-clock da cidade codificado como UTC), como
 * todo o motor.
 */
export function currentAwakeCycle(now: Date, sleep: SleepSchedule): AwakeCycle {
  const wakeMinutes = parseMinutes(sleep.wakeTime);
  const durationMs = awakeDurationMinutes(sleep) * MINUTE_MS;

  // Candidatos: acordou ontem (ciclo cruzando a meia-noite), hoje ou amanhã.
  for (const dayOffset of [-1, 0]) {
    const start = atTime(now, wakeMinutes, dayOffset);
    const end = new Date(start.getTime() + durationMs);
    if (now.getTime() >= start.getTime() && now.getTime() < end.getTime()) {
      return { start, end };
    }
  }

  const todayStart = atTime(now, wakeMinutes, 0);
  const start =
    now.getTime() < todayStart.getTime() ? todayStart : atTime(now, wakeMinutes, 1);
  return { start, end: new Date(start.getTime() + durationMs) };
}

/** Hora do forecast elegível: começa dentro do ciclo acordado. */
export function isWithinAwakeCycle(time: Date, cycle: AwakeCycle): boolean {
  return time.getTime() >= cycle.start.getTime() && time.getTime() < cycle.end.getTime();
}
