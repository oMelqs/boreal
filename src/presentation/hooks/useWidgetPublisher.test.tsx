import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { Container } from '@/di/container';
import type { Habit } from '@/domain/entities/habit';
import { DEFAULT_USER_PREFERENCES } from '@/domain/entities/preferences';
import type { WidgetSnapshot } from '@/domain/entities/widgetSnapshot';
import { buildHabit } from '@/domain/usecases/testing/buildHabit';
import { buildDay } from '@/domain/usecases/testing/buildHourlyForecast';
import {
  createFakeContainer,
  createProvidersWrapper,
  joinville,
} from '@/presentation/testing/providers';

import { useWidgetPublisher } from './useWidgetPublisher';

const walk = buildHabit({ id: 'walk', name: 'Caminhada', days: [0, 1, 2, 3, 4, 5, 6] });

function Probe({ publishNative }: { publishNative: (snapshot: WidgetSnapshot) => Promise<void> }) {
  useWidgetPublisher({ publishNative });
  return <Text>publicador</Text>;
}

function containerWith(habits: Habit[], published: WidgetSnapshot[]): Container {
  return createFakeContainer({
    getPreferences: async () => ({
      defaultCity: joinville,
      onboardingDone: true,
      preferences: DEFAULT_USER_PREFERENCES,
    }),
    getHabits: async () => habits,
    getForecast: async () => buildDay(0, 24),
    publishWidgetSnapshot: async (snapshot) => {
      published.push(snapshot);
    },
  });
}

describe('useWidgetPublisher', () => {
  it('publica o snapshot quando cidade, hábitos e forecast chegam', async () => {
    const published: WidgetSnapshot[] = [];
    const native: WidgetSnapshot[] = [];
    const Wrapper = createProvidersWrapper(containerWith([walk], published));

    await render(
      <Wrapper>
        <Probe
          publishNative={async (snapshot) => {
            native.push(snapshot);
          }}
        />
      </Wrapper>,
    );

    await waitFor(() => expect(published).toHaveLength(1));
    expect(published[0].cityName).toBe('Joinville');
    expect(published[0].habits.map((habit) => habit.id)).toEqual(['walk']);
    // O storage alimenta o task handler do Android; o nativo desenha agora.
    expect(native).toHaveLength(1);
  });

  it('não republica o mesmo conteúdo a cada render', async () => {
    const published: WidgetSnapshot[] = [];
    const Wrapper = createProvidersWrapper(containerWith([walk], published));

    const { rerender } = await render(
      <Wrapper>
        <Probe publishNative={async () => {}} />
      </Wrapper>,
    );

    await waitFor(() => expect(published).toHaveLength(1));

    await rerender(
      <Wrapper>
        <Probe publishNative={async () => {}} />
      </Wrapper>,
    );

    expect(published).toHaveLength(1);
  });

  it('sem cidade resolvida, não publica nada', async () => {
    const published: WidgetSnapshot[] = [];
    const Wrapper = createProvidersWrapper(
      createFakeContainer({
        publishWidgetSnapshot: async (snapshot) => {
          published.push(snapshot);
        },
      }),
    );

    await render(
      <Wrapper>
        <Probe publishNative={async () => {}} />
      </Wrapper>,
    );

    await waitFor(() => expect(published).toHaveLength(0));
  });
});
