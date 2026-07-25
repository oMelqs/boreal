import type { Preferences } from '@/domain/entities/preferences';
import { DEFAULT_PREFERENCES, DEFAULT_USER_PREFERENCES } from '@/domain/entities/preferences';

import { logger } from '../logger';
import { createFakeStorage } from '../testing/fakeStorage';
import {
  createPreferencesRepository,
  LEGACY_PREFERENCES_STORAGE_KEY,
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

/** Fixture real do formato v1, como gravado pelo app antes das preferências. */
const V1_FIXTURE = JSON.stringify({ defaultCity: joinville, onboardingDone: true });

describe('preferencesRepositoryImpl', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  it('ausência de dados resolve o default (onboarding pendente)', async () => {
    const repository = createPreferencesRepository(createFakeStorage());

    await expect(repository.get()).resolves.toEqual(DEFAULT_PREFERENCES);
  });

  it('faz roundtrip v2 com perfil custom e rotina de sono', async () => {
    const repository = createPreferencesRepository(createFakeStorage());
    const preferences: Preferences = {
      defaultCity: joinville,
      onboardingDone: true,
      preferences: {
        comfort: { kind: 'custom', idealTempRange: [24, 30], maxHumidity: 60, maxWind: 35 },
        sleep: { wakeTime: '07:00', sleepTime: '23:00' },
      },
    };

    await repository.save(preferences);

    await expect(repository.get()).resolves.toEqual(preferences);
  });

  it('migra prefs:v1 para v2 preservando dados, com perfil default e v1 intocado (§11)', async () => {
    const storage = createFakeStorage({ [LEGACY_PREFERENCES_STORAGE_KEY]: V1_FIXTURE });
    const repository = createPreferencesRepository(storage);

    const migrated = await repository.get();

    expect(migrated).toEqual({
      defaultCity: joinville,
      onboardingDone: true,
      preferences: DEFAULT_USER_PREFERENCES,
    });
    // v2 gravado para as próximas leituras; v1 segue no storage (rollback barato).
    await expect(storage.getJson(PREFERENCES_STORAGE_KEY)).resolves.toEqual(migrated);
    await expect(storage.getJson(LEGACY_PREFERENCES_STORAGE_KEY)).resolves.toEqual(
      JSON.parse(V1_FIXTURE),
    );
  });

  it('v2 existente vence o v1 legado', async () => {
    const v2: Preferences = {
      defaultCity: null,
      onboardingDone: true,
      preferences: { comfort: { kind: 'preset', preset: 'calorento' } },
    };
    const storage = createFakeStorage({
      [PREFERENCES_STORAGE_KEY]: JSON.stringify(v2),
      [LEGACY_PREFERENCES_STORAGE_KEY]: V1_FIXTURE,
    });

    await expect(createPreferencesRepository(storage).get()).resolves.toEqual(v2);
  });

  it('v2 corrompido volta ao default com aviso, sem ressuscitar o v1', async () => {
    const badPreset = JSON.stringify({
      defaultCity: null,
      onboardingDone: true,
      preferences: { comfort: { kind: 'preset', preset: 'polar' } },
    });
    const storage = createFakeStorage({
      [PREFERENCES_STORAGE_KEY]: badPreset,
      [LEGACY_PREFERENCES_STORAGE_KEY]: V1_FIXTURE,
    });

    await expect(createPreferencesRepository(storage).get()).resolves.toEqual(
      DEFAULT_PREFERENCES,
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('v1 corrompido volta ao default com aviso, nunca crash', async () => {
    for (const raw of [
      JSON.stringify({ defaultCity: { name: 'sem os demais campos' }, onboardingDone: true }),
      JSON.stringify({ defaultCity: null, onboardingDone: 'sim' }),
      '{quebrado',
    ]) {
      const storage = createFakeStorage({ [LEGACY_PREFERENCES_STORAGE_KEY]: raw });
      await expect(createPreferencesRepository(storage).get()).resolves.toEqual(
        DEFAULT_PREFERENCES,
      );
    }
    // Só os shapes inválidos avisam: JSON quebrado já morre no parse do storage.
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });
});
