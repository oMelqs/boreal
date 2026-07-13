import { getCurrentConditions } from './getCurrentConditions';
import { atHour, buildDay, buildHour } from './testing/buildHourlyForecast';

describe('getCurrentConditions', () => {
  it('devolve a hora cujo início casa com o relógio atual, com score', () => {
    const hours = buildDay(10, 5); // 10h..14h, todas agradáveis
    // 12h37 cai na hora que começa às 12h.
    const current = getCurrentConditions(hours, atHour(12, 37));

    expect(current).not.toBeNull();
    expect(current?.hour.time).toEqual(atHour(12));
    expect(current?.score).toEqual({ value: 100, label: 'otimo' });
  });

  it('casa exatamente no início da hora', () => {
    const hours = buildDay(6, 3);
    expect(getCurrentConditions(hours, atHour(6))?.hour.time).toEqual(atHour(6));
  });

  it('devolve null quando o forecast não cobre a hora atual', () => {
    const hours = buildDay(10, 3); // 10h..12h
    expect(getCurrentConditions(hours, atHour(14))).toBeNull();
  });

  it('devolve null para forecast vazio', () => {
    expect(getCurrentConditions([], atHour(12))).toBeNull();
  });

  it('preserva score null quando a hora tem dados faltantes', () => {
    const hours = [buildHour({ time: atHour(9), apparentTemp: null })];
    const current = getCurrentConditions(hours, atHour(9, 5));

    expect(current?.hour.time).toEqual(atHour(9));
    expect(current?.score).toBeNull();
  });
});
