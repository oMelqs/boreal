import type { City } from '@/domain/entities/city';

import type { ForecastRequest, OpenMeteoClient } from '../datasources/openMeteoClient';
import { NoResultsError } from '../errors';
import forecastJoinville from '../mappers/fixtures/forecastJoinville.json';
import { createWeatherRepository } from './openMeteoWeatherRepository';

const joinville: City = {
  id: 3459712,
  name: 'Joinville',
  admin1: 'Santa Catarina',
  country: 'Brasil',
  latitude: -26.30444,
  longitude: -48.84556,
  timezone: 'America/Sao_Paulo',
};

function fakeClient(overrides: Partial<OpenMeteoClient> = {}): OpenMeteoClient {
  return {
    searchCities: async () => ({ results: [] }),
    getForecast: async () => forecastJoinville,
    ...overrides,
  };
}

describe('openMeteoWeatherRepository', () => {
  it('consulta o forecast com lat/lon e timezone da cidade (não do device)', async () => {
    const requests: ForecastRequest[] = [];
    const repository = createWeatherRepository(
      fakeClient({
        getForecast: async (request) => {
          requests.push(request);
          return forecastJoinville;
        },
      }),
    );

    const hours = await repository.getTodayHourlyForecast(joinville);

    expect(requests).toEqual([
      { latitude: -26.30444, longitude: -48.84556, timezone: 'America/Sao_Paulo' },
    ]);
    expect(hours).toHaveLength(24);
    expect(hours[12].isDay).toBe(true);
  });

  it('lança NoResultsError para forecast sem horas', async () => {
    const repository = createWeatherRepository(
      fakeClient({
        getForecast: async () => ({
          timezone: 'America/Sao_Paulo',
          hourly: {
            time: [],
            temperature_2m: [],
            apparent_temperature: [],
            precipitation_probability: [],
            precipitation: [],
            wind_speed_10m: [],
            uv_index: [],
            weather_code: [],
            is_day: [],
          },
        }),
      }),
    );

    await expect(repository.getTodayHourlyForecast(joinville)).rejects.toBeInstanceOf(
      NoResultsError,
    );
  });
});
