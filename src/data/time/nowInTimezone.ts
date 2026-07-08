/**
 * Converte um instante real para o frame "fake UTC" usado pelo app: o
 * wall-clock do timezone informado codificado como UTC — o mesmo frame que o
 * forecastMapper produz para as horas da previsão. É o "agora" que o motor de
 * recomendação recebe para saber quais horas do dia local já passaram.
 *
 * Usa `Intl.DateTimeFormat` (padrão do JS, presente no Hermes) — sem lib de
 * datas.
 */
export function nowInTimezone(timezone: string, reference: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(reference);

  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number(part.value) : 0;
  };

  return new Date(
    Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      // "24" à meia-noite em alguns runtimes ICU; normaliza para 0
      get('hour') % 24,
      get('minute'),
      get('second'),
    ),
  );
}
