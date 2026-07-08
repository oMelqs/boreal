import type { City } from '../entities/city';
import type { HourlyForecast } from '../entities/hourlyForecast';

/**
 * Porta de previsão horária. Implementada na camada data (Forecast da
 * Open-Meteo). Retorna as horas de HOJE no fuso da cidade consultada.
 */
export interface WeatherRepository {
  getTodayHourlyForecast(city: City): Promise<HourlyForecast[]>;
}
