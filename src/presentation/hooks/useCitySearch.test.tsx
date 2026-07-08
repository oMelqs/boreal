import { act, renderHook, waitFor } from '@testing-library/react-native';

import { NetworkError, NoResultsError } from '@/data/errors';
import { strings } from '@/presentation/i18n/strings';
import {
  createFakeContainer,
  createProvidersWrapper,
  joinville,
} from '@/presentation/testing/providers';

import { useCitySearch } from './useCitySearch';

async function renderCitySearch(container = createFakeContainer()) {
  const rendered = await renderHook(() => useCitySearch(0), {
    wrapper: createProvidersWrapper(container),
  });
  return rendered;
}

describe('useCitySearch', () => {
  it('começa em idle e permanece idle com menos de 2 caracteres, sem tocar o use case', async () => {
    const searchCity = jest.fn(async () => [joinville]);
    const { result } = await renderCitySearch(createFakeContainer({ searchCity }));

    expect(result.current.status).toBe('idle');

    await act(async () => result.current.setQuery('J'));

    expect(result.current.status).toBe('idle');
    expect(searchCity).not.toHaveBeenCalled();
  });

  it('busca e deriva sucesso com as cidades', async () => {
    const { result } = await renderCitySearch();

    await act(async () => result.current.setQuery('Joinville'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.cities).toEqual([joinville]);
  });

  it('NoResultsError vira estado no-results, não erro', async () => {
    const { result } = await renderCitySearch(
      createFakeContainer({
        searchCity: async () => {
          throw new NoResultsError();
        },
      }),
    );

    await act(async () => result.current.setQuery('xyzzy'));

    await waitFor(() => expect(result.current.status).toBe('no-results'));
    expect(result.current.errorMessage).toBeNull();
  });

  it('NetworkError vira estado error com mensagem pt-BR', async () => {
    const { result } = await renderCitySearch(
      createFakeContainer({
        searchCity: async () => {
          throw new NetworkError();
        },
      }),
    );

    await act(async () => result.current.setQuery('Joinville'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.errorMessage).toBe(strings.errors.network);
  });

  it('retry refaz a busca após erro', async () => {
    let shouldFail = true;
    const searchCity = jest.fn(async () => {
      if (shouldFail) throw new NetworkError();
      return [joinville];
    });
    const { result } = await renderCitySearch(createFakeContainer({ searchCity }));

    await act(async () => result.current.setQuery('Joinville'));
    await waitFor(() => expect(result.current.status).toBe('error'));

    shouldFail = false;
    await act(async () => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(searchCity).toHaveBeenCalledTimes(2);
  });
});
