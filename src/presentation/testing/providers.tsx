import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import type { Container } from '@/di/container';
import { ContainerProvider } from '@/di/ContainerProvider';
import type { City } from '@/domain/entities/city';

export const joinville: City = {
  id: 3459712,
  name: 'Joinville',
  admin1: 'Santa Catarina',
  country: 'Brasil',
  latitude: -26.30444,
  longitude: -48.84556,
  timezone: 'America/Sao_Paulo',
};

export function createFakeContainer(overrides: Partial<Container> = {}): Container {
  return {
    searchCity: async () => [joinville],
    getForecast: async () => [],
    getHabits: async () => [],
    saveHabit: async () => {},
    removeHabit: async () => {},
    getPreferences: async () => ({ defaultCity: null, onboardingDone: false }),
    savePreferences: async () => {},
    // Sem GPS por padrão: os testes caem no fallback de cidade padrão.
    ensureLocationPermission: async () => 'unavailable',
    getCurrentPosition: async () => null,
    ...overrides,
  };
}

/** Wrapper de teste: container fake + React Query sem retry. */
export function createProvidersWrapper(container: Container) {
  const queryClient = new QueryClient({
    // gcTime Infinity: sem timers de GC pendurados derrubando o worker do Jest
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });

  return function Providers({ children }: { children: ReactNode }) {
    return (
      <ContainerProvider container={container}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ContainerProvider>
    );
  };
}
