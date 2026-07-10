import type { City } from './city';

/** Preferências locais da pessoa usuária (§4 dos hábitos). */
export type Preferences = {
  /** Cidade padrão dos hábitos; null antes do onboarding. */
  defaultCity: City | null;
  onboardingDone: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  defaultCity: null,
  onboardingDone: false,
};
