import { ApiError, NetworkError, NoResultsError } from '@/data/errors';

import { strings } from './strings';

/**
 * Traduz a taxonomia de erros da camada de dados (§4.3) para mensagens
 * amigáveis em pt-BR. A UI nunca exibe `message` cru de erro.
 */
export function mapErrorToMessage(error: unknown): string {
  if (error instanceof NetworkError) return strings.errors.network;
  if (error instanceof ApiError) return strings.errors.api;
  if (error instanceof NoResultsError) return strings.errors.noResults;
  return strings.errors.generic;
}
