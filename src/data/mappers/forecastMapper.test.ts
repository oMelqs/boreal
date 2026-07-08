import forecastJoinville from './fixtures/forecastJoinville.json';
import forecastWithNulls from './fixtures/forecastWithNulls.json';
import { mapForecastResponseToHourlyForecasts, parseLocalTimeAsUtc } from './forecastMapper';

describe('parseLocalTimeAsUtc', () => {
  it('codifica o horário local da cidade como UTC (frame fake UTC do motor)', () => {
    expect(parseLocalTimeAsUtc('2026-07-08T17:00').getTime()).toBe(
      Date.UTC(2026, 6, 8, 17, 0, 0),
    );
  });

  it('aceita horário com segundos', () => {
    expect(parseLocalTimeAsUtc('2026-07-08T17:00:30').getTime()).toBe(
      Date.UTC(2026, 6, 8, 17, 0, 30),
    );
  });
});

describe('forecastMapper', () => {
  it('mapeia o payload real de 24h para entities HourlyForecast', () => {
    const hours = mapForecastResponseToHourlyForecasts(forecastJoinville);

    expect(hours).toHaveLength(24);
    expect(hours[0]).toEqual({
      time: new Date(Date.UTC(2026, 6, 8, 0, 0)),
      apparentTemp: 11.1,
      temp: 11.2,
      precipitationProb: 0,
      precipitationMm: 0,
      windSpeed: 1.1,
      uvIndex: 0,
      weatherCode: forecastJoinville.hourly.weather_code[0],
      isDay: false,
    });
  });

  it('converte is_day 0/1 para boolean', () => {
    const hours = mapForecastResponseToHourlyForecasts(forecastJoinville);

    expect(hours[0].isDay).toBe(false); // meia-noite
    expect(hours[12].isDay).toBe(true); // meio-dia
  });

  it('preserva nulls do payload (payload real com nulls introduzidos)', () => {
    const hours = mapForecastResponseToHourlyForecasts(forecastWithNulls);

    expect(hours[13].windSpeed).toBeNull();
    expect(hours[14].apparentTemp).toBeNull();
    expect(hours[15].uvIndex).toBeNull();
  });

  it('is_day null vira noite (conservador: hora não recomendável)', () => {
    const hours = mapForecastResponseToHourlyForecasts(forecastWithNulls);

    expect(hours[16].isDay).toBe(false);
  });

  it('arrays mais curtos que time viram null nos índices faltantes', () => {
    const dto = {
      timezone: 'UTC',
      hourly: {
        time: ['2026-07-08T10:00', '2026-07-08T11:00'],
        temperature_2m: [20.1],
        apparent_temperature: [21.5],
        precipitation_probability: [5],
        precipitation: [0],
        wind_speed_10m: [3.2],
        uv_index: [2],
        weather_code: [1],
        is_day: [1],
      },
    };

    const hours = mapForecastResponseToHourlyForecasts(dto);

    expect(hours).toHaveLength(2);
    expect(hours[1]).toEqual({
      time: new Date(Date.UTC(2026, 6, 8, 11, 0)),
      apparentTemp: null,
      temp: null,
      precipitationProb: null,
      precipitationMm: null,
      windSpeed: null,
      uvIndex: null,
      weatherCode: null,
      isDay: false,
    });
  });
});
