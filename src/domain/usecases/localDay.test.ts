import { sameLocalDay, splitByLocalDay, weekdayOf } from './localDay';
import { atHour, buildDay } from './testing/buildHourlyForecast';

describe('localDay', () => {
  it('sameLocalDay compara o calendário do frame fake-UTC', () => {
    expect(sameLocalDay(atHour(0), atHour(23))).toBe(true);
    expect(sameLocalDay(atHour(23), new Date(atHour(23).getTime() + 60 * 60 * 1000))).toBe(false);
  });

  it('weekdayOf usa o dia da semana local (2026-07-08 é quarta = 3)', () => {
    expect(weekdayOf(atHour(12))).toBe(3);
    expect(weekdayOf(new Date(Date.UTC(2026, 6, 12)))).toBe(0); // domingo
  });

  it('splitByLocalDay separa 48h em hoje e amanhã, inclusive na fronteira da meia-noite', () => {
    const today = buildDay(0, 24);
    const tomorrow = buildDay(24, 24); // atHour(24) = dia seguinte 00:00
    const { today: todayHours, tomorrow: tomorrowHours } = splitByLocalDay(
      [...today, ...tomorrow],
      atHour(21),
    );

    expect(todayHours).toHaveLength(24);
    expect(tomorrowHours).toHaveLength(24);
    expect(todayHours[23].time.getUTCHours()).toBe(23);
    expect(tomorrowHours[0].time.getUTCHours()).toBe(0);
    expect(tomorrowHours[0].time.getUTCDate()).toBe(9);
  });

  it('descarta horas fora de hoje/amanhã (cache velho)', () => {
    const stale = buildDay(0, 2).map((hour) => ({
      ...hour,
      time: new Date(hour.time.getTime() - 3 * 24 * 60 * 60 * 1000),
    }));

    const { today, tomorrow } = splitByLocalDay([...stale, ...buildDay(10, 2)], atHour(9));

    expect(today).toHaveLength(2);
    expect(tomorrow).toHaveLength(0);
  });
});
