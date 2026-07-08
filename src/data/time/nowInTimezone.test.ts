import { nowInTimezone } from './nowInTimezone';

describe('nowInTimezone', () => {
  it('converte o instante para o wall-clock de São Paulo (UTC−3) no frame fake UTC', () => {
    const reference = new Date(Date.UTC(2026, 6, 8, 19, 30, 0)); // 19:30 UTC

    expect(nowInTimezone('America/Sao_Paulo', reference).getTime()).toBe(
      Date.UTC(2026, 6, 8, 16, 30, 0),
    );
  });

  it('converte para timezone à frente de UTC com virada de dia (Kiritimati, UTC+14)', () => {
    const reference = new Date(Date.UTC(2026, 6, 8, 19, 30, 0));

    expect(nowInTimezone('Pacific/Kiritimati', reference).getTime()).toBe(
      Date.UTC(2026, 6, 9, 9, 30, 0),
    );
  });

  it('meia-noite local não vira hora 24', () => {
    // 03:00 UTC = 00:00 em São Paulo
    const reference = new Date(Date.UTC(2026, 6, 9, 3, 0, 0));

    expect(nowInTimezone('America/Sao_Paulo', reference).getTime()).toBe(
      Date.UTC(2026, 6, 9, 0, 0, 0),
    );
  });
});
