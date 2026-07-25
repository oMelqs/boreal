import type { ForecastResponseDto } from '../dto/forecastDto';
import type { GeocodingResponseDto } from '../dto/geocodingDto';
import { ApiError, NetworkError } from '../errors';

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/** Variáveis horárias consumidas pelo app (§4.2). */
const HOURLY_VARIABLES = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation_probability',
  'precipitation',
  'wind_speed_10m',
  'uv_index',
  'weather_code',
  'is_day',
].join(',');

const REQUEST_TIMEOUT_MS = 10_000;
const GEOCODING_RESULT_COUNT = 8;

export type ForecastRequest = {
  latitude: number;
  longitude: number;
  /** Timezone da cidade (não do device) — o dia consultado é o dia local dela. */
  timezone: string;
};

export type OpenMeteoClient = {
  searchCities(query: string): Promise<GeocodingResponseDto>;
  getForecast(request: ForecastRequest): Promise<ForecastResponseDto>;
};

/**
 * Datasource único da Open-Meteo: fetch tipado com timeout de 10 s.
 * Traduz falhas para a taxonomia da camada de dados: abort/queda de rede →
 * `NetworkError`, status >= 400 → `ApiError`.
 *
 * `fetchFn` é injetável para testes (sem mock global de fetch).
 */
export function createOpenMeteoClient(fetchFn: typeof fetch = fetch): OpenMeteoClient {
  async function getJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetchFn(url, { signal: controller.signal });
      if (!response.ok) {
        throw new ApiError(response.status);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new NetworkError(error instanceof Error ? error.message : 'request failed');
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    searchCities(query) {
      const params = new URLSearchParams({
        name: query,
        count: String(GEOCODING_RESULT_COUNT),
        language: 'pt',
        format: 'json',
      });
      return getJson<GeocodingResponseDto>(`${GEOCODING_BASE_URL}?${params}`);
    },

    getForecast({ latitude, longitude, timezone }) {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        hourly: HOURLY_VARIABLES,
        // Hoje + amanhã (§7 dos hábitos): próxima ocorrência quando já passou.
        forecast_days: '2',
        timezone,
      });
      return getJson<ForecastResponseDto>(`${FORECAST_BASE_URL}?${params}`);
    },
  };
}
