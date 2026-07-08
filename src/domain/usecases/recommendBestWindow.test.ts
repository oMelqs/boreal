import { recommendBestWindow } from './recommendBestWindow';
import { atHour, buildDay, buildHour } from './testing/buildHourlyForecast';

describe('recommendBestWindow', () => {
  it('dia perfeito: recomenda a melhor janela do fim de tarde com score alto', () => {
    // 9h–19h de dia; 17h e 18h perfeitas, resto com pequenas penalidades
    const hours = buildDay(9, 11, {
      9: { windSpeed: 22 },
      10: { windSpeed: 22 },
      11: { windSpeed: 20 },
      12: { apparentTemp: 29, uvIndex: 8 },
      13: { apparentTemp: 30, uvIndex: 9 },
      14: { apparentTemp: 30, uvIndex: 9 },
      15: { apparentTemp: 29, uvIndex: 8 },
      16: { apparentTemp: 28 },
      19: { windSpeed: 18 },
    });

    const result = recommendBestWindow(hours, atHour(9));

    expect(result).toEqual({
      kind: 'window',
      start: atHour(17),
      end: atHour(19),
      averageScore: { value: 100, label: 'otimo' },
      reasons: ['temperatura agradável (24 °C)', 'baixa chance de chuva', 'vento leve'],
    });
  });

  it('consulta às 16h com boa janela 17h–19h: caso exato do enunciado', () => {
    const hours = buildDay(6, 14, {
      // manhã e começo de tarde medianos
      6: { apparentTemp: 15 },
      7: { apparentTemp: 16 },
      12: { apparentTemp: 30 },
      13: { apparentTemp: 31 },
      14: { apparentTemp: 31 },
      15: { apparentTemp: 30 },
      16: { apparentTemp: 31 },
      19: { windSpeed: 25 },
    });

    const result = recommendBestWindow(hours, atHour(16));

    expect(result).toMatchObject({
      kind: 'window',
      start: atHour(17),
      end: atHour(19),
      averageScore: { value: 100, label: 'otimo' },
    });
    expect(result.kind === 'window' && result.reasons[0]).toBe('temperatura agradável (24 °C)');
    expect(result.kind === 'window' && result.caveat).toBeUndefined();
  });

  it('inclui a hora atual como elegível (a partir da hora atual, inclusive)', () => {
    const hours = buildDay(16, 3); // 16h, 17h, 18h perfeitas
    const result = recommendBestWindow(hours, atHour(16, 30));

    expect(result).toMatchObject({ kind: 'window', start: atHour(16), end: atHour(18) });
  });

  it('dia todo chuvoso: recomenda mesmo assim, com caveat honesto do motivo dominante', () => {
    const hours = buildDay(10, 8, {}).map((hour) => ({
      ...hour,
      precipitationProb: 85,
      precipitationMm: 2,
    }));

    const result = recommendBestWindow(hours, atHour(10));

    expect(result).toMatchObject({
      kind: 'window',
      averageScore: { value: 24, label: 'ruim' },
      caveat: 'chuva provável (85%)',
    });
    expect(result.kind === 'window' && result.reasons[0]).toBe('chuva provável (85%)');
  });

  it('consulta à noite: retorna day-over sem inventar recomendação', () => {
    const hours = [
      ...buildDay(18, 2),
      ...buildDay(20, 4).map((hour) => ({ ...hour, isDay: false })),
    ];

    expect(recommendBestWindow(hours, atHour(21))).toEqual({ kind: 'day-over' });
    expect(recommendBestWindow(hours, atHour(21, 45))).toEqual({ kind: 'day-over' });
  });

  it('sem horas futuras restantes: retorna day-over', () => {
    expect(recommendBestWindow(buildDay(8, 4), atHour(20))).toEqual({ kind: 'day-over' });
  });

  it('apenas 1 hora elegível restante: day-over (janela mínima é 2h)', () => {
    const hours = [buildHour({ time: atHour(17) }), buildHour({ time: atHour(18), isDay: false })];

    expect(recommendBestWindow(hours, atHour(17))).toEqual({ kind: 'day-over' });
  });

  it('empate de score médio: janela mais cedo vence', () => {
    // dois pares perfeitos (10–11 e 13–14) separados por hora ruim
    const hours = buildDay(10, 5, {
      12: { precipitationProb: 90, precipitationMm: 3 },
    });

    const result = recommendBestWindow(hours, atHour(10));

    expect(result).toMatchObject({ kind: 'window', start: atHour(10), end: atHour(12) });
  });

  it('empate entre janela de 2h e de 3h: prefere 2h (mais precisa)', () => {
    // três horas perfeitas consecutivas: [10,11] empata com [10,11,12]
    const hours = buildDay(10, 3);

    const result = recommendBestWindow(hours, atHour(10));

    expect(result).toMatchObject({ kind: 'window', start: atHour(10), end: atHour(12) });
  });

  it('campos null intercalados: pula horas sem dados e não quebra a contiguidade indevidamente', () => {
    const hours = buildDay(10, 6, {
      10: { windSpeed: 20 },
      11: { windSpeed: 20 },
      12: { apparentTemp: null }, // buraco no meio do dia
      15: { apparentTemp: 30 },
    });

    const result = recommendBestWindow(hours, atHour(10));

    // [13,14] (perfeitas) vence; janela nunca atravessa a hora sem dados
    expect(result).toMatchObject({
      kind: 'window',
      start: atHour(13),
      end: atHour(15),
      averageScore: { value: 100, label: 'otimo' },
    });
  });

  it('todas as horas de dia restantes sem dados: retorna no-data (erro, não fim de dia)', () => {
    const hours = buildDay(10, 4).map((hour) => ({ ...hour, apparentTemp: null }));

    expect(recommendBestWindow(hours, atHour(10))).toEqual({ kind: 'no-data' });
  });

  it('ordena as razões pela influência no score e corta em 3 fatores', () => {
    // calor (−28) > chuvisco (−24) > UV alto (−12) > vento moderado (−10)
    const hours = buildDay(10, 3).map((hour) => ({
      ...hour,
      apparentTemp: 33,
      precipitationProb: 40,
      windSpeed: 25,
      uvIndex: 9,
    }));

    const result = recommendBestWindow(hours, atHour(10));

    expect(result).toMatchObject({
      kind: 'window',
      reasons: [
        'calor de 33 °C',
        'pode chuviscar, leve um guarda-chuva',
        'protetor solar recomendado',
      ],
      caveat: 'calor de 33 °C',
    });
  });

  it('descreve frio e vento forte quando são os fatores da janela', () => {
    // chuva provável (−36) > frio (−32) > vento forte (−30)
    const hours = buildDay(10, 2).map((hour) => ({
      ...hour,
      apparentTemp: 10,
      precipitationProb: 60,
      windSpeed: 40,
    }));

    const result = recommendBestWindow(hours, atHour(10));

    expect(result).toMatchObject({
      kind: 'window',
      reasons: ['chuva provável (60%)', 'frio de 10 °C', 'vento forte (40 km/h)'],
      caveat: 'chuva provável (60%)',
    });
  });

  describe('timezone da cidade ≠ timezone do device', () => {
    const originalTz = process.env.TZ;

    afterEach(() => {
      if (originalTz === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTz;
      }
    });

    it('resultado idêntico com TZ do processo diferente (motor agnóstico a timezone)', () => {
      const hours = buildDay(6, 14, { 16: { apparentTemp: 31 } });
      const now = atHour(16);

      const before = recommendBestWindow(hours, now);
      process.env.TZ = 'Pacific/Kiritimati'; // UTC+14, o extremo
      const after = recommendBestWindow(hours, now);

      expect(after).toEqual(before);
      expect(after).toMatchObject({ kind: 'window' });
    });
  });
});
