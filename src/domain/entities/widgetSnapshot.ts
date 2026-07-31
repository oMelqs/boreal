import type { Accessory, OutfitLevel } from './clothing';
import type { ComfortScore } from './comfortScore';

/**
 * Versão do formato gravado para o widget. Sobe quando um campo muda de
 * significado — a leitura descarta o que não reconhece (§5.3 do SPECS-WIDGET).
 */
export const WIDGET_SCHEMA_VERSION = 1;

/**
 * Uma hora do painel do widget. `hour` é o relógio da cidade (0–23) no frame
 * fake-UTC: o widget não faz conta de fuso, só desenha o número.
 */
export type WidgetHour = {
  hour: number;
  temp: number;
  rainProb: number;
  weatherCode: number | null;
  /** Decide entre o ícone diurno e o noturno na hora de formatar. */
  isDay: boolean;
};

/**
 * O que o motor de vestimenta decidiu, sem rótulo de interface: o nível e os
 * acessórios viajam como código, e quem traduz para emoji e texto é a
 * presentation.
 */
export type WidgetOutfit = {
  level: OutfitLevel;
  accessories: Accessory[];
  /** Frase pronta do motor, em pt-BR. */
  summary: string;
};

/**
 * Horário do hábito, sem `Date`: horário fixo carrega as strings que a entity
 * `Habit` já guarda; janela recomendada carrega as horas cheias.
 */
export type WidgetTimeRange =
  | { kind: 'fixed'; startTime: string; endTime: string }
  | { kind: 'window'; startHour: number; endHour: number }
  | { kind: 'none' };

/**
 * Hábito do painel, achatado para o widget. União discriminada pelo mesmo
 * `kind` de `HabitSuggestion`, para o widget ter os mesmos casos da home.
 */
export type WidgetHabit = {
  id: string;
  name: string;
  when: 'hoje' | 'amanha';
  /** Tem conforto próprio (§9 do SPECS-HABIT-PREFERENCES) — selo 🎯. */
  ownComfort: boolean;
  timeRange: WidgetTimeRange;
} & (
  | { kind: 'clothing'; outfit: WidgetOutfit }
  /** `score` traz valor e rótulo: quem desenha o selo não reclassifica nada. */
  | { kind: 'window'; score: ComfortScore; reasons: string[]; caveat?: string }
  | { kind: 'info' }
  | { kind: 'no-slot'; reason: string }
);

/**
 * Tudo que o widget precisa saber, calculado pelo app (§4 do SPECS-WIDGET):
 * nenhum motor roda do lado nativo, e o payload é JSON puro — sem `Date`, sem
 * DTO e sem entity de forecast crua.
 */
export type WidgetSnapshot = {
  schemaVersion: number;
  /** ISO 8601 em UTC real (não o frame fake-UTC): base do cálculo de frescor. */
  generatedAt: string;
  cityName: string;
  /** Condição de agora — o que o widget pequeno mostra. */
  now: {
    temp: number;
    apparentTemp: number;
    weatherCode: number | null;
    isDay: boolean;
    /** `null` fora do ciclo acordado ou sem dado para a hora. */
    outfit: WidgetOutfit | null;
  };
  hours: WidgetHour[];
  /** Primeiro hábito da lista; `null` quando não há nenhum. */
  nextHabit: WidgetHabit | null;
  /** Todos os hábitos do painel — o widget configurável escolhe entre eles. */
  habits: WidgetHabit[];
};
