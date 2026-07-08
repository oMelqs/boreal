import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { City } from '@/domain/entities/city';

/** Até 5 buscas recentes (§6.1), mais recente primeiro. */
const MAX_RECENT_CITIES = 5;

const STORAGE_KEY = 'boreal/city-store';

type CityStoreState = {
  /** Cidade em foco na navegação (efêmera — não persiste). */
  selectedCity: City | null;
  recentCities: City[];
  /** Seleciona para navegação e registra nas recentes (dedupe por id). */
  selectCity: (city: City) => void;
  clearRecents: () => void;
};

export const useCityStore = create<CityStoreState>()(
  persist(
    (set) => ({
      selectedCity: null,
      recentCities: [],
      selectCity: (city) =>
        set((state) => ({
          selectedCity: city,
          recentCities: [
            city,
            ...state.recentCities.filter((recent) => recent.id !== city.id),
          ].slice(0, MAX_RECENT_CITIES),
        })),
      clearRecents: () => set({ recentCities: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ recentCities: state.recentCities }),
    },
  ),
);

/** True depois que as recentes foram reidratadas do AsyncStorage. */
export function useCityStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useCityStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useCityStore.persist.onFinishHydration(() => setHydrated(true));
    return unsubscribe;
  }, []);

  return hydrated;
}
