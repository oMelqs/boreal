import { renderHook, waitFor } from '@testing-library/react-native';

import { strings } from '@/presentation/i18n/strings';
import { createFakeContainer, createProvidersWrapper, joinville } from '@/presentation/testing/providers';

import { DEVICE_CITY_ID, useResolvedCity } from './useResolvedCity';

async function render(container = createFakeContainer()) {
  return renderHook(() => useResolvedCity(), {
    wrapper: createProvidersWrapper(container),
  });
}

describe('useResolvedCity', () => {
  it('GPS concedido sobrepõe a cidade padrão', async () => {
    const container = createFakeContainer({
      getPreferences: async () => ({ defaultCity: joinville, onboardingDone: true }),
      ensureLocationPermission: async () => 'granted',
      getCurrentPosition: async () => ({ latitude: -23.55, longitude: -46.63 }),
    });
    const { result } = await render(container);

    await waitFor(() => expect(result.current.source).toBe('device'));
    expect(result.current.city?.id).toBe(DEVICE_CITY_ID);
    expect(result.current.city?.name).toBe(strings.today.deviceCityName);
    expect(result.current.city?.latitude).toBe(-23.55);
    expect(result.current.locationStatus).toBe('granted');
  });

  it('GPS negado cai na cidade padrão', async () => {
    const container = createFakeContainer({
      getPreferences: async () => ({ defaultCity: joinville, onboardingDone: true }),
      ensureLocationPermission: async () => 'denied',
    });
    const { result } = await render(container);

    await waitFor(() => expect(result.current.source).toBe('default'));
    expect(result.current.city?.name).toBe('Joinville');
    expect(result.current.locationStatus).toBe('denied');
  });

  it('GPS concedido mas sem posição cai na cidade padrão', async () => {
    const container = createFakeContainer({
      getPreferences: async () => ({ defaultCity: joinville, onboardingDone: true }),
      ensureLocationPermission: async () => 'granted',
      getCurrentPosition: async () => null,
    });
    const { result } = await render(container);

    await waitFor(() => expect(result.current.source).toBe('default'));
    expect(result.current.city?.name).toBe('Joinville');
  });

  it('sem GPS e sem cidade padrão → sem cidade', async () => {
    const container = createFakeContainer({
      getPreferences: async () => ({ defaultCity: null, onboardingDone: true }),
      ensureLocationPermission: async () => 'unavailable',
    });
    const { result } = await render(container);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.city).toBeNull();
    expect(result.current.source).toBeNull();
    expect(result.current.locationStatus).toBe('unavailable');
  });
});
