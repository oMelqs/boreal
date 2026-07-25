import type { ComfortScore } from '../entities/comfortScore';
import { labelForScore } from '../entities/comfortScore';
import type { HourlyForecast } from '../entities/hourlyForecast';

/**
 * Parâmetros de pontuação sensíveis à atividade. O default reproduz o motor
 * genérico do app; perfis por hábito (passeio, corrida…) ajustam faixas e
 * pesos sem duplicar o motor.
 */
export type ComfortScoringParams = {
  /** Faixa de sensação térmica sem penalidade, em °C. */
  idealTempRange: [number, number];
  /** Pontos de penalidade por °C fora da faixa ideal. */
  tempPenaltyPerDegree: number;
  /** 'alto' dobra as penalidades de UV (atividades de exposição prolongada). */
  uvWeight: 'normal' | 'alto';
  /** Velocidade de vento (km/h) onde a penalidade começa. */
  windToleranceKmh: number;
  /** Umidade relativa (%) a partir da qual o abafamento penaliza. */
  maxHumidity: number;
};

/** Comportamento original do app: faixa 18–26 °C, 4 pts/°C, UV normal, vento livre até 15. */
export const DEFAULT_COMFORT_PARAMS: ComfortScoringParams = {
  idealTempRange: [18, 26],
  tempPenaltyPerDegree: 4,
  uvWeight: 'normal',
  windToleranceKmh: 15,
  maxHumidity: 70,
};

/** Penalidade aplicada por cada fator, em pontos do score (0–100). */
export type ComfortPenalties = {
  temp: number;
  rain: number;
  wind: number;
  uv: number;
  humidity: number;
};

/** Valores usados no cálculo, já validados como presentes (não-null). */
export type ComfortInputs = {
  apparentTemp: number;
  precipitationProb: number;
  windSpeed: number;
  uvIndex: number;
  humidity: number;
};

/** Score da hora com o detalhamento por fator (usado para ordenar as razões). */
export type ComfortBreakdown = {
  score: ComfortScore;
  penalties: ComfortPenalties;
  inputs: ComfortInputs;
};

/** Teto da penalidade de temperatura. */
const TEMP_PENALTY_CAP = 50;

/** Cada ponto percentual de chance de chuva custa 0,6 (70% ≈ −42). */
const RAIN_PROB_WEIGHT = 0.6;
/** Chuva efetiva prevista (> 0,5 mm) pesa mais que probabilidade: −25 fixo. */
const EFFECTIVE_RAIN_THRESHOLD_MM = 0.5;
const EFFECTIVE_RAIN_PENALTY = 25;

/** Largura da banda linear de vento (tolerância → tolerância + 15 = até −15). */
const WIND_LINEAR_BAND_KMH = 15;
/** Acima da banda linear, cada km/h extra custa 1,5 ponto, até o teto de 35. */
const WIND_STRONG_PENALTY_PER_KMH = 1.5;
const WIND_PENALTY_CAP = 35;

/** Umidade só pesa de verdade combinada com calor (§5.2 das preferências). */
const MUGGY_TEMP_THRESHOLD_C = 22;
/** Cada ponto de UR acima do limite pessoal custa 0,8 no mormaço. */
const HUMIDITY_PENALTY_PER_POINT = 0.8;
const HUMIDITY_HOT_CAP = 25;
/** Ar úmido e frio incomoda menos que mormaço: metade da penalidade. */
const HUMIDITY_COLD_FACTOR = 0.5;
const HUMIDITY_COLD_CAP = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function tempPenalty(apparentTemp: number, params: ComfortScoringParams): number {
  const [idealMin, idealMax] = params.idealTempRange;
  const deviation =
    apparentTemp > idealMax
      ? apparentTemp - idealMax
      : apparentTemp < idealMin
        ? idealMin - apparentTemp
        : 0;
  return Math.min(TEMP_PENALTY_CAP, deviation * params.tempPenaltyPerDegree);
}

function rainPenalty(precipitationProb: number, precipitationMm: number): number {
  const probPenalty = precipitationProb * RAIN_PROB_WEIGHT;
  const effectiveRainPenalty =
    precipitationMm > EFFECTIVE_RAIN_THRESHOLD_MM ? EFFECTIVE_RAIN_PENALTY : 0;
  return probPenalty + effectiveRainPenalty;
}

function windPenalty(windSpeed: number, params: ComfortScoringParams): number {
  const freeLimit = params.windToleranceKmh;
  const linearLimit = freeLimit + WIND_LINEAR_BAND_KMH;
  if (windSpeed <= freeLimit) return 0;
  if (windSpeed <= linearLimit) return windSpeed - freeLimit;
  const extra = (windSpeed - linearLimit) * WIND_STRONG_PENALTY_PER_KMH;
  return Math.min(WIND_PENALTY_CAP, WIND_LINEAR_BAND_KMH + extra);
}

/**
 * Umidade acima do limite pessoal (§5.2): no calor (sensação ≥ 22 °C) é
 * mormaço — 0,8 ponto por % excedente, cap 25; no frio, metade com cap 12.
 */
function humidityPenalty(
  humidity: number,
  apparentTemp: number,
  params: ComfortScoringParams,
): number {
  const excess = humidity - params.maxHumidity;
  if (excess <= 0) return 0;
  const hotPenalty = excess * HUMIDITY_PENALTY_PER_POINT;
  return apparentTemp >= MUGGY_TEMP_THRESHOLD_C
    ? Math.min(HUMIDITY_HOT_CAP, hotPenalty)
    : Math.min(HUMIDITY_COLD_CAP, hotPenalty * HUMIDITY_COLD_FACTOR);
}

/**
 * UV por faixas contínuas: ≤ 5 → 0, < 8 → −5, < 11 → −12, ≥ 11 → −20.
 * O SPECS define faixas inteiras (6–7, 8–10); como o índice UV da API é
 * contínuo, valores no intervalo (5, 6) caem na faixa de −5.
 * `uvWeight: 'alto'` dobra a penalidade (exposição prolongada ao sol).
 */
function uvPenalty(uvIndex: number, params: ComfortScoringParams): number {
  const base = uvIndex <= 5 ? 0 : uvIndex < 8 ? 5 : uvIndex < 11 ? 12 : 20;
  return params.uvWeight === 'alto' ? base * 2 : base;
}

/**
 * Calcula o score de conforto (0–100) de uma hora: base 100 menos as
 * penalidades de sensação térmica, chuva, vento e UV, com clamp em [0, 100].
 *
 * Retorna `null` quando qualquer campo usado no cálculo está faltando
 * (`null` da API) — a hora é inelegível para recomendação.
 */
export function computeComfortBreakdown(
  hour: HourlyForecast,
  params: ComfortScoringParams = DEFAULT_COMFORT_PARAMS,
): ComfortBreakdown | null {
  const { apparentTemp, precipitationProb, precipitationMm, windSpeed, uvIndex, humidity } = hour;
  if (
    apparentTemp === null ||
    precipitationProb === null ||
    precipitationMm === null ||
    windSpeed === null ||
    uvIndex === null ||
    humidity === null
  ) {
    return null;
  }

  const penalties: ComfortPenalties = {
    temp: tempPenalty(apparentTemp, params),
    rain: rainPenalty(precipitationProb, precipitationMm),
    wind: windPenalty(windSpeed, params),
    uv: uvPenalty(uvIndex, params),
    humidity: humidityPenalty(humidity, apparentTemp, params),
  };

  const total =
    penalties.temp + penalties.rain + penalties.wind + penalties.uv + penalties.humidity;
  const value = clamp(100 - total, 0, 100);

  return {
    score: { value, label: labelForScore(value) },
    penalties,
    inputs: { apparentTemp, precipitationProb, windSpeed, uvIndex, humidity },
  };
}

/** Atalho quando só o score interessa (ex.: células da timeline). */
export function computeComfortScore(
  hour: HourlyForecast,
  params: ComfortScoringParams = DEFAULT_COMFORT_PARAMS,
): ComfortScore | null {
  return computeComfortBreakdown(hour, params)?.score ?? null;
}
