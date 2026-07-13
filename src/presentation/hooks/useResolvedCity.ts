import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { Coords, LocationPermission } from '@/data/datasources/locationClient';
import { useContainer } from '@/di/ContainerProvider';
import type { City } from '@/domain/entities/city';
import { strings } from '@/presentation/i18n/strings';

import { usePreferences } from './usePreferences';

/** Id sentinela da cidade derivada do GPS — um único slot no cache de forecast. */
export const DEVICE_CITY_ID = 0;

const DEVICE_LOCATION_QUERY_KEY = ['device-location'];

type DeviceResolution = { permission: LocationPermission; city: City | null };

export type ResolvedCity = {
  isLoading: boolean;
  /** Cidade ativa do painel; `null` só quando não há GPS nem cidade padrão. */
  city: City | null;
  source: 'device' | 'default' | null;
  locationStatus: LocationPermission | null;
  /** Re-tenta a localização (botão "usar minha localização" no estado sem cidade). */
  requestLocation: () => void;
};

/**
 * Monta uma City a partir das coordenadas do device. Sem reverse-geocode
 * (native-only, sem timezone): o nome é genérico e o fuso é o do próprio
 * device — a pessoa está fisicamente ali. Reusa todo o pipeline de forecast.
 */
function deviceCityFrom(coords: Coords): City {
  return {
    id: DEVICE_CITY_ID,
    name: strings.today.deviceCityName,
    country: '',
    latitude: coords.latitude,
    longitude: coords.longitude,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * Resolve a cidade do painel "Hoje". Ordem: a localização do device
 * **sobrepõe** a cidade salva quando disponível; senão cai na `defaultCity`
 * (onboarding / escolha manual); senão `no-city`. A tentativa de GPS roda uma
 * vez (staleTime infinito) e pode ser refeita por `requestLocation`.
 */
export function useResolvedCity(): ResolvedCity {
  const container = useContainer();
  const queryClient = useQueryClient();
  const { preferences, isLoading: loadingPreferences } = usePreferences();

  const locationQuery = useQuery<DeviceResolution>({
    queryKey: DEVICE_LOCATION_QUERY_KEY,
    queryFn: async () => {
      const permission = await container.ensureLocationPermission();
      if (permission !== 'granted') return { permission, city: null };
      const coords = await container.getCurrentPosition();
      return { permission, city: coords ? deviceCityFrom(coords) : null };
    },
    staleTime: Infinity,
  });

  const deviceCity = locationQuery.data?.city ?? null;
  const defaultCity = preferences?.defaultCity ?? null;
  const city = deviceCity ?? defaultCity;

  // Não trava o painel esperando o GPS quando já há cidade padrão: pinta a
  // padrão na hora e o device sobrepõe quando (e se) resolver. Só espera o GPS
  // quando não há nada para mostrar — evita piscar "sem cidade".
  const waitingForLocation = locationQuery.isPending && defaultCity === null;

  return {
    isLoading: loadingPreferences || waitingForLocation,
    city,
    source: deviceCity ? 'device' : defaultCity ? 'default' : null,
    locationStatus: locationQuery.data?.permission ?? null,
    requestLocation: () =>
      void queryClient.invalidateQueries({ queryKey: DEVICE_LOCATION_QUERY_KEY }),
  };
}
