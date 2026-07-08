import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';

import type { City } from '@/domain/entities/city';

import { useCityStore } from './useCityStore';

function buildCity(id: number, name = `Cidade ${id}`): City {
  return {
    id,
    name,
    admin1: 'Santa Catarina',
    country: 'Brasil',
    latitude: -26.3,
    longitude: -48.84,
    timezone: 'America/Sao_Paulo',
  };
}

describe('useCityStore', () => {
  beforeEach(() => {
    useCityStore.setState({ selectedCity: null, recentCities: [] });
  });

  it('selecionar cidade define a seleção e alimenta as recentes', () => {
    const city = buildCity(1);

    useCityStore.getState().selectCity(city);

    expect(useCityStore.getState().selectedCity).toEqual(city);
    expect(useCityStore.getState().recentCities).toEqual([city]);
  });

  it('re-selecionar cidade já recente move para o topo sem duplicar', () => {
    const [a, b, c] = [buildCity(1), buildCity(2), buildCity(3)];
    const { selectCity } = useCityStore.getState();

    selectCity(a);
    selectCity(b);
    selectCity(c);
    selectCity(a);

    expect(useCityStore.getState().recentCities.map((r) => r.id)).toEqual([1, 3, 2]);
  });

  it('mantém no máximo 5 recentes, descartando a mais antiga', () => {
    const { selectCity } = useCityStore.getState();
    for (let id = 1; id <= 6; id++) selectCity(buildCity(id));

    expect(useCityStore.getState().recentCities.map((r) => r.id)).toEqual([6, 5, 4, 3, 2]);
  });

  it('limpar recentes esvazia a lista sem afetar a seleção', () => {
    const city = buildCity(1);
    useCityStore.getState().selectCity(city);

    useCityStore.getState().clearRecents();

    expect(useCityStore.getState().recentCities).toEqual([]);
    expect(useCityStore.getState().selectedCity).toEqual(city);
  });

  it('persiste apenas as recentes no AsyncStorage (seleção é efêmera)', async () => {
    useCityStore.getState().selectCity(buildCity(7));

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('boreal/city-store');
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw as string) as { state: Record<string, unknown> };
      expect(Object.keys(persisted.state)).toEqual(['recentCities']);
      expect(persisted.state.recentCities).toHaveLength(1);
    });
  });
});
