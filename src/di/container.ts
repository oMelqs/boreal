import type { KeyValueStorage } from '@/data/datasources/asyncStorageClient';
import { createAsyncStorageClient } from '@/data/datasources/asyncStorageClient';
import type {
  Coords,
  LocationClient,
  LocationPermission,
} from '@/data/datasources/locationClient';
import { createLocationClient } from '@/data/datasources/locationClient';
import { createOpenMeteoClient } from '@/data/datasources/openMeteoClient';
import { createHabitsRepository } from '@/data/repositories/habitsRepositoryImpl';
import { createCityRepository } from '@/data/repositories/openMeteoCityRepository';
import { createWeatherRepository } from '@/data/repositories/openMeteoWeatherRepository';
import { createPreferencesRepository } from '@/data/repositories/preferencesRepositoryImpl';
import { createWidgetRepository } from '@/data/repositories/widgetRepositoryImpl';
import type { City } from '@/domain/entities/city';
import type { Habit } from '@/domain/entities/habit';
import type { HourlyForecast } from '@/domain/entities/hourlyForecast';
import type { Preferences } from '@/domain/entities/preferences';
import type { WidgetSnapshot } from '@/domain/entities/widgetSnapshot';
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
  /** Garante a permissão de localização (pede uma vez se indefinida). */
  ensureLocationPermission(): Promise<LocationPermission>;
  /** Posição atual do device; `null` se indisponível/negada. */
  getCurrentPosition(): Promise<Coords | null>;
  /** Grava o payload que o widget lê (§5.3 do widget). */
  publishWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void>;
  /** Último payload publicado; `null` quando não há ou está corrompido. */
  readWidgetSnapshot(): Promise<WidgetSnapshot | null>;
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
  locationClient: LocationClient = createLocationClient(),
): Container {
  const client = createOpenMeteoClient(fetchFn);
  const cityRepository = createCityRepository(client);
  const weatherRepository = createWeatherRepository(client);
  const habitsRepository = createHabitsRepository(storage);
  const preferencesRepository = createPreferencesRepository(storage);
  const widgetRepository = createWidgetRepository(storage);

  return {
    searchCity: (query) => searchCity(cityRepository, query),
    getForecast: (city) => getForecast(weatherRepository, city),
    getHabits: () => habitsRepository.getAll(),
    saveHabit: (habit) => habitsRepository.save(habit),
    removeHabit: (id) => habitsRepository.remove(id),
    getPreferences: () => preferencesRepository.get(),
    savePreferences: (preferences) => preferencesRepository.save(preferences),
    ensureLocationPermission: () => locationClient.ensurePermission(),
    getCurrentPosition: () => locationClient.getCurrentPosition(),
    publishWidgetSnapshot: (snapshot) => widgetRepository.publish(snapshot),
    readWidgetSnapshot: () => widgetRepository.read(),
  };
}

/** Instância única usada pelo app (hooks importam daqui). */
export const container = createContainer();
