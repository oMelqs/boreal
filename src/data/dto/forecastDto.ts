/**
 * Tipos crus da Forecast API da Open-Meteo (/v1/forecast, §4.2).
 * Arrays paralelos indexados por hora; valores numéricos podem vir `null`
 * quando não há dado para a hora.
 */
export type ForecastHourlyDto = {
  /** Horários locais da cidade em ISO 8601 sem offset (ex.: "2026-07-08T17:00"). */
  time: string[];
  temperature_2m: (number | null)[];
  apparent_temperature: (number | null)[];
  /** Umidade relativa a 2m, em % (0–100). */
  relative_humidity_2m: (number | null)[];
  precipitation_probability: (number | null)[];
  precipitation: (number | null)[];
  wind_speed_10m: (number | null)[];
  uv_index: (number | null)[];
  weather_code: (number | null)[];
  /** 1 = dia, 0 = noite. */
  is_day: (number | null)[];
};

export type ForecastResponseDto = {
  timezone: string;
  hourly: ForecastHourlyDto;
};
