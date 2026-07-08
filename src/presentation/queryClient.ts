import { QueryClient } from '@tanstack/react-query';

import { NetworkError } from '@/data/errors';

/**
 * Política de retry do §4.3: apenas falhas de rede re-tentam (2x).
 * ApiError e NoResultsError falham direto — repetir não muda o resultado.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => error instanceof NetworkError && failureCount < 2,
      },
    },
  });
}
