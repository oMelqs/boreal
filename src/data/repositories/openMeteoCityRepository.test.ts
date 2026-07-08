import type { OpenMeteoClient } from '../datasources/openMeteoClient';
import { NoResultsError } from '../errors';
import geocodingJoinville from '../mappers/fixtures/geocodingJoinville.json';
import { createCityRepository } from './openMeteoCityRepository';

function fakeClient(overrides: Partial<OpenMeteoClient> = {}): OpenMeteoClient {
  return {
    searchCities: async () => ({ results: [] }),
    getForecast: async () => {
      throw new Error('not implemented');
    },
    ...overrides,
  };
}

describe('openMeteoCityRepository', () => {
  it('repassa a query ao datasource e devolve entities mapeadas', async () => {
    const queries: string[] = [];
    const repository = createCityRepository(
      fakeClient({
        searchCities: async (query) => {
          queries.push(query);
          return geocodingJoinville;
        },
      }),
    );

    const cities = await repository.searchCities('Joinville');

    expect(queries).toEqual(['Joinville']);
    expect(cities).toHaveLength(8);
    expect(cities[0]).toMatchObject({ name: 'Joinville', admin1: 'Santa Catarina' });
  });

  it('lança NoResultsError quando a resposta vem sem results', async () => {
    const repository = createCityRepository(fakeClient({ searchCities: async () => ({}) }));

    await expect(repository.searchCities('xyzzy')).rejects.toBeInstanceOf(NoResultsError);
  });
});
