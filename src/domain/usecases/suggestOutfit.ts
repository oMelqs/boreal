import type { Accessory, ClothingSuggestion, OutfitLevel } from '../entities/clothing';
import type { HabitIntensity } from '../entities/habit';
import type { HourlyForecast } from '../entities/hourlyForecast';

export type SuggestOutfitInput = {
  /** Condições na hora de início (ida). */
  atStart: HourlyForecast;
  /** Condições na hora de fim (volta), quando o forecast cobre. */
  atEnd?: HourlyForecast;
  intensity: HabitIntensity;
  /** false → a sugestão vale para o deslocamento (§5.1). */
  outdoor: boolean;
  /**
   * Sensibilidade térmica pessoal (§4 das preferências): somado à sensação só
   * na escolha do nível de agasalho — friorento (−3) veste como se fizesse
   * 3 °C a menos. Frases e demais regras seguem nas temperaturas reais.
   */
  tempOffset?: number;
};

/** Escala do mais quente ao mais leve; "subir uma faixa" = vestir mais leve. */
const OUTFIT_LADDER: OutfitLevel[] = [
  'casaco-pesado',
  'casaco',
  'camada-leve',
  'leve',
  'bem-leve',
];

/** Ordem canônica de exibição dos acessórios. */
const ACCESSORY_ORDER: Accessory[] = [
  'capa-de-chuva',
  'guarda-chuva',
  'corta-vento',
  'protetor-solar',
  'bone',
  'agua',
];

/** Chuva relevante numa ponta: prob ≥ 50% ou precipitação efetiva > 0,5 mm. */
const RAIN_PROB_THRESHOLD = 50;
const RAIN_MM_THRESHOLD = 0.5;
/** Ressalva de chuvisco: prob entre 20 e 49. */
const DRIZZLE_PROB_THRESHOLD = 20;
/** Vento que inviabiliza guarda-chuva e pede corta-vento (com frio). */
const STRONG_WIND_KMH = 25;
const WINDBREAKER_MAX_TEMP = 20;
const SUNSCREEN_UV = 6;
const CAP_UV = 8;
const WATER_TEMP = 28;
/** Mudança ida×volta relevante para a frase (§5.3). */
const CHANGE_DELTA_C = 5;

/** Tabela §5.1: nível base pela sensação térmica (fronteiras na faixa de cima). */
function baseLevelIndex(apparentTemp: number): number {
  if (apparentTemp < 10) return 0; // casaco-pesado
  if (apparentTemp < 15) return 1; // casaco
  if (apparentTemp < 20) return 2; // camada-leve
  if (apparentTemp < 26) return 3; // leve
  return 4; // bem-leve
}

/**
 * Ajuste por intensidade (§5.1): intensa sempre sobe uma faixa (o corpo
 * esquenta); moderada só abaixo de 15 °C. Indoor não ajusta — a sugestão é
 * para o deslocamento, não para o esforço. O `tempOffset` pessoal desloca a
 * sensação usada na tabela (e na regra da moderada, que é sobre sentir frio).
 */
function levelFor(
  apparentTemp: number,
  intensity: HabitIntensity,
  outdoor: boolean,
  tempOffset: number,
): OutfitLevel {
  const feltTemp = apparentTemp + tempOffset;
  let index = baseLevelIndex(feltTemp);
  if (outdoor) {
    if (intensity === 'intensa') index += 1;
    if (intensity === 'moderada' && feltTemp < 15) index += 1;
  }
  return OUTFIT_LADDER[Math.min(index, OUTFIT_LADDER.length - 1)];
}

function rainsAt(hour: HourlyForecast): boolean {
  return (
    (hour.precipitationProb ?? 0) >= RAIN_PROB_THRESHOLD ||
    (hour.precipitationMm ?? 0) > RAIN_MM_THRESHOLD
  );
}

/** Peça correspondente ao nível, para uso nas frases. */
function outfitItem(level: OutfitLevel): string {
  switch (level) {
    case 'casaco-pesado':
      return 'um casaco pesado';
    case 'casaco':
      return 'um casaco';
    case 'camada-leve':
      return 'uma jaqueta leve';
    case 'leve':
      return 'roupa leve';
    case 'bem-leve':
      return 'roupa bem leve';
  }
}

type AccessoryFlags = {
  accessories: Accessory[];
  usesCape: boolean;
};

/**
 * Acessórios (§5.2): regras aditivas avaliadas na ida E na volta. Condição
 * satisfeita em qualquer ponta aplica; capa substitui guarda-chuva quando a
 * MESMA ponta tem chuva e vento > 25 km/h. Campo null = sem informação = não
 * dispara a regra.
 */
function collectAccessories(input: SuggestOutfitInput): AccessoryFlags {
  const endpoints = [input.atStart, ...(input.atEnd ? [input.atEnd] : [])];
  const found = new Set<Accessory>();

  const rainAnywhere = endpoints.some(rainsAt);
  const capeNeeded = endpoints.some(
    (hour) => rainsAt(hour) && (hour.windSpeed ?? 0) > STRONG_WIND_KMH,
  );
  if (rainAnywhere) found.add(capeNeeded ? 'capa-de-chuva' : 'guarda-chuva');

  if (
    endpoints.some(
      (hour) =>
        (hour.windSpeed ?? 0) > STRONG_WIND_KMH &&
        hour.apparentTemp !== null &&
        hour.apparentTemp < WINDBREAKER_MAX_TEMP,
    )
  ) {
    found.add('corta-vento');
  }

  if (input.outdoor) {
    const daytimeUv = (threshold: number) =>
      endpoints.some((hour) => hour.isDay && (hour.uvIndex ?? 0) >= threshold);
    if (daytimeUv(SUNSCREEN_UV)) found.add('protetor-solar');
    if (daytimeUv(CAP_UV)) found.add('bone');
  }

  if (
    input.intensity !== 'leve' &&
    endpoints.some((hour) => hour.apparentTemp !== null && hour.apparentTemp >= WATER_TEMP)
  ) {
    found.add('agua');
  }

  return {
    accessories: ACCESSORY_ORDER.filter((accessory) => found.has(accessory)),
    usesCape: found.has('capa-de-chuva'),
  };
}

/**
 * Frase §5.3: fragmentos por prioridade — (1) mudança ida×volta, (2) chuva,
 * (3) agasalho — montados em 1–2 sentenças com no máximo 3 fatores. Mudança
 * de temperatura já recomenda a peça pela volta, então suprime o fator de
 * agasalho; chuva-só-na-volta suprime o fator de chuva simples.
 */
function buildSummary(
  input: SuggestOutfitInput,
  startTemp: number,
  outfit: OutfitLevel,
  usesCape: boolean,
): string {
  const { atStart, atEnd, intensity, outdoor } = input;
  const tempOffset = input.tempOffset ?? 0;
  const endTemp = atEnd?.apparentTemp ?? null;
  const rainItem = usesCape ? 'leve capa de chuva' : 'leve guarda-chuva';

  const fragments: string[] = [];
  let temperatureCovered = false;
  let rainCovered = false;

  // (1) mudança ida × volta
  if (endTemp !== null && Math.abs(endTemp - startTemp) >= CHANGE_DELTA_C) {
    const from = Math.round(startTemp);
    const to = Math.round(endTemp);
    if (endTemp < startTemp) {
      const returnItem = outfitItem(levelFor(endTemp, intensity, outdoor, tempOffset));
      const framing = startTemp >= 20 ? 'mesmo saindo no calor' : 'para a volta';
      fragments.push(`vai esfriar até a volta (${from} °C → ${to} °C): leve ${returnItem} ${framing}`);
    } else {
      fragments.push(
        `sai fresco mas esquenta depois (${from} °C → ${to} °C): prefira camadas que dê para tirar`,
      );
    }
    temperatureCovered = true;
  }

  // (2) chuva — assimetria ida/volta tem prioridade sobre chuva simples
  if (atEnd && !rainsAt(atStart) && rainsAt(atEnd)) {
    const prob = Math.round(atEnd.precipitationProb ?? 0);
    fragments.push(`sem chuva na ida, mas ${prob}% de chance na volta — ${rainItem}`);
    rainCovered = true;
  } else if (rainsAt(atStart)) {
    const prob = Math.round(atStart.precipitationProb ?? 0);
    fragments.push(`chuva no caminho (${prob}%) — ${rainItem}`);
    rainCovered = true;
  }

  // (3) agasalho — suprimido quando a mudança já recomendou a peça
  if (!temperatureCovered) {
    const temp = Math.round(startTemp);
    const base = `${outfitItem(outfit)}: sensação de ${temp} °C`;
    fragments.push(outdoor ? base : `${base} para o caminho até lá`);
  }

  // ressalva de chuvisco (20–49%), só quando chuva não virou fator
  if (!rainCovered) {
    const maxProb = Math.max(
      atStart.precipitationProb ?? 0,
      atEnd?.precipitationProb ?? 0,
    );
    if (maxProb >= DRIZZLE_PROB_THRESHOLD && maxProb < RAIN_PROB_THRESHOLD) {
      fragments.push(`pode chuviscar (${Math.round(maxProb)}%)`);
    }
  }

  const top = fragments.slice(0, 3);
  const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  const first = `${capitalize(top[0])}.`;
  if (top.length === 1) return first;
  return `${first} ${capitalize(top.slice(1).join('; '))}.`;
}

/**
 * Motor de vestimenta (§5): dado o clima na ida (e na volta, quando o
 * forecast cobre), a intensidade e o local do hábito, devolve o nível de
 * agasalho, acessórios e a frase pronta em pt-BR.
 *
 * Retorna `null` quando a sensação térmica da ida está indisponível — sem
 * base para sugerir (o orquestrador decide o que exibir).
 */
export function suggestOutfit(input: SuggestOutfitInput): ClothingSuggestion | null {
  const startTemp = input.atStart.apparentTemp;
  if (startTemp === null) return null;

  const outfit = levelFor(startTemp, input.intensity, input.outdoor, input.tempOffset ?? 0);
  const { accessories, usesCape } = collectAccessories(input);

  return {
    outfit,
    accessories,
    summary: buildSummary(input, startTemp, outfit, usesCape),
    atStart: input.atStart,
    ...(input.atEnd ? { atEnd: input.atEnd } : {}),
  };
}
