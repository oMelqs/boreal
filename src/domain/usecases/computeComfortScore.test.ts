import { computeComfortBreakdown, computeComfortScore } from './computeComfortScore';
import { buildHour } from './testing/buildHourlyForecast';

describe('computeComfortScore', () => {
  it('dá score 100 para hora na faixa ideal sem chuva, vento ou UV alto', () => {
    const score = computeComfortScore(buildHour());

    expect(score).toEqual({ value: 100, label: 'otimo' });
  });

  describe('penalidade de temperatura (sensação térmica)', () => {
    it('não penaliza dentro da faixa ideal 18–26 °C', () => {
      expect(computeComfortScore(buildHour({ apparentTemp: 18 }))?.value).toBe(100);
      expect(computeComfortScore(buildHour({ apparentTemp: 26 }))?.value).toBe(100);
    });

    it('penaliza 4 pontos por °C de desvio acima da faixa', () => {
      // 30 °C = 4 °C acima de 26 → −16
      expect(computeComfortScore(buildHour({ apparentTemp: 30 }))?.value).toBe(84);
    });

    it('penaliza 4 pontos por °C de desvio abaixo da faixa', () => {
      // 13 °C = 5 °C abaixo de 18 → −20
      expect(computeComfortScore(buildHour({ apparentTemp: 13 }))?.value).toBe(80);
    });

    it('limita a penalidade de temperatura em 50', () => {
      // 45 °C = 19 °C de desvio → 76, cap em 50
      expect(computeComfortBreakdown(buildHour({ apparentTemp: 45 }))?.penalties.temp).toBe(50);
    });
  });

  describe('penalidade de chuva', () => {
    it('penaliza probabilidade × 0,6', () => {
      // 70% → −42
      expect(
        computeComfortScore(buildHour({ precipitationProb: 70, precipitationMm: 0 }))?.value,
      ).toBe(58);
    });

    it('adiciona −25 fixo quando há chuva efetiva prevista (> 0,5 mm)', () => {
      const breakdown = computeComfortBreakdown(
        buildHour({ precipitationProb: 70, precipitationMm: 1.2 }),
      );

      expect(breakdown?.penalties.rain).toBe(70 * 0.6 + 25);
    });

    it('não adiciona a penalidade fixa para precipitação ≤ 0,5 mm', () => {
      const breakdown = computeComfortBreakdown(
        buildHour({ precipitationProb: 0, precipitationMm: 0.5 }),
      );

      expect(breakdown?.penalties.rain).toBe(0);
    });
  });

  describe('penalidade de vento', () => {
    it('não penaliza até 15 km/h', () => {
      expect(computeComfortBreakdown(buildHour({ windSpeed: 15 }))?.penalties.wind).toBe(0);
    });

    it('penaliza linearmente entre 15 e 30 km/h', () => {
      expect(computeComfortBreakdown(buildHour({ windSpeed: 22 }))?.penalties.wind).toBe(7);
      expect(computeComfortBreakdown(buildHour({ windSpeed: 30 }))?.penalties.wind).toBe(15);
    });

    it('penaliza 1,5 por km/h acima de 30, com teto de 35', () => {
      // 40 km/h → 15 + 1,5 × 10 = 30
      expect(computeComfortBreakdown(buildHour({ windSpeed: 40 }))?.penalties.wind).toBe(30);
      // 50 km/h → 15 + 1,5 × 20 = 45, cap em 35
      expect(computeComfortBreakdown(buildHour({ windSpeed: 50 }))?.penalties.wind).toBe(35);
    });
  });

  describe('penalidade de UV', () => {
    it.each([
      [3, 0],
      [5, 0],
      [5.5, 5], // valor contínuo no "gap" do spec cai na faixa de −5
      [7, 5],
      [8, 12],
      [10.9, 12],
      [11, 20],
    ])('uv %p → penalidade %p', (uvIndex, expected) => {
      expect(computeComfortBreakdown(buildHour({ uvIndex }))?.penalties.uv).toBe(expected);
    });
  });

  it('limita o score final em 0 quando as penalidades passam de 100', () => {
    const score = computeComfortScore(
      buildHour({
        apparentTemp: 45, // −50 (cap)
        precipitationProb: 100, // −60
        precipitationMm: 3, // −25
        windSpeed: 60, // −35 (cap)
        uvIndex: 11, // −20
      }),
    );

    expect(score).toEqual({ value: 0, label: 'ruim' });
  });

  describe('classificação para UI', () => {
    it('rotula pelas fronteiras ≥75 ótimo, ≥50 bom, ≥25 razoável, <25 ruim', () => {
      // score 76: prob 40 → −24
      expect(computeComfortScore(buildHour({ precipitationProb: 40 }))?.label).toBe('otimo');
      // score 70: prob 50 → −30
      expect(computeComfortScore(buildHour({ precipitationProb: 50 }))?.label).toBe('bom');
      // score 40: prob 100 → −60
      expect(computeComfortScore(buildHour({ precipitationProb: 100 }))?.label).toBe('razoavel');
      // score 15: prob 100 e chuva efetiva → −85
      expect(
        computeComfortScore(buildHour({ precipitationProb: 100, precipitationMm: 2 }))?.label,
      ).toBe('ruim');
    });
  });

  describe('dados faltantes', () => {
    it.each([
      ['apparentTemp'],
      ['precipitationProb'],
      ['precipitationMm'],
      ['windSpeed'],
      ['uvIndex'],
    ] as const)('retorna null quando %s é null', (field) => {
      expect(computeComfortScore(buildHour({ [field]: null }))).toBeNull();
    });

    it('ignora campos não usados no cálculo (temp e weatherCode podem ser null)', () => {
      expect(computeComfortScore(buildHour({ temp: null, weatherCode: null }))?.value).toBe(100);
    });
  });
});
