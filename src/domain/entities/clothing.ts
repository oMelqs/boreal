import type { Habit } from './habit';
import type { HourlyForecast } from './hourlyForecast';
import type { Recommendation } from './recommendation';

/** Nível de agasalho, do mais quente ao mais leve (tabela §5.1). */
export type OutfitLevel = 'casaco-pesado' | 'casaco' | 'camada-leve' | 'leve' | 'bem-leve';

export type Accessory =
  | 'guarda-chuva'
  | 'capa-de-chuva'
  | 'corta-vento'
  | 'bone'
  | 'protetor-solar'
  | 'agua';

/** Sugestão de vestimenta para um hábito de horário fixo. */
export type ClothingSuggestion = {
  outfit: OutfitLevel;
  accessories: Accessory[];
  /** Frase pronta em pt-BR (1–2 sentenças, §5.3). */
  summary: string;
  /** Condições na ida. */
  atStart: HourlyForecast;
  /** Condições na volta, quando o forecast cobre a hora de fim. */
  atEnd?: HourlyForecast;
};

/** Item do painel "Hoje": cada hábito do dia com sua sugestão. */
export type HabitSuggestion =
  | { habit: Habit; kind: 'clothing'; when: 'hoje' | 'amanha'; suggestion: ClothingSuggestion }
  | { habit: Habit; kind: 'window'; when: 'hoje' | 'amanha'; recommendation: Recommendation }
  | { habit: Habit; kind: 'no-slot'; when: 'hoje'; reason: string }
  /** Só o lembrete do horário: o hábito dispensou a sugestão de roupa. */
  | { habit: Habit; kind: 'info'; when: 'hoje' | 'amanha' };
