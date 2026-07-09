import type { City } from '../entities/city';
import type { HourlyForecast } from '../entities/hourlyForecast';

/**
 * Porta de previsão horária. Implementada na camada data (Forecast da
 * Open-Meteo). Retorna as horas de HOJE e AMANHÃ no fuso da cidade
 * consultada — amanhã alimenta a "próxima ocorrência" dos hábitos.
 */
export interface WeatherRepository {
  getHourlyForecast(city: City): Promise<HourlyForecast[]>;
}
