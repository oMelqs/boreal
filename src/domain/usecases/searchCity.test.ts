import type { City } from '../entities/city';
import type { CityRepository } from '../ports/cityRepository';
import { searchCity } from './searchCity';

const city: City = {
  id: 1,
  name: 'Joinville',
  country: 'Brasil',
  latitude: -26.3,
  longitude: -48.84,
  timezone: 'America/Sao_Paulo',
};

function fakeRepository(): { repository: CityRepository; queries: string[] } {
  const queries: string[] = [];
  return {
    queries,
    repository: {
      searchCities: async (query) => {
        queries.push(query);
        return [city];
      },
    },
  };
}

describe('searchCity', () => {
  it('delega a busca ao repository com a query normalizada', async () => {
    const { repository, queries } = fakeRepository();

    const result = await searchCity(repository, '  Joinville  ');

    expect(queries).toEqual(['Joinville']);
    expect(result).toEqual([city]);
  });

  it('query com menos de 2 caracteres úteis resolve vazio sem tocar o repository', async () => {
    const { repository, queries } = fakeRepository();

    await expect(searchCity(repository, 'J')).resolves.toEqual([]);
    await expect(searchCity(repository, '  a  ')).resolves.toEqual([]);
    await expect(searchCity(repository, '')).resolves.toEqual([]);
    expect(queries).toEqual([]);
  });
});
