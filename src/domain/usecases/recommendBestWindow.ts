import { labelForScore } from '../entities/comfortScore';
import type { HourlyForecast } from '../entities/hourlyForecast';
import type { Recommendation } from '../entities/recommendation';
import type {
  ComfortBreakdown,
  ComfortInputs,
  ComfortPenalties,
  ComfortScoringParams,
} from './computeComfortScore';
import { computeComfortBreakdown, DEFAULT_COMFORT_PARAMS } from './computeComfortScore';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Perfil de pontuação da recomendação. O default reproduz o motor genérico;
 * perfis por hábito ajustam faixas, pesos, tamanho de janela e restrições de
 * horário sem duplicar o motor.
 */
export type ScoringProfile = ComfortScoringParams & {
  /**
   * Tamanho da janela em horas cheias (granularidade da API). O default
   * {min: 2, max: 3} preserva o comportamento original: janelas de 2–3h,
   * preferindo 2h em empate. Hábitos travam min === max.
   */
  windowHours: { min: number; max: number };
  /**
   * Restrições de horário do hábito ("HH:mm", relógio local da cidade).
   * Hora elegível precisa começar em `earliest` ou depois e terminar até
   * `latest` (início + 1h ≤ latest).
   */
  bounds?: { earliest?: string; latest?: string };
};

/** Comportamento original do app (tela de recomendação genérica). */
export const DEFAULT_SCORING_PROFILE: ScoringProfile = {
  ...DEFAULT_COMFORT_PARAMS,
  windowHours: { min: 2, max: 3 },
};

/** Abaixo desta média a recomendação vem com enquadramento honesto (caveat). */
const LOW_SCORE_THRESHOLD = 40;

/** Tolerância para empate de médias com penalidades fracionárias (0,6 × prob). */
const SCORE_EPSILON = 1e-9;

/** A partir deste UV a janela ganha o aviso de protetor solar. */
const HIGH_UV_THRESHOLD = 8;

/** Máximo de fatores citados na frase explicativa. */
const MAX_REASONS = 3;

type ScoredHour = {
  hour: HourlyForecast;
  breakdown: ComfortBreakdown;
};

type WindowCandidate = {
  hours: ScoredHour[];
  average: number;
};

/**
 * Recomenda a melhor janela contígua de 2–3h para sair, considerando apenas
 * horas futuras do dia local (a partir da hora atual, inclusive), de dia
 * (`isDay`) e com dados completos.
 *
 * `hours` e `now` devem estar no MESMO referencial de tempo (o wall-clock da
 * cidade consultada) — o motor só compara instantes, sem depender do timezone
 * do device.
 *
 * Guardas:
 * - Sem horas de dia restantes (ou menos que a janela mínima) → `day-over`.
 * - Havia horas de dia restantes, mas todas sem dados utilizáveis → `no-data`.
 * - Melhor média < 40 → recomenda mesmo assim, com `caveat` do motivo dominante.
 */
export function recommendBestWindow(
  hours: readonly HourlyForecast[],
  now: Date,
  profile: ScoringProfile = DEFAULT_SCORING_PROFILE,
): Recommendation {
  const currentHourStart = Math.floor(now.getTime() / HOUR_MS) * HOUR_MS;
  const future = [...hours]
    .filter((hour) => hour.time.getTime() >= currentHourStart)
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  const daylight = future.filter((hour) => hour.isDay);
  if (daylight.length === 0) {
    return { kind: 'day-over' };
  }

  const bounded = daylight.filter((hour) => withinBounds(hour.time, profile.bounds));
  if (bounded.length === 0) {
    // Havia dia pela frente, mas as restrições do hábito não deixam janela.
    return { kind: 'day-over' };
  }

  const eligible: ScoredHour[] = [];
  for (const hour of bounded) {
    const breakdown = computeComfortBreakdown(hour, profile);
    if (breakdown) eligible.push({ hour, breakdown });
  }
  if (eligible.length === 0) {
    return { kind: 'no-data' };
  }

  const best = findBestWindow(eligible, profile.windowHours);
  if (!best) {
    return { kind: 'day-over' };
  }

  const lastHour = best.hours[best.hours.length - 1].hour;
  const value = best.average;
  const reasons = buildReasons(best, profile);

  return {
    kind: 'window',
    start: best.hours[0].hour.time,
    end: new Date(lastHour.time.getTime() + HOUR_MS),
    averageScore: { value, label: labelForScore(value) },
    reasons,
    ...(value < LOW_SCORE_THRESHOLD ? { caveat: dominantReason(best, profile) } : {}),
  };
}

/** "HH:mm" → minutos desde a meia-noite local. */
function parseTimeString(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Hora elegível: começa em `earliest` ou depois e termina até `latest`. */
function withinBounds(time: Date, bounds: ScoringProfile['bounds']): boolean {
  if (!bounds) return true;
  const startMinutes = time.getUTCHours() * 60 + time.getUTCMinutes();
  if (bounds.earliest !== undefined && startMinutes < parseTimeString(bounds.earliest)) {
    return false;
  }
  if (bounds.latest !== undefined && startMinutes + 60 > parseTimeString(bounds.latest)) {
    return false;
  }
  return true;
}

/**
 * Janela deslizante de 2–3h sobre runs contíguos de horas elegíveis (um gap
 * de hora inelegível quebra a contiguidade). Empate de média: janela menor
 * vence (2h > 3h em precisão); persistindo, a mais cedo (quem pergunta agora
 * provavelmente quer sair logo).
 */
function findBestWindow(
  eligible: ScoredHour[],
  windowHours: ScoringProfile['windowHours'],
): WindowCandidate | null {
  const runs: ScoredHour[][] = [];
  let currentRun: ScoredHour[] = [];
  for (const scored of eligible) {
    const previous = currentRun[currentRun.length - 1];
    const isContiguous =
      previous !== undefined &&
      scored.hour.time.getTime() - previous.hour.time.getTime() === HOUR_MS;
    if (previous === undefined || isContiguous) {
      currentRun.push(scored);
    } else {
      runs.push(currentRun);
      currentRun = [scored];
    }
  }
  if (currentRun.length > 0) runs.push(currentRun);

  let best: WindowCandidate | null = null;
  for (const run of runs) {
    for (let size = windowHours.min; size <= windowHours.max; size++) {
      for (let start = 0; start + size <= run.length; start++) {
        const windowHours = run.slice(start, start + size);
        const average =
          windowHours.reduce((sum, s) => sum + s.breakdown.score.value, 0) / size;
        if (best === null || isBetter({ hours: windowHours, average }, best)) {
          best = { hours: windowHours, average };
        }
      }
    }
  }
  return best;
}

function isBetter(candidate: WindowCandidate, best: WindowCandidate): boolean {
  if (candidate.average > best.average + SCORE_EPSILON) return true;
  if (Math.abs(candidate.average - best.average) > SCORE_EPSILON) return false;
  if (candidate.hours.length !== best.hours.length) {
    return candidate.hours.length < best.hours.length;
  }
  return candidate.hours[0].hour.time.getTime() < best.hours[0].hour.time.getTime();
}

type Factor = keyof ComfortPenalties;

type ReasonCandidate = {
  factor: Factor;
  penalty: number;
  phrase: string;
};

/**
 * Fatores da janela com frase e penalidade média, ordenados do que mais pesou
 * no score para o que menos pesou (§5.3). UV só entra quando exige cuidado
 * (≥ 8 em alguma hora da janela); temp/chuva/vento sempre têm leitura, mesmo
 * positiva ("temperatura agradável", "baixa chance de chuva"...).
 */
function reasonCandidates(window: WindowCandidate, profile: ScoringProfile): ReasonCandidate[] {
  const candidates: ReasonCandidate[] = [
    {
      factor: 'temp',
      penalty: averagePenalty(window, 'temp'),
      phrase: tempPhrase(window, profile),
    },
    { factor: 'rain', penalty: averagePenalty(window, 'rain'), phrase: rainPhrase(window) },
    { factor: 'wind', penalty: averagePenalty(window, 'wind'), phrase: windPhrase(window) },
  ];

  const maxUv = Math.max(...window.hours.map((s) => s.breakdown.inputs.uvIndex));
  if (maxUv >= HIGH_UV_THRESHOLD) {
    candidates.push({
      factor: 'uv',
      penalty: averagePenalty(window, 'uv'),
      phrase: 'protetor solar recomendado',
    });
  }

  return candidates.sort((a, b) => b.penalty - a.penalty);
}

/** Frase explicativa por regras: no máximo 3 fatores, por influência no score. */
function buildReasons(window: WindowCandidate, profile: ScoringProfile): string[] {
  return reasonCandidates(window, profile)
    .slice(0, MAX_REASONS)
    .map((candidate) => candidate.phrase);
}

/** Motivo dominante da janela (maior penalidade média) para o caveat. */
function dominantReason(window: WindowCandidate, profile: ScoringProfile): string {
  return reasonCandidates(window, profile)[0].phrase;
}

function averagePenalty(window: WindowCandidate, factor: Factor): number {
  return (
    window.hours.reduce((sum, s) => sum + s.breakdown.penalties[factor], 0) /
    window.hours.length
  );
}

function averageInput(
  window: WindowCandidate,
  pick: (inputs: ComfortInputs) => number,
): number {
  return (
    window.hours.reduce((sum, s) => sum + pick(s.breakdown.inputs), 0) / window.hours.length
  );
}

/** "Agradável" é relativo ao perfil: a faixa ideal da atividade. */
function tempPhrase(window: WindowCandidate, profile: ScoringProfile): string {
  const [idealMin, idealMax] = profile.idealTempRange;
  const avg = Math.round(averageInput(window, (inputs) => inputs.apparentTemp));
  if (avg > idealMax) return `calor de ${avg} °C`;
  if (avg < idealMin) return `frio de ${avg} °C`;
  return `temperatura agradável (${avg} °C)`;
}

function rainPhrase(window: WindowCandidate): string {
  const avg = Math.round(averageInput(window, (inputs) => inputs.precipitationProb));
  if (avg < 20) return 'baixa chance de chuva';
  if (avg <= 50) return 'pode chuviscar, leve um guarda-chuva';
  return `chuva provável (${avg}%)`;
}

function windPhrase(window: WindowCandidate): string {
  const avg = Math.round(averageInput(window, (inputs) => inputs.windSpeed));
  if (avg <= 15) return 'vento leve';
  if (avg <= 30) return 'vento moderado';
  return `vento forte (${avg} km/h)`;
}
