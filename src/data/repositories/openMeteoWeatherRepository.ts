import type { WeatherRepository } from '@/domain/ports/weatherRepository';

import type { OpenMeteoClient } from '../datasources/openMeteoClient';
import { NoResultsError } from '../errors';
import { mapForecastResponseToHourlyForecasts } from '../mappers/forecastMapper';

/**
 * Implementa o port de previsão com o forecast da Open-Meteo: hoje e amanhã
 * (`forecast_days=2`) no timezone da cidade consultada.
 */
export function createWeatherRepository(client: OpenMeteoClient): WeatherRepository {
  return {
    async getHourlyForecast(city) {
      const response = await client.getForecast({
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
      });
      const hours = mapForecastResponseToHourlyForecasts(response);
      if (hours.length === 0) {
        throw new NoResultsError(`empty forecast for city ${city.id}`);
      }
      return hours;
    },
  };
}
