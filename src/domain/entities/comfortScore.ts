export type ComfortLabel = 'otimo' | 'bom' | 'razoavel' | 'ruim';

/** Score de conforto de uma hora (0–100) com a classificação para a UI. */
export type ComfortScore = {
  value: number;
  label: ComfortLabel;
};

/**
 * Classificação do score para a UI: ≥ 75 Ótimo, 50–74 Bom, 25–49 Razoável,
 * < 25 Ruim.
 */
export function labelForScore(value: number): ComfortLabel {
  if (value >= 75) return 'otimo';
  if (value >= 50) return 'bom';
  if (value >= 25) return 'razoavel';
  return 'ruim';
}
