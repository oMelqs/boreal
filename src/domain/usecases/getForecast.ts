import type { City } from '../entities/city';
import type { HourlyForecast } from '../entities/hourlyForecast';
import type { WeatherRepository } from '../ports/weatherRepository';

/**
 * Previsão horária de hoje para a cidade, no timezone dela. Ponto único de
 * passagem entre a UI e o port — os hooks nunca tocam o repository direto.
 */
export function getForecast(repository: WeatherRepository, city: City): Promise<HourlyForecast[]> {
  return repository.getTodayHourlyForecast(city);
}
