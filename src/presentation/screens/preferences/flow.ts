import type { Href } from 'expo-router';

/**
 * O mesmo formulário serve dois contextos (§8): etapas do onboarding e fluxo
 * avulso em /preferences. Só os destinos e a contagem de etapas mudam, então
 * as telas recebem o modo e consultam este mapa.
 */
export type PreferencesFlow = {
  temperature: Href;
  humidity: Href;
  wind: Href;
  sleep: Href;
  /** Para onde ir depois da rotina de sono. */
  afterSleep: Href;
  /** Posição das etapas principais no StepHeader. */
  steps: { thermal: number; sleep: number; review: number; total: number };
};

const ONBOARDING_FLOW: PreferencesFlow = {
  temperature: '/onboarding/comfort/temperature',
  humidity: '/onboarding/comfort/humidity',
  wind: '/onboarding/comfort/wind',
  sleep: '/onboarding/sleep',
  afterSleep: '/onboarding/habits',
  // Cidade 1, sensibilidade 2, sono 3, hábitos 4, revisão 5.
  steps: { thermal: 2, sleep: 3, review: 5, total: 5 },
};

const STANDALONE_FLOW: PreferencesFlow = {
  temperature: '/preferences/temperature',
  humidity: '/preferences/humidity',
  wind: '/preferences/wind',
  sleep: '/preferences/sleep',
  afterSleep: '/preferences/review',
  steps: { thermal: 1, sleep: 2, review: 3, total: 3 },
};

export function preferencesFlow(standalone: boolean): PreferencesFlow {
  return standalone ? STANDALONE_FLOW : ONBOARDING_FLOW;
}
