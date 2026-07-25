import { suggestOutfit } from './suggestOutfit';
import { atHour, buildHour } from './testing/buildHourlyForecast';

/** Ida às 10h com a sensação térmica dada; sem chuva/vento/UV relevantes. */
function start(apparentTemp: number) {
  return buildHour({ time: atHour(10), apparentTemp });
}

describe('suggestOutfit — tempOffset pessoal (§4)', () => {
  it('offset −4 (custom 24–30): 18 °C reais viram 14 sentidos → casaco (§11)', () => {
    const withoutOffset = suggestOutfit({ atStart: start(18), intensity: 'leve', outdoor: true });
    const withOffset = suggestOutfit({
      atStart: start(18),
      intensity: 'leve',
      outdoor: true,
      tempOffset: -4,
    });

    expect(withoutOffset?.outfit).toBe('camada-leve');
    expect(withOffset?.outfit).toBe('casaco');
    // A frase segue com a temperatura real, não a sentida.
    expect(withOffset?.summary).toContain('18 °C');
  });

  it('offset +3 (calorento): 17 °C sobem para 20 sentidos → roupa leve', () => {
    const suggestion = suggestOutfit({
      atStart: start(17),
      intensity: 'leve',
      outdoor: true,
      tempOffset: 3,
    });

    expect(suggestion?.outfit).toBe('leve');
  });

  it('offset também pesa na peça recomendada para a volta', () => {
    const input = {
      atStart: start(22),
      atEnd: buildHour({ time: atHour(13), apparentTemp: 16 }),
      intensity: 'leve',
      outdoor: true,
    } as const;

    expect(suggestOutfit(input)?.summary).toContain('leve uma jaqueta leve');
    expect(suggestOutfit({ ...input, tempOffset: -3 })?.summary).toContain('leve um casaco');
  });

  it('offset desloca a tabela também na intensidade moderada', () => {
    // 20 °C reais: sem offset veste leve; sentindo 17 (−3), desce para jaqueta leve.
    const input = { atStart: start(20), intensity: 'moderada', outdoor: true } as const;

    expect(suggestOutfit(input)?.outfit).toBe('leve');
    expect(suggestOutfit({ ...input, tempOffset: -3 })?.outfit).toBe('camada-leve');
  });
});
