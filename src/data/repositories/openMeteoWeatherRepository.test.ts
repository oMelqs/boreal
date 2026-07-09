import type { City } from '@/domain/entities/city';

import type { ForecastRequest, OpenMeteoClient } from '../datasources/openMeteoClient';
import { NoResultsError } from '../errors';
import forecastJoinville2d from '../mappers/fixtures/forecastJoinville2d.json';
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
    getForecast: async () => forecastJoinville2d,
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
          return forecastJoinville2d;
        },
      }),
    );

    const hours = await repository.getHourlyForecast(joinville);

    expect(requests).toEqual([
      { latitude: -26.30444, longitude: -48.84556, timezone: 'America/Sao_Paulo' },
    ]);
    expect(hours).toHaveLength(48);
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

    await expect(repository.getHourlyForecast(joinville)).rejects.toBeInstanceOf(
      NoResultsError,
    );
  });
});
