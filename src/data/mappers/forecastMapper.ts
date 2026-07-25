import type { HourlyForecast } from '@/domain/entities/hourlyForecast';

import type { ForecastResponseDto } from '../dto/forecastDto';

/**
 * Converte o horário local da cidade ("2026-07-08T17:00", sem offset) para o
 * frame "fake UTC" que o motor espera: o wall-clock da cidade codificado como
 * UTC. Assim o motor compara instantes sem depender do timezone do device.
 * Aceita horários com ou sem segundos.
 */
export function parseLocalTimeAsUtc(localTime: string): Date {
  const withSeconds = /T\d{2}:\d{2}:\d{2}/.test(localTime) ? localTime : `${localTime}:00`;
  return new Date(`${withSeconds}Z`);
}

/**
 * Única fronteira de conversão forecast → domain. Arrays paralelos da API são
 * zipados pelo índice de `time`; valor ausente em qualquer array (ou `null`
 * da API) é preservado como `null` — o motor decide o que fazer.
 * `is_day` sem informação vira noite (conservador: hora não recomendável).
 */
export function mapForecastResponseToHourlyForecasts(dto: ForecastResponseDto): HourlyForecast[] {
  const { hourly } = dto;
  return hourly.time.map((time, i) => ({
    time: parseLocalTimeAsUtc(time),
    apparentTemp: hourly.apparent_temperature.at(i) ?? null,
    temp: hourly.temperature_2m.at(i) ?? null,
    humidity: hourly.relative_humidity_2m.at(i) ?? null,
    precipitationProb: hourly.precipitation_probability.at(i) ?? null,
    precipitationMm: hourly.precipitation.at(i) ?? null,
    windSpeed: hourly.wind_speed_10m.at(i) ?? null,
    uvIndex: hourly.uv_index.at(i) ?? null,
    weatherCode: hourly.weather_code.at(i) ?? null,
    isDay: hourly.is_day.at(i) === 1,
  }));
}
