import type { KeyValueStorage } from '@/data/datasources/asyncStorageClient';
import { createAsyncStorageClient } from '@/data/datasources/asyncStorageClient';
import { createOpenMeteoClient } from '@/data/datasources/openMeteoClient';
import { createHabitsRepository } from '@/data/repositories/habitsRepositoryImpl';
import { createCityRepository } from '@/data/repositories/openMeteoCityRepository';
import { createWeatherRepository } from '@/data/repositories/openMeteoWeatherRepository';
import { createPreferencesRepository } from '@/data/repositories/preferencesRepositoryImpl';
import type { City } from '@/domain/entities/city';
import type { Habit } from '@/domain/entities/habit';
import type { HourlyForecast } from '@/domain/entities/hourlyForecast';
import type { Preferences } from '@/domain/entities/preferences';
import { getForecast } from '@/domain/usecases/getForecast';
import { searchCity } from '@/domain/usecases/searchCity';

/** Use cases prontos para consumo pelos hooks da presentation. */
export type Container = {
  searchCity(query: string): Promise<City[]>;
  getForecast(city: City): Promise<HourlyForecast[]>;
  getHabits(): Promise<Habit[]>;
  saveHabit(habit: Habit): Promise<void>;
  removeHabit(id: string): Promise<void>;
  getPreferences(): Promise<Preferences>;
  savePreferences(preferences: Preferences): Promise<void>;
};

/**
 * Composition root: fábricas simples, sem framework de DI.
 * datasource → repositories → use cases. Testes trocam `fetchFn`/`storage`
 * (ou montam um container próprio com fakes) sem `jest.mock` profundo.
 *
 * CRUD de hábitos/preferências é bound direto do repository: a operação do
 * port já É o use case — arquivo intermediário seria só cerimônia.
 */
export function createContainer(
  fetchFn: typeof fetch = fetch,
  storage: KeyValueStorage = createAsyncStorageClient(),
): Container {
  const client = createOpenMeteoClient(fetchFn);
  const cityRepository = createCityRepository(client);
  const weatherRepository = createWeatherRepository(client);
  const habitsRepository = createHabitsRepository(storage);
  const preferencesRepository = createPreferencesRepository(storage);

  return {
    searchCity: (query) => searchCity(cityRepository, query),
    getForecast: (city) => getForecast(weatherRepository, city),
    getHabits: () => habitsRepository.getAll(),
    saveHabit: (habit) => habitsRepository.save(habit),
    removeHabit: (id) => habitsRepository.remove(id),
    getPreferences: () => preferencesRepository.get(),
    savePreferences: (preferences) => preferencesRepository.save(preferences),
  };
}

/** Instância única usada pelo app (hooks importam daqui). */
export const container = createContainer();
