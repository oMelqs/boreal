import type { City } from '../entities/city';
import type { CityRepository } from '../ports/cityRepository';

/** Busca só dispara com pelo menos 2 caracteres úteis (§4.1). */
const MIN_QUERY_LENGTH = 2;

/**
 * Busca cidades pelo nome. Query com menos de 2 caracteres (após trim) não
 * toca na rede e resolve para lista vazia — regra de negócio, não só de UI.
 */
export async function searchCity(repository: CityRepository, query: string): Promise<City[]> {
  const normalized = query.trim();
  if (normalized.length < MIN_QUERY_LENGTH) {
    return [];
  }
  return repository.searchCities(normalized);
}
