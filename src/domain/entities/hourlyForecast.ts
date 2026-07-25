/**
 * Previsão de uma hora do dia, já no fuso horário da cidade consultada.
 *
 * Os campos numéricos podem ser `null`: a Open-Meteo devolve `null` quando não
 * há dado disponível para a hora. O motor de recomendação trata horas com
 * dados faltantes como inelegíveis para a janela, sem quebrar.
 */
export type HourlyForecast = {
  time: Date;
  /** Sensação térmica em °C — é o que importa para quem vai sair. */
  apparentTemp: number | null;
  /** Temperatura do ar em °C (exibição na timeline). */
  temp: number | null;
  /** Umidade relativa em % — pesa no score como mormaço (§5.2 das preferências). */
  humidity: number | null;
  /** Probabilidade de precipitação, 0–100. */
  precipitationProb: number | null;
  /** Precipitação prevista na hora, em mm. */
  precipitationMm: number | null;
  /** Velocidade do vento a 10m, em km/h. */
  windSpeed: number | null;
  uvIndex: number | null;
  /** Código de condição do tempo (tabela WMO da Open-Meteo). */
  weatherCode: number | null;
  isDay: boolean;
};
