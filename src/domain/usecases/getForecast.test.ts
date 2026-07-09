import type { City } from '../entities/city';
import type { WeatherRepository } from '../ports/weatherRepository';
import { getForecast } from './getForecast';
import { buildHour } from './testing/buildHourlyForecast';

const city: City = {
  id: 1,
  name: 'Joinville',
  country: 'Brasil',
  latitude: -26.3,
  longitude: -48.84,
  timezone: 'America/Sao_Paulo',
};

describe('getForecast', () => {
  it('delega ao repository com a cidade informada', async () => {
    const hour = buildHour();
    const cities: City[] = [];
    const repository: WeatherRepository = {
      getHourlyForecast: async (requested) => {
        cities.push(requested);
        return [hour];
      },
    };

    const result = await getForecast(repository, city);

    expect(cities).toEqual([city]);
    expect(result).toEqual([hour]);
  });
});
