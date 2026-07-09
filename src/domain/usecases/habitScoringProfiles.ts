import type { HabitIntensity } from '../entities/habit';
import type { ComfortScoringParams } from './computeComfortScore';

/**
 * Perfis de pontuação por intensidade (SPECS-HABITS §6). Todos com UV 'alto'
 * (dobra as penalidades — exposição prolongada ao ar livre) e o peso padrão
 * de 4 pts/°C.
 *
 * - **leve** (passeio com pet): exposição prolongada e parada; asfalto quente
 *   machuca pata — UV e calor pesam mais. Faixa 16–26 °C, vento livre até 15.
 * - **moderada** (caminhada): esforço médio, calor incomoda antes.
 *   Faixa 15–24 °C, vento até 20.
 * - **intensa** (corrida, bike): o corpo aquece muito; frio leve é bom.
 *   Faixa 10–20 °C, vento até 25.
 */
export const INTENSITY_PROFILES: Record<HabitIntensity, ComfortScoringParams> = {
  leve: {
    idealTempRange: [16, 26],
    tempPenaltyPerDegree: 4,
    uvWeight: 'alto',
    windToleranceKmh: 15,
  },
  moderada: {
    idealTempRange: [15, 24],
    tempPenaltyPerDegree: 4,
    uvWeight: 'alto',
    windToleranceKmh: 20,
  },
  intensa: {
    idealTempRange: [10, 20],
    tempPenaltyPerDegree: 4,
    uvWeight: 'alto',
    windToleranceKmh: 25,
  },
};
