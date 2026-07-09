import type { HourlyForecast } from '../entities/hourlyForecast';
import { suggestOutfit, type SuggestOutfitInput } from './suggestOutfit';
import { buildHour } from './testing/buildHourlyForecast';

function outfitAt(apparentTemp: number, extra: Partial<SuggestOutfitInput> = {}) {
  return suggestOutfit({
    atStart: buildHour({ apparentTemp }),
    intensity: 'leve',
    outdoor: true,
    ...extra,
  });
}

function calmHour(overrides: Partial<HourlyForecast> = {}): HourlyForecast {
  return buildHour({ precipitationProb: 0, precipitationMm: 0, windSpeed: 5, uvIndex: 2, ...overrides });
}

describe('suggestOutfit', () => {
  describe('tabela de agasalho (§5.1) com fronteiras exatas', () => {
    it.each([
      [9.9, 'casaco-pesado'],
      [10, 'casaco'],
      [14.9, 'casaco'],
      [15, 'camada-leve'],
      [19.9, 'camada-leve'],
      [20, 'leve'],
      [25.9, 'leve'],
      [26, 'bem-leve'],
    ] as const)('sensação %p °C → %s', (apparentTemp, expected) => {
      expect(outfitAt(apparentTemp)?.outfit).toBe(expected);
    });
  });

  describe('ajustes por intensidade', () => {
    it('intensa sempre sobe uma faixa (o corpo esquenta)', () => {
      expect(outfitAt(12, { intensity: 'intensa' })?.outfit).toBe('camada-leve');
      expect(outfitAt(22, { intensity: 'intensa' })?.outfit).toBe('bem-leve');
    });

    it('intensa no calor extremo mantém o teto bem-leve', () => {
      expect(outfitAt(30, { intensity: 'intensa' })?.outfit).toBe('bem-leve');
    });

    it('moderada sobe uma faixa apenas abaixo de 15 °C', () => {
      expect(outfitAt(14, { intensity: 'moderada' })?.outfit).toBe('camada-leve');
      expect(outfitAt(16, { intensity: 'moderada' })?.outfit).toBe('camada-leve');
    });

    it('indoor não recebe ajuste de intensidade (vale para o deslocamento)', () => {
      const result = outfitAt(12, { intensity: 'intensa', outdoor: false });

      expect(result?.outfit).toBe('casaco');
      expect(result?.summary).toContain('para o caminho até lá');
    });
  });

  describe('acessórios (§5.2)', () => {
    it('chuva na volta e não na ida → guarda-chuva com a frase da assimetria', () => {
      const result = suggestOutfit({
        atStart: calmHour(),
        atEnd: calmHour({ precipitationProb: 70 }),
        intensity: 'leve',
        outdoor: true,
      });

      expect(result?.accessories).toContain('guarda-chuva');
      expect(result?.summary).toContain('Sem chuva na ida, mas 70% de chance na volta');
      expect(result?.summary).toContain('leve guarda-chuva');
    });

    it('chuva com vento forte na mesma ponta troca guarda-chuva por capa', () => {
      const result = suggestOutfit({
        atStart: calmHour({ precipitationProb: 80, windSpeed: 30 }),
        intensity: 'leve',
        outdoor: true,
      });

      expect(result?.accessories).toContain('capa-de-chuva');
      expect(result?.accessories).not.toContain('guarda-chuva');
    });

    it('chuva numa ponta e vento forte só na outra mantém o guarda-chuva', () => {
      const result = suggestOutfit({
        atStart: calmHour({ precipitationProb: 80, windSpeed: 10, apparentTemp: 22 }),
        atEnd: calmHour({ precipitationProb: 0, windSpeed: 30, apparentTemp: 22 }),
        intensity: 'leve',
        outdoor: true,
      });

      expect(result?.accessories).toContain('guarda-chuva');
      expect(result?.accessories).not.toContain('capa-de-chuva');
    });

    it('precipitação efetiva > 0,5 mm dispara chuva mesmo com probabilidade baixa', () => {
      const result = suggestOutfit({
        atStart: calmHour({ precipitationProb: 10, precipitationMm: 1.2 }),
        intensity: 'leve',
        outdoor: true,
      });

      expect(result?.accessories).toContain('guarda-chuva');
    });

    it('vento forte com sensação abaixo de 20 °C pede corta-vento', () => {
      expect(
        suggestOutfit({
          atStart: calmHour({ windSpeed: 30, apparentTemp: 15 }),
          intensity: 'leve',
          outdoor: true,
        })?.accessories,
      ).toContain('corta-vento');
      expect(
        suggestOutfit({
          atStart: calmHour({ windSpeed: 30, apparentTemp: 24 }),
          intensity: 'leve',
          outdoor: true,
        })?.accessories,
      ).not.toContain('corta-vento');
    });

    it('UV alto em ponta diurna e outdoor pede protetor; ≥ 8 também boné', () => {
      const sunny = suggestOutfit({
        atStart: calmHour({ uvIndex: 9, isDay: true }),
        intensity: 'leve',
        outdoor: true,
      });
      expect(sunny?.accessories).toEqual(expect.arrayContaining(['protetor-solar', 'bone']));

      const uvSix = suggestOutfit({
        atStart: calmHour({ uvIndex: 6, isDay: true }),
        intensity: 'leve',
        outdoor: true,
      });
      expect(uvSix?.accessories).toContain('protetor-solar');
      expect(uvSix?.accessories).not.toContain('bone');
    });

    it('UV alto à noite ou indoor não pede protetor', () => {
      expect(
        suggestOutfit({
          atStart: calmHour({ uvIndex: 9, isDay: false }),
          intensity: 'leve',
          outdoor: true,
        })?.accessories,
      ).not.toContain('protetor-solar');
      expect(
        suggestOutfit({
          atStart: calmHour({ uvIndex: 9, isDay: true }),
          intensity: 'leve',
          outdoor: false,
        })?.accessories,
      ).not.toContain('protetor-solar');
    });

    it('calor ≥ 28 °C pede água, exceto para intensidade leve', () => {
      expect(
        suggestOutfit({
          atStart: calmHour({ apparentTemp: 29 }),
          intensity: 'moderada',
          outdoor: true,
        })?.accessories,
      ).toContain('agua');
      expect(
        suggestOutfit({
          atStart: calmHour({ apparentTemp: 29 }),
          intensity: 'leve',
          outdoor: true,
        })?.accessories,
      ).not.toContain('agua');
    });
  });

  describe('mudança ida × volta (§5.3)', () => {
    it('esfriando ≥ 5 °C destaca a mudança e recomenda a peça pela volta', () => {
      const result = suggestOutfit({
        atStart: calmHour({ apparentTemp: 22 }),
        atEnd: calmHour({ apparentTemp: 14 }),
        intensity: 'leve',
        outdoor: true,
      });

      expect(result?.summary).toContain('Vai esfriar até a volta (22 °C → 14 °C)');
      expect(result?.summary).toContain('leve um casaco');
      expect(result?.summary).toContain('mesmo saindo no calor');
    });

    it('esquentando ≥ 5 °C sugere camadas', () => {
      const result = suggestOutfit({
        atStart: calmHour({ apparentTemp: 14 }),
        atEnd: calmHour({ apparentTemp: 22 }),
        intensity: 'leve',
        outdoor: true,
      });

      expect(result?.summary).toContain('Sai fresco mas esquenta depois (14 °C → 22 °C)');
      expect(result?.summary).toContain('camadas que dê para tirar');
    });

    it('diferença menor que 5 °C não vira fator de mudança', () => {
      const result = suggestOutfit({
        atStart: calmHour({ apparentTemp: 20 }),
        atEnd: calmHour({ apparentTemp: 23 }),
        intensity: 'leve',
        outdoor: true,
      });

      expect(result?.summary).not.toContain('esfriar');
      expect(result?.summary).not.toContain('esquenta depois');
      expect(result?.summary).toContain('sensação de 20 °C');
    });

    it('sem atEnd (endTime fora do forecast) sugere só com a ida, sem crash', () => {
      const result = suggestOutfit({
        atStart: calmHour({ apparentTemp: 12 }),
        intensity: 'leve',
        outdoor: true,
      });

      expect(result?.outfit).toBe('casaco');
      expect(result?.atEnd).toBeUndefined();
      expect(result?.summary).toMatch(/um casaco: sensação de 12 °C/i);
    });
  });

  describe('frase e dados faltantes', () => {
    it('chuvisco (20–49%) vira ressalva sem acessório obrigatório', () => {
      const result = suggestOutfit({
        atStart: calmHour({ precipitationProb: 35 }),
        intensity: 'leve',
        outdoor: true,
      });

      expect(result?.summary).toMatch(/pode chuviscar \(35%\)/i);
      expect(result?.accessories).not.toContain('guarda-chuva');
    });

    it('sensação da ida indisponível → null', () => {
      expect(
        suggestOutfit({
          atStart: calmHour({ apparentTemp: null }),
          intensity: 'leve',
          outdoor: true,
        }),
      ).toBeNull();
    });

    it('campos null nas demais medidas não disparam acessórios nem quebram', () => {
      const result = suggestOutfit({
        atStart: calmHour({
          precipitationProb: null,
          precipitationMm: null,
          windSpeed: null,
          uvIndex: null,
        }),
        intensity: 'moderada',
        outdoor: true,
      });

      expect(result?.accessories).toEqual([]);
    });

    it('volta com sensação null não conta como mudança, mas segue nos acessórios', () => {
      const result = suggestOutfit({
        atStart: calmHour({ apparentTemp: 22 }),
        atEnd: calmHour({ apparentTemp: null, precipitationProb: 80 }),
        intensity: 'leve',
        outdoor: true,
      });

      expect(result?.summary).not.toContain('esfriar');
      expect(result?.accessories).toContain('guarda-chuva');
    });
  });
});
