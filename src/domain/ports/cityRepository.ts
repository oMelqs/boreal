import type { City } from '../entities/city';

/**
 * Porta de busca de cidades por nome. Implementada na camada data
 * (Geocoding da Open-Meteo); o domain só conhece esta interface.
 */
export interface CityRepository {
  searchCities(query: string): Promise<City[]>;
}
