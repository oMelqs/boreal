import { createFakeStorage } from '@/data/testing/fakeStorage';
import { buildHabit } from '@/domain/usecases/testing/buildHabit';

import { createContainer } from './container';

describe('container', () => {
  it('fia hábitos e preferências no storage injetado', async () => {
    const storage = createFakeStorage();
    const container = createContainer(fetch, storage);
    const habit = buildHabit({ id: 'thor' });

    await container.saveHabit(habit);
    await container.savePreferences({ defaultCity: null, onboardingDone: true });

    await expect(container.getHabits()).resolves.toEqual([habit]);
    await expect(container.getPreferences()).resolves.toMatchObject({ onboardingDone: true });

    await container.removeHabit('thor');
    await expect(container.getHabits()).resolves.toEqual([]);
  });
});
