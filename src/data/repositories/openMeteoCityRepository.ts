import type { CityRepository } from '@/domain/ports/cityRepository';

import type { OpenMeteoClient } from '../datasources/openMeteoClient';
import { NoResultsError } from '../errors';
import { mapGeocodingResponseToCities } from '../mappers/cityMapper';

/** Implementa o port de busca de cidades com o geocoding da Open-Meteo. */
export function createCityRepository(client: OpenMeteoClient): CityRepository {
  return {
    async searchCities(query) {
      const response = await client.searchCities(query);
      const cities = mapGeocodingResponseToCities(response);
      if (cities.length === 0) {
        throw new NoResultsError(`no cities found for "${query}"`);
      }
      return cities;
    },
  };
}
