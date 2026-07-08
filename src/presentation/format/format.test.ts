import { formatHour, formatReasonsSentence, formatTemp, formatWindow } from './format';

describe('format', () => {
  it('formata hora pelo relógio do frame fake UTC, não do device', () => {
    // 17:00 no wall-clock da cidade, codificado como UTC
    expect(formatHour(new Date(Date.UTC(2026, 6, 8, 17, 0)))).toBe('17h');
    expect(formatHour(new Date(Date.UTC(2026, 6, 8, 0, 0)))).toBe('0h');
  });

  it('formata janela com fim exclusivo já embutido', () => {
    expect(
      formatWindow(new Date(Date.UTC(2026, 6, 8, 17)), new Date(Date.UTC(2026, 6, 8, 19))),
    ).toBe('17h–19h');
  });

  it('formata temperatura arredondada e null como travessão', () => {
    expect(formatTemp(23.6)).toBe('24°');
    expect(formatTemp(-2.4)).toBe('-2°');
    expect(formatTemp(null)).toBe('—');
  });

  it('monta a frase das razões com vírgulas e "e" final', () => {
    expect(
      formatReasonsSentence([
        'temperatura agradável (24 °C)',
        'baixa chance de chuva',
        'vento leve',
      ]),
    ).toBe('Temperatura agradável (24 °C), baixa chance de chuva e vento leve.');
    expect(formatReasonsSentence(['vento leve'])).toBe('Vento leve.');
    expect(formatReasonsSentence([])).toBe('');
  });
});
