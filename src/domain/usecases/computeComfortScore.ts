import type { ComfortScore } from '../entities/comfortScore';
import { labelForScore } from '../entities/comfortScore';
import type { HourlyForecast } from '../entities/hourlyForecast';

/** Penalidade aplicada por cada fator, em pontos do score (0–100). */
export type ComfortPenalties = {
  temp: number;
  rain: number;
  wind: number;
  uv: number;
};

/** Valores usados no cálculo, já validados como presentes (não-null). */
export type ComfortInputs = {
  apparentTemp: number;
  precipitationProb: number;
  windSpeed: number;
  uvIndex: number;
};

/** Score da hora com o detalhamento por fator (usado para ordenar as razões). */
export type ComfortBreakdown = {
  score: ComfortScore;
  penalties: ComfortPenalties;
  inputs: ComfortInputs;
};

/** Faixa de sensação térmica considerada ideal para atividade ao ar livre. */
const IDEAL_TEMP_MIN_C = 18;
const IDEAL_TEMP_MAX_C = 26;
/** Fora da faixa ideal, cada °C de desvio custa 4 pontos, até o teto de 50. */
const TEMP_PENALTY_PER_DEGREE = 4;
const TEMP_PENALTY_CAP = 50;

/** Cada ponto percentual de chance de chuva custa 0,6 (70% ≈ −42). */
const RAIN_PROB_WEIGHT = 0.6;
/** Chuva efetiva prevista (> 0,5 mm) pesa mais que probabilidade: −25 fixo. */
const EFFECTIVE_RAIN_THRESHOLD_MM = 0.5;
const EFFECTIVE_RAIN_PENALTY = 25;

/** Vento até 15 km/h é livre; 15–30 penaliza linearmente até −15. */
const WIND_FREE_LIMIT_KMH = 15;
const WIND_MODERATE_LIMIT_KMH = 30;
/** Acima de 30 km/h, cada km/h extra custa 1,5 ponto, até o teto de 35. */
const WIND_STRONG_PENALTY_PER_KMH = 1.5;
const WIND_PENALTY_CAP = 35;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function tempPenalty(apparentTemp: number): number {
  const deviation =
    apparentTemp > IDEAL_TEMP_MAX_C
      ? apparentTemp - IDEAL_TEMP_MAX_C
      : apparentTemp < IDEAL_TEMP_MIN_C
        ? IDEAL_TEMP_MIN_C - apparentTemp
        : 0;
  return Math.min(TEMP_PENALTY_CAP, deviation * TEMP_PENALTY_PER_DEGREE);
}

function rainPenalty(precipitationProb: number, precipitationMm: number): number {
  const probPenalty = precipitationProb * RAIN_PROB_WEIGHT;
  const effectiveRainPenalty =
    precipitationMm > EFFECTIVE_RAIN_THRESHOLD_MM ? EFFECTIVE_RAIN_PENALTY : 0;
  return probPenalty + effectiveRainPenalty;
}

function windPenalty(windSpeed: number): number {
  if (windSpeed <= WIND_FREE_LIMIT_KMH) return 0;
  if (windSpeed <= WIND_MODERATE_LIMIT_KMH) return windSpeed - WIND_FREE_LIMIT_KMH;
  const basePenalty = WIND_MODERATE_LIMIT_KMH - WIND_FREE_LIMIT_KMH;
  const extra = (windSpeed - WIND_MODERATE_LIMIT_KMH) * WIND_STRONG_PENALTY_PER_KMH;
  return Math.min(WIND_PENALTY_CAP, basePenalty + extra);
}

/**
 * UV por faixas contínuas: ≤ 5 → 0, < 8 → −5, < 11 → −12, ≥ 11 → −20.
 * O SPECS define faixas inteiras (6–7, 8–10); como o índice UV da API é
 * contínuo, valores no intervalo (5, 6) caem na faixa de −5.
 */
function uvPenalty(uvIndex: number): number {
  if (uvIndex <= 5) return 0;
  if (uvIndex < 8) return 5;
  if (uvIndex < 11) return 12;
  return 20;
}

/**
 * Calcula o score de conforto (0–100) de uma hora: base 100 menos as
 * penalidades de sensação térmica, chuva, vento e UV, com clamp em [0, 100].
 *
 * Retorna `null` quando qualquer campo usado no cálculo está faltando
 * (`null` da API) — a hora é inelegível para recomendação.
 */
export function computeComfortBreakdown(hour: HourlyForecast): ComfortBreakdown | null {
  const { apparentTemp, precipitationProb, precipitationMm, windSpeed, uvIndex } = hour;
  if (
    apparentTemp === null ||
    precipitationProb === null ||
    precipitationMm === null ||
    windSpeed === null ||
    uvIndex === null
  ) {
    return null;
  }

  const penalties: ComfortPenalties = {
    temp: tempPenalty(apparentTemp),
    rain: rainPenalty(precipitationProb, precipitationMm),
    wind: windPenalty(windSpeed),
    uv: uvPenalty(uvIndex),
  };

  const total = penalties.temp + penalties.rain + penalties.wind + penalties.uv;
  const value = clamp(100 - total, 0, 100);

  return {
    score: { value, label: labelForScore(value) },
    penalties,
    inputs: { apparentTemp, precipitationProb, windSpeed, uvIndex },
  };
}

/** Atalho quando só o score interessa (ex.: células da timeline). */
export function computeComfortScore(hour: HourlyForecast): ComfortScore | null {
  return computeComfortBreakdown(hour)?.score ?? null;
}
