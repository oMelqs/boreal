/**
 * Taxonomia de erros da camada de dados (§4.3). A presentation mapeia cada
 * classe para uma mensagem amigável em pt-BR — nunca exibe `message` cru.
 */

/** Falha de rede: sem conexão, DNS, timeout (abort de 10 s). */
export class NetworkError extends Error {
  constructor(message = 'network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

/** A API respondeu com status >= 400. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`api responded with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** A chamada funcionou, mas não há resultados utilizáveis. */
export class NoResultsError extends Error {
  constructor(message = 'no results') {
    super(message);
    this.name = 'NoResultsError';
  }
}
