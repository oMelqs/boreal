import type { WidgetSnapshot } from '@/domain/entities/widgetSnapshot';
import { WIDGET_SCHEMA_VERSION } from '@/domain/entities/widgetSnapshot';

import { logger } from '../logger';
import { createFakeStorage } from '../testing/fakeStorage';
import { createWidgetRepository, WIDGET_STORAGE_KEY } from './widgetRepositoryImpl';

const snapshot: WidgetSnapshot = {
  schemaVersion: WIDGET_SCHEMA_VERSION,
  generatedAt: '2026-07-08T15:00:00.000Z',
  cityName: 'Joinville',
  now: {
    temp: 23,
    apparentTemp: 24,
    weatherCode: 1,
    isDay: true,
    outfit: { level: 'leve', accessories: ['protetor-solar'], summary: 'Roupa leve resolve.' },
  },
  hours: [{ hour: 15, temp: 23, rainProb: 10, weatherCode: 1, isDay: true }],
  nextHabit: null,
  habits: [],
};

describe('widgetRepositoryImpl', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  it('publica e lê o mesmo payload', async () => {
    const repository = createWidgetRepository(createFakeStorage());

    await repository.publish(snapshot);

    expect(await repository.read()).toEqual(snapshot);
  });

  it('sem nada publicado, a leitura devolve null', async () => {
    const repository = createWidgetRepository(createFakeStorage());

    expect(await repository.read()).toBeNull();
  });

  it('descarta payload de versão desconhecida', async () => {
    const storage = createFakeStorage({
      [WIDGET_STORAGE_KEY]: JSON.stringify({ ...snapshot, schemaVersion: 99 }),
    });

    expect(await createWidgetRepository(storage).read()).toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('descarta payload com shape quebrado sem lançar', async () => {
    const storage = createFakeStorage({
      [WIDGET_STORAGE_KEY]: JSON.stringify({ schemaVersion: WIDGET_SCHEMA_VERSION, now: 42 }),
    });

    expect(await createWidgetRepository(storage).read()).toBeNull();
  });

  it('JSON corrompido no storage vira null, não crash', async () => {
    const storage = createFakeStorage({ [WIDGET_STORAGE_KEY]: '{ isso não é json' });

    await expect(createWidgetRepository(storage).read()).resolves.toBeNull();
  });
});
