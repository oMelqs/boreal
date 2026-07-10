/**
 * Formatação de exibição. IMPORTANTE: os Dates do app vivem no frame
 * "fake UTC" (wall-clock da cidade codificado como UTC) — toda leitura de
 * hora usa getUTCHours; usar getHours() do device seria bug de timezone.
 */

export function formatHour(date: Date): string {
  return `${date.getUTCHours()}h`;
}

/** "17h–19h" (en dash, fim exclusivo já embutido no Recommendation.end). */
export function formatWindow(start: Date, end: Date): string {
  return `${formatHour(start)}–${formatHour(end)}`;
}

const WEEKDAYS_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/** "qui, 10 de julho" no calendário local da cidade (frame fake UTC). */
export function formatLocalDate(date: Date): string {
  return `${WEEKDAYS_PT[date.getUTCDay()]}, ${date.getUTCDate()} de ${MONTHS_PT[date.getUTCMonth()]}`;
}

export function formatTemp(celsius: number | null): string {
  return celsius === null ? '—' : `${Math.round(celsius)}°`;
}

/**
 * Junta as razões do motor em frase única: "temperatura agradável (24 °C),
 * baixa chance de chuva e vento leve." — capitaliza a primeira e fecha com
 * ponto.
 */
export function formatReasonsSentence(reasons: readonly string[]): string {
  if (reasons.length === 0) return '';
  const joined =
    reasons.length === 1
      ? reasons[0]
      : `${reasons.slice(0, -1).join(', ')} e ${reasons[reasons.length - 1]}`;
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`;
}
