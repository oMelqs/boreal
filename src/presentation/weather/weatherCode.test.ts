import { weatherCodeDescription, weatherCodeIcon } from './weatherCode';

describe('weatherCode', () => {
  it.each([
    [0, '☀️', '🌙', 'céu limpo'],
    [1, '🌤️', '☁️', 'parcialmente nublado'],
    [2, '🌤️', '☁️', 'parcialmente nublado'],
    [3, '☁️', '☁️', 'nublado'],
    [45, '🌫️', '🌫️', 'nevoeiro'],
    [55, '🌦️', '🌧️', 'garoa'],
    [61, '🌧️', '🌧️', 'chuva'],
    [75, '🌨️', '🌨️', 'neve'],
    [81, '🌦️', '🌧️', 'pancadas de chuva'],
    [86, '🌨️', '🌨️', 'pancadas de neve'],
    [95, '⛈️', '⛈️', 'trovoada'],
    [99, '⛈️', '⛈️', 'trovoada'],
  ])('código %p → dia %p / noite %p (%s)', (code, day, night, description) => {
    expect(weatherCodeIcon(code, true)).toBe(day);
    expect(weatherCodeIcon(code, false)).toBe(night);
    expect(weatherCodeDescription(code)).toBe(description);
  });

  it('código desconhecido e null caem no fallback neutro', () => {
    expect(weatherCodeIcon(42, true)).toBe('🌡️');
    expect(weatherCodeIcon(null, false)).toBe('🌡️');
    expect(weatherCodeDescription(42)).toBe('tempo indefinido');
    expect(weatherCodeDescription(null)).toBe('tempo indefinido');
  });
});
