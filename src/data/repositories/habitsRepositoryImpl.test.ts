import { buildHabit } from '@/domain/usecases/testing/buildHabit';

import { logger } from '../logger';
import { createFakeStorage } from '../testing/fakeStorage';
import { createHabitsRepository, HABITS_STORAGE_KEY } from './habitsRepositoryImpl';

describe('habitsRepositoryImpl', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  it('chave ausente resolve lista vazia', async () => {
    const repository = createHabitsRepository(createFakeStorage());

    await expect(repository.getAll()).resolves.toEqual([]);
  });

  it('save cria e upsert substitui pelo id', async () => {
    const repository = createHabitsRepository(createFakeStorage());
    const habit = buildHabit({ id: 'a', name: 'Passear com o Thor' });

    await repository.save(habit);
    await repository.save(buildHabit({ id: 'b', name: 'Academia' }));
    await repository.save({ ...habit, name: 'Passear com o Zeus' });

    const all = await repository.getAll();
    expect(all).toHaveLength(2);
    expect(all.find((h) => h.id === 'a')?.name).toBe('Passear com o Zeus');
  });

  it('remove apaga só o hábito do id', async () => {
    const repository = createHabitsRepository(createFakeStorage());
    await repository.save(buildHabit({ id: 'a' }));
    await repository.save(buildHabit({ id: 'b' }));

    await repository.remove('a');

    const all = await repository.getAll();
    expect(all.map((h) => h.id)).toEqual(['b']);
  });

  it('lixo misturado no storage: só os registros válidos sobrevivem, com aviso', async () => {
    const valid = buildHabit({ id: 'ok' });
    const noSchedule = { ...buildHabit({ id: 'x1' }), schedule: undefined };
    const unknownKind = {
      ...buildHabit({ id: 'x2' }),
      schedule: { kind: 'lunar', phase: 'cheia' },
    };
    const failsRules = buildHabit({ id: 'x3', name: '' }); // shape ok, regra não
    const storage = createFakeStorage({
      [HABITS_STORAGE_KEY]: JSON.stringify([noSchedule, valid, unknownKind, failsRules, 42]),
    });

    const all = await createHabitsRepository(storage).getAll();

    expect(all.map((h) => h.id)).toEqual(['ok']);
    expect(logger.warn).toHaveBeenCalledTimes(4);
  });

  it('raiz que não é lista vira lista vazia com aviso, nunca crash', async () => {
    const storage = createFakeStorage({
      [HABITS_STORAGE_KEY]: JSON.stringify({ hacked: true }),
    });

    await expect(createHabitsRepository(storage).getAll()).resolves.toEqual([]);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('save por cima de storage corrompido regrava só o que presta', async () => {
    const storage = createFakeStorage({ [HABITS_STORAGE_KEY]: '{quebrado' });
    const repository = createHabitsRepository(storage);

    await repository.save(buildHabit({ id: 'novo' }));

    const all = await repository.getAll();
    expect(all.map((h) => h.id)).toEqual(['novo']);
  });
});
