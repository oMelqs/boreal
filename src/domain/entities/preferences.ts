import type { City } from './city';

/** Preferências locais da pessoa usuária (§4 dos hábitos + §3 das preferências). */
export type Preferences = {
  /** Cidade padrão dos hábitos; null antes do onboarding. */
  defaultCity: City | null;
  onboardingDone: boolean;
  /** Perfil de conforto e rotina de sono que parametrizam os motores. */
  preferences: UserPreferences;
};

/** Sensibilidade térmica em linguagem natural (§3 das preferências). */
export type ThermalPreset = 'friorento' | 'equilibrado' | 'calorento';

/**
 * Perfil de conforto da pessoa: um preset em linguagem natural ou faixas
 * manuais. Os valores custom são validados por `validatePreferences`.
 */
export type ComfortPreferences =
  | { kind: 'preset'; preset: ThermalPreset }
  | {
      kind: 'custom';
      /** °C de sensação térmica; min < max, dentro de [-10, 45], amplitude ≥ 4. */
      idealTempRange: [number, number];
      /** % UR a partir da qual o abafamento incomoda; 40–100. */
      maxHumidity: number;
      /** km/h a partir do qual o vento incomoda; 5–60. */
      maxWind: number;
    };

/** Rotina de sono no relógio local da cidade padrão; pode cruzar meia-noite. */
export type SleepSchedule = {
  /** "HH:mm" — início da janela acordada. */
  wakeTime: string;
  /** "HH:mm" — fim da janela acordada (ex.: dormir 01:00 vira o dia seguinte). */
  sleepTime: string;
};

/**
 * Preferências que parametrizam os motores. `sleep` ausente = comportamento
 * legado por `is_day` (quem nunca configurou não vê nada mudar).
 */
export type UserPreferences = {
  comfort: ComfortPreferences;
  sleep?: SleepSchedule;
};

/** Equilibrado sem rotina de sono: reproduz o comportamento original do app. */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  comfort: { kind: 'preset', preset: 'equilibrado' },
};

export const DEFAULT_PREFERENCES: Preferences = {
  defaultCity: null,
  onboardingDone: false,
  preferences: DEFAULT_USER_PREFERENCES,
};
