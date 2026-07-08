import { ApiError, NetworkError, NoResultsError } from '@/data/errors';

import { mapErrorToMessage } from './errorMessages';
import { strings } from './strings';

describe('mapErrorToMessage', () => {
  it.each([
    [new NetworkError(), strings.errors.network],
    [new ApiError(500), strings.errors.api],
    [new NoResultsError(), strings.errors.noResults],
    [new Error('boom'), strings.errors.generic],
    ['not an error', strings.errors.generic],
  ])('mapeia %p para mensagem amigável', (error, expected) => {
    expect(mapErrorToMessage(error)).toBe(expected);
  });
});
