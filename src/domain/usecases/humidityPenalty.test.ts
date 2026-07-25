import { computeComfortBreakdown, DEFAULT_COMFORT_PARAMS } from './computeComfortScore';
import { DEFAULT_SCORING_PROFILE, recommendBestWindow } from './recommendBestWindow';
import { atHour, buildDay, buildHour } from './testing/buildHourlyForecast';

function withMaxHumidity(maxHumidity: number) {
  return { ...DEFAULT_COMFORT_PARAMS, maxHumidity };
}

describe('penalidade de umidade (§5.2)', () => {
  it('abaixo ou no limite pessoal, penalidade zero', () => {
    expect(
      computeComfortBreakdown(buildHour({ humidity: 70 }))?.penalties.humidity,
    ).toBe(0);
    expect(
      computeComfortBreakdown(buildHour({ humidity: 55 }))?.penalties.humidity,
    ).toBe(0);
  });

  it('mormaço (sensação ≥ 22 °C): 0,8 por ponto excedente, cap 25', () => {
    // 85% com limite 70 → excesso 15 × 0,8 = 12
    const muggy = computeComfortBreakdown(buildHour({ humidity: 85, apparentTemp: 24 }));
    expect(muggy?.penalties.humidity).toBe(12);

    // excesso 30 × 0,8 = 24 < cap; excesso 40 × 0,8 = 32 → cap 25
    expect(
      computeComfortBreakdown(buildHour({ humidity: 100, apparentTemp: 24 }), withMaxHumidity(60))
        ?.penalties.humidity,
    ).toBe(25);
  });

  it('ar úmido e frio (< 22 °C): metade da penalidade, cap 12', () => {
    // 85% limite 70, sensação 18 → (15 × 0,8) / 2 = 6
    const coldDamp = computeComfortBreakdown(buildHour({ humidity: 85, apparentTemp: 18 }));
    expect(coldDamp?.penalties.humidity).toBe(6);

    // excesso 40 → 32 × 0,5 = 16 → cap 12
    expect(
      computeComfortBreakdown(buildHour({ humidity: 100, apparentTemp: 18 }), withMaxHumidity(60))
        ?.penalties.humidity,
    ).toBe(12);
  });

  it('fronteira do mormaço: 22 °C já conta como calor', () => {
    const at22 = computeComfortBreakdown(buildHour({ humidity: 80, apparentTemp: 22 }));
    const at21 = computeComfortBreakdown(buildHour({ humidity: 80, apparentTemp: 21.9 }));

    expect(at22?.penalties.humidity).toBe(8);
    expect(at21?.penalties.humidity).toBe(4);
  });

  it('critério §11: dia úmido e quente penaliza com limite 60 e não com 85', () => {
    const hour = buildHour({ humidity: 80, apparentTemp: 25 });

    const sensitive = computeComfortBreakdown(hour, withMaxHumidity(60));
    const tolerant = computeComfortBreakdown(hour, withMaxHumidity(85));

    expect(sensitive?.penalties.humidity).toBe(16);
    expect(tolerant?.penalties.humidity).toBe(0);
    expect(sensitive!.score.value).toBeLessThan(tolerant!.score.value);
  });

  it('umidade null torna a hora inelegível (regra de dados faltantes)', () => {
    expect(computeComfortBreakdown(buildHour({ humidity: null }))).toBeNull();
  });

  it('frase "ar abafado" entra ranqueada quando a umidade pesa na janela', () => {
    const hours = buildDay(10, 3, {
      10: { humidity: 95, apparentTemp: 24 },
      11: { humidity: 95, apparentTemp: 24 },
      12: { humidity: 95, apparentTemp: 24 },
    });

    const result = recommendBestWindow(hours, atHour(10), DEFAULT_SCORING_PROFILE);

    expect(result.kind).toBe('window');
    if (result.kind !== 'window') return;
    // Excesso 25 × 0,8 = 20: maior penalidade da janela → primeira razão.
    expect(result.reasons[0]).toBe('ar abafado (95%)');
  });
});
