import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Preferência manual de tema; `null` = seguir o esquema do sistema. */
export type ThemeOverride = 'light' | 'dark' | null;

const STORAGE_KEY = 'boreal/theme';

type ThemeStoreState = {
  override: ThemeOverride;
  /** Fixa o tema claro/escuro, sobrepondo o sistema (persistido). */
  setOverride: (scheme: 'light' | 'dark') => void;
};

/**
 * Override de tema escolhido pela pessoa. Persistido no AsyncStorage (mesma
 * disciplina do useCityStore); reidratação assíncrona pode causar um flash
 * breve na primeira carga se a escolha divergir do sistema — aceito.
 */
export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set) => ({
      override: null,
      setOverride: (scheme) => set({ override: scheme }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
