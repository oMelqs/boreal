import { DEFAULT_PREFERENCES } from '@/domain/entities/preferences';

import { logger } from '../logger';
import { createFakeStorage } from '../testing/fakeStorage';
import {
  createPreferencesRepository,
  PREFERENCES_STORAGE_KEY,
} from './preferencesRepositoryImpl';

const joinville = {
  id: 3459712,
  name: 'Joinville',
  admin1: 'Santa Catarina',
  country: 'Brasil',
  latitude: -26.30444,
  longitude: -48.84556,
  timezone: 'America/Sao_Paulo',
};

describe('preferencesRepositoryImpl', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  it('ausência de dados resolve o default (onboarding pendente)', async () => {
    const repository = createPreferencesRepository(createFakeStorage());

    await expect(repository.get()).resolves.toEqual(DEFAULT_PREFERENCES);
  });

  it('faz roundtrip com cidade padrão', async () => {
    const repository = createPreferencesRepository(createFakeStorage());
    const preferences = { defaultCity: joinville, onboardingDone: true };

    await repository.save(preferences);

    await expect(repository.get()).resolves.toEqual(preferences);
  });

  it('conteúdo corrompido volta ao default com aviso, nunca crash', async () => {
    const missingTimezone = JSON.stringify({
      defaultCity: { ...joinville, timezone: undefined },
      onboardingDone: true,
    });
    const wrongFlag = JSON.stringify({ defaultCity: null, onboardingDone: 'sim' });

    for (const raw of [missingTimezone, wrongFlag, '{quebrado']) {
      const repository = createPreferencesRepository(
        createFakeStorage({ [PREFERENCES_STORAGE_KEY]: raw }),
      );
      await expect(repository.get()).resolves.toEqual(DEFAULT_PREFERENCES);
    }
    expect(logger.warn).toHaveBeenCalledTimes(2); // JSON inválido morre no parse do fake
  });
});
