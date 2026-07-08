import type { GeocodingResponseDto } from '../dto/geocodingDto';
import { mapGeocodingResponseToCities } from './cityMapper';
import geocodingJoinville from './fixtures/geocodingJoinville.json';

describe('cityMapper', () => {
  it('mapeia o payload real do geocoding para entities City', () => {
    const cities = mapGeocodingResponseToCities(geocodingJoinville);

    expect(cities).toHaveLength(8);
    expect(cities[0]).toEqual({
      id: 3459712,
      name: 'Joinville',
      admin1: 'Santa Catarina',
      country: 'Brasil',
      latitude: -26.30444,
      longitude: -48.84556,
      timezone: 'America/Sao_Paulo',
    });
  });

  it('resposta sem results vira lista vazia', () => {
    expect(mapGeocodingResponseToCities({})).toEqual([]);
  });

  it('tolera country e admin1 ausentes', () => {
    const dto: GeocodingResponseDto = {
      results: [{ id: 1, name: 'Lugarejo', latitude: 0, longitude: 0, timezone: 'UTC' }],
    };

    const [city] = mapGeocodingResponseToCities(dto);

    expect(city.country).toBe('');
    expect(city.admin1).toBeUndefined();
  });
});
