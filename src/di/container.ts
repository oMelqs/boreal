import { createOpenMeteoClient } from '@/data/datasources/openMeteoClient';
import { createCityRepository } from '@/data/repositories/openMeteoCityRepository';
import { createWeatherRepository } from '@/data/repositories/openMeteoWeatherRepository';
import type { City } from '@/domain/entities/city';
import type { HourlyForecast } from '@/domain/entities/hourlyForecast';
import { getForecast } from '@/domain/usecases/getForecast';
import { searchCity } from '@/domain/usecases/searchCity';

/** Use cases prontos para consumo pelos hooks da presentation. */
export type Container = {
  searchCity(query: string): Promise<City[]>;
  getTodayForecast(city: City): Promise<HourlyForecast[]>;
};

/**
 * Composition root: fábricas simples, sem framework de DI.
 * datasource → repositories → use cases. Testes trocam o `fetchFn` (ou montam
 * um container próprio com fakes) sem `jest.mock` de módulos profundos.
 */
export function createContainer(fetchFn: typeof fetch = fetch): Container {
  const client = createOpenMeteoClient(fetchFn);
  const cityRepository = createCityRepository(client);
  const weatherRepository = createWeatherRepository(client);

  return {
    searchCity: (query) => searchCity(cityRepository, query),
    getTodayForecast: (city) => getForecast(weatherRepository, city),
  };
}

/** Instância única usada pelo app (hooks importam daqui). */
export const container = createContainer();
