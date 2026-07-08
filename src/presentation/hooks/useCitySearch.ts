import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { NoResultsError } from '@/data/errors';
import { useContainer } from '@/di/ContainerProvider';
import type { City } from '@/domain/entities/city';
import { mapErrorToMessage } from '@/presentation/i18n/errorMessages';

import { useDebouncedValue } from './useDebouncedValue';

/** Busca dispara com pausa de 400 ms na digitação (§4.1). */
const SEARCH_DEBOUNCE_MS = 400;
/** Nomes de cidade quase não mudam: geocoding fica fresco por 24h (§4.3). */
const GEOCODING_STALE_TIME_MS = 24 * 60 * 60 * 1000;
const MIN_QUERY_LENGTH = 2;

export type CitySearchStatus = 'idle' | 'loading' | 'success' | 'no-results' | 'error';

export type CitySearchViewModel = {
  query: string;
  setQuery: (query: string) => void;
  status: CitySearchStatus;
  cities: City[];
  /** Mensagem pt-BR pronta para exibição quando `status === 'error'`. */
  errorMessage: string | null;
  retry: () => void;
};

/**
 * ViewModel da busca de cidade: debounce, cache via React Query
 * (`['geocoding', query]`) e derivação dos estados de UI. `NoResultsError`
 * vira o estado vazio amigável `no-results`, não erro.
 *
 * `debounceMs` é parametrizado para os testes de fluxo rodarem sem timers.
 */
export function useCitySearch(debounceMs: number = SEARCH_DEBOUNCE_MS): CitySearchViewModel {
  const container = useContainer();
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(normalizedQuery, debounceMs);
  const enabled = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const result = useQuery({
    queryKey: ['geocoding', debouncedQuery],
    queryFn: () => container.searchCity(debouncedQuery),
    enabled,
    staleTime: GEOCODING_STALE_TIME_MS,
  });

  const typing = normalizedQuery !== debouncedQuery;

  let status: CitySearchStatus;
  let cities: City[] = [];
  let errorMessage: string | null = null;

  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    status = 'idle';
  } else if (typing || result.isPending) {
    status = 'loading';
  } else if (result.isError) {
    if (result.error instanceof NoResultsError) {
      status = 'no-results';
    } else {
      status = 'error';
      errorMessage = mapErrorToMessage(result.error);
    }
  } else {
    cities = result.data ?? [];
    status = cities.length > 0 ? 'success' : 'no-results';
  }

  return {
    query,
    setQuery,
    status,
    cities,
    errorMessage,
    retry: () => void result.refetch(),
  };
}
