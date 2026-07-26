import type { Habit } from '../entities/habit';
import type { ThermalPreset, UserPreferences } from '../entities/preferences';
import type { ComfortScoringParams } from './computeComfortScore';

/**
 * Perfil de conforto resolvido: os parâmetros do motor de score (incluindo o
 * limite pessoal de umidade) mais o `tempOffset` do motor de vestimenta
 * (negativo = sente mais frio = veste mais).
 */
export type ResolvedComfortProfile = ComfortScoringParams & {
  /** °C somados à sensação térmica só na escolha do nível de agasalho. */
  tempOffset: number;
};

/** Ponto médio da faixa "equilibrado" — referência do offset derivado (§4.2). */
const NEUTRAL_MIDPOINT_C = 22;
const TEMP_OFFSET_LIMIT = 4;

/** Peso padrão do motor (4 pts/°C) — presets não mexem na inclinação. */
const TEMP_PENALTY_PER_DEGREE = 4;

type PresetParams = {
  idealTempRange: [number, number];
  maxHumidity: number;
  maxWind: number;
  tempOffset: number;
};

/**
 * Presets → parâmetros (§4.1). Friorento sente mais frio: a faixa ideal
 * desloca para cima, tolera menos vento (sensação de frio) e a vestimenta
 * trata a sensação como 3 °C mais fria. Calorento é o espelho e sofre mais
 * com mormaço, então tolera menos umidade.
 *
 * Nota: o equilibrado fixa vento em 20 km/h (spec) — não os 15 do motor
 * genérico legado. É o valor que faz a tabela de intensidade fechar com os
 * perfis antigos (moderada = pessoal = 20, intensa = +5 = 25, leve = min
 * com 15); a recomendação genérica passa a tolerar vento até 20.
 */
const PRESET_PARAMS: Record<ThermalPreset, PresetParams> = {
  friorento: { idealTempRange: [21, 28], maxHumidity: 75, maxWind: 15, tempOffset: -3 },
  equilibrado: { idealTempRange: [18, 26], maxHumidity: 70, maxWind: 20, tempOffset: 0 },
  calorento: { idealTempRange: [15, 23], maxHumidity: 60, maxWind: 25, tempOffset: 3 },
};

type IntensityModifier = {
  /** Deltas sobre a faixa ideal pessoal, em °C. */
  floorDelta: number;
  ceilDelta: number;
  windTolerance: (personal: number) => number;
};

/**
 * Modificadores por intensidade (§4.3): deltas derivados dos perfis absolutos
 * do SPECS-HABITS §6 relativos à faixa "equilibrado" [18, 26] — assim o perfil
 * equilibrado reproduz exatamente os valores antigos (leve 16–26/15,
 * moderada 15–24/20, intensa 10–20/25) e os testes de regressão seguem verdes.
 *
 * - **leve**: exposição prolongada e parada — tolera um pouco mais de frio,
 *   mas o vento pesa cedo (teto 15 km/h, o menor entre o pessoal e a base).
 * - **moderada**: esforço médio — calor incomoda antes (teto −2).
 * - **intensa**: o corpo aquece muito — faixa bem mais fria e +5 de vento.
 */
const INTENSITY_MODIFIERS: Record<Habit['intensity'], IntensityModifier> = {
  leve: {
    floorDelta: -2,
    ceilDelta: 0,
    windTolerance: (personal) => Math.min(personal, 15),
  },
  moderada: {
    floorDelta: -3,
    ceilDelta: -2,
    windTolerance: (personal) => personal,
  },
  intensa: {
    floorDelta: -8,
    ceilDelta: -6,
    windTolerance: (personal) => personal + 5,
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Perfil de conforto → parâmetros, antes de qualquer intensidade. */
function paramsFor(comfort: UserPreferences['comfort']): PresetParams {
  if (comfort.kind === 'preset') {
    return PRESET_PARAMS[comfort.preset];
  }

  // Offset derivado (§4.2): distância do ponto médio pessoal ao neutro (22 °C),
  // arredondada a inteiro e limitada a ±4. Faixa 24–30 → midpoint 27 → −4.
  const [min, max] = comfort.idealTempRange;
  const midpoint = (min + max) / 2;
  const tempOffset = clamp(
    Math.round(NEUTRAL_MIDPOINT_C - midpoint),
    -TEMP_OFFSET_LIMIT,
    TEMP_OFFSET_LIMIT,
  );

  return {
    idealTempRange: comfort.idealTempRange,
    maxHumidity: comfort.maxHumidity,
    maxWind: comfort.maxWind,
    tempOffset,
  };
}

/** O que o motor precisa saber do hábito para resolver o perfil dele. */
export type HabitComfortContext = Pick<Habit, 'intensity' | 'comfortOverride'>;

/**
 * Ponto único de resolução do perfil de conforto (§4): perfil de partida →
 * modificador de intensidade (quando há hábito). Sem hábito, o perfil pessoal
 * puro alimenta a recomendação genérica com UV normal; com hábito, UV é sempre
 * 'alto' (exposição prolongada ao ar livre, como nos perfis antigos). O
 * `tempOffset` acompanha a fonte da faixa — intensidade não o altera (o ajuste
 * de esforço já vive no motor de vestimenta).
 *
 * **Override do hábito desliga o modificador de intensidade.** O modificador
 * existe para adaptar uma preferência genérica ao esforço da atividade ("corro,
 * então tolero mais frio que a minha média"). Quando a pessoa define à mão a
 * faixa ideal *daquela* atividade — praia a 27–34 °C —, o contexto já está na
 * escolha; descontar mais 6 °C por cima distorceria uma preferência explícita.
 */
export function resolveComfortProfile(
  preferences: UserPreferences,
  habit?: HabitComfortContext,
): ResolvedComfortProfile {
  const override = habit?.comfortOverride;
  const base = paramsFor(override ?? preferences.comfort);

  const common = {
    tempPenaltyPerDegree: TEMP_PENALTY_PER_DEGREE,
    maxHumidity: base.maxHumidity,
    tempOffset: base.tempOffset,
  };

  if (habit === undefined) {
    return {
      ...common,
      idealTempRange: base.idealTempRange,
      uvWeight: 'normal',
      windToleranceKmh: base.maxWind,
    };
  }

  if (override !== undefined) {
    return {
      ...common,
      idealTempRange: base.idealTempRange,
      uvWeight: 'alto',
      windToleranceKmh: base.maxWind,
    };
  }

  const modifier = INTENSITY_MODIFIERS[habit.intensity];
  const [min, max] = base.idealTempRange;

  return {
    ...common,
    idealTempRange: [min + modifier.floorDelta, max + modifier.ceilDelta],
    uvWeight: 'alto',
    windToleranceKmh: modifier.windTolerance(base.maxWind),
  };
}
