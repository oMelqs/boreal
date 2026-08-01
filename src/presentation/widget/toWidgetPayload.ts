import type {
  WidgetHabit,
  WidgetHour,
  WidgetSnapshot,
} from '@/domain/entities/widgetSnapshot';
import { formatReasonsSentence } from '@/presentation/format/format';
import { strings } from '@/presentation/i18n/strings';
import { weatherCodeDescription, weatherCodeIcon } from '@/presentation/weather/weatherCode';

/** Hora pronta para desenhar: "14h", "23°", "40%". */
export type WidgetHourPayload = {
  label: string;
  temp: string;
  icon: string;
  /** Vazio quando a chance é baixa demais para valer pixel. */
  rain: string;
};

/** Tudo que o widget desenha, já em texto — a última parada antes do nativo. */
export type WidgetPayload = {
  cityName: string;
  /** ISO do momento em que o snapshot foi gerado (frescor, §5.4). */
  generatedAt: string;
  temp: string;
  apparentTemp: string;
  icon: string;
  description: string;
  /** "👕" e "Roupa leve"; vazios fora do ciclo acordado ou sem dado. */
  outfitEmoji: string;
  outfitLabel: string;
  outfitSummary: string;
  accessories: string;
  hours: WidgetHourPayload[];
  /** Bloco do próximo hábito; `null` quando não há nenhum hoje. */
  habit: {
    name: string;
    time: string;
    detail: string;
    ownComfort: boolean;
    tomorrow: boolean;
  } | null;
};

/** Abaixo disso a chance de chuva não muda decisão nenhuma. */
const RAIN_THRESHOLD = 30;

function hourPayload(hour: WidgetHour): WidgetHourPayload {
  return {
    label: `${hour.hour}h`,
    temp: `${hour.temp}°`,
    icon: weatherCodeIcon(hour.weatherCode, hour.isDay),
    rain: hour.rainProb >= RAIN_THRESHOLD ? `${hour.rainProb}%` : '',
  };
}

function timeLabel(habit: WidgetHabit): string {
  const { timeRange } = habit;
  if (timeRange.kind === 'fixed') return `${timeRange.startTime}–${timeRange.endTime}`;
  if (timeRange.kind === 'window') return `${timeRange.startHour}h–${timeRange.endHour}h`;
  return '';
}

/** A frase do bloco: cada caso do painel tem a sua, já pronta no domínio. */
function detailOf(habit: WidgetHabit): string {
  switch (habit.kind) {
    case 'clothing':
      return habit.outfit.summary;
    case 'window':
      return formatReasonsSentence(habit.reasons);
    case 'no-slot':
      return habit.reason;
    case 'info':
      return '';
  }
}

function habitPayload(habit: WidgetHabit | null): WidgetPayload['habit'] {
  if (habit === null) return null;
  return {
    name: habit.name,
    time: timeLabel(habit),
    detail: detailOf(habit),
    ownComfort: habit.ownComfort,
    tomorrow: habit.when === 'amanha',
  };
}

/**
 * Traduz o snapshot semântico do domínio no texto que o widget desenha
 * (§5.2b do SPECS-WIDGET). É a única fronteira onde o payload ganha emoji,
 * rótulo e formato de hora — e ela reusa exatamente os mesmos helpers das
 * telas, para o widget e a home nunca falarem diferente da mesma coisa.
 */
export function toWidgetPayload(snapshot: WidgetSnapshot): WidgetPayload {
  const { now } = snapshot;
  const outfit = now.outfit;

  return {
    cityName: snapshot.cityName,
    generatedAt: snapshot.generatedAt,
    temp: `${now.temp}°`,
    apparentTemp: `${now.apparentTemp}°`,
    icon: weatherCodeIcon(now.weatherCode, now.isDay),
    description: weatherCodeDescription(now.weatherCode),
    outfitEmoji: outfit ? strings.outfit[outfit.level].emoji : '',
    outfitLabel: outfit ? strings.outfit[outfit.level].label : '',
    outfitSummary: outfit?.summary ?? '',
    accessories: outfit
      ? outfit.accessories.map((item) => strings.accessory[item].emoji).join(' ')
      : '',
    hours: snapshot.hours.map(hourPayload),
    habit: habitPayload(snapshot.nextHabit),
  };
}
