/** Categoria do hábito — define defaults de intensidade e local (§3). */
export type HabitCategory = 'pet' | 'exercicio' | 'estudo' | 'trabalho' | 'lazer' | 'outro';

/** Dia da semana; 0 = domingo (convenção do JS Date). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type HabitIntensity = 'leve' | 'moderada' | 'intensa';

/** Hábito com horário fixo (trabalho, faculdade): o app sugere vestimenta. */
export type FixedSchedule = {
  kind: 'fixed';
  /** "HH:mm" no relógio local da cidade padrão. */
  startTime: string;
  /** "HH:mm"; se cruzar meia-noite, tratar fim como 23:59 no MVP. */
  endTime: string;
};

/** Hábito com horário livre (passeio, caminhada): o app sugere a melhor janela. */
export type FlexibleSchedule = {
  kind: 'flexible';
  durationMinutes: 30 | 60 | 90 | 120;
  /** Restrição opcional: não começar antes de ("HH:mm"). */
  earliest?: string;
  /** Restrição opcional: terminar até ("HH:mm"). */
  latest?: string;
};

export type HabitSchedule = FixedSchedule | FlexibleSchedule;

export type Habit = {
  /** Gerado localmente na criação (sem lib). */
  id: string;
  /** Ex.: "Passear com o Thor". */
  name: string;
  category: HabitCategory;
  /** Pré-preenchida pela categoria, editável. */
  intensity: HabitIntensity;
  /** false (ex.: academia indoor) → a vestimenta vale para o deslocamento. */
  outdoor: boolean;
  /** Não vazio. */
  days: Weekday[];
  schedule: HabitSchedule;
  enabled: boolean;
  /** ISO 8601. */
  createdAt: string;
};

/**
 * Defaults por categoria (§3) — menos atrito no onboarding: a pessoa só
 * ajusta se quiser. `lazer` e `outro` não são definidos pelo spec; assumem
 * leve/outdoor (o caso mais comum de atividade com clima relevante).
 */
export const HABIT_CATEGORY_DEFAULTS: Record<
  HabitCategory,
  { intensity: HabitIntensity; outdoor: boolean }
> = {
  pet: { intensity: 'leve', outdoor: true },
  exercicio: { intensity: 'moderada', outdoor: true },
  estudo: { intensity: 'leve', outdoor: false },
  trabalho: { intensity: 'leve', outdoor: false },
  lazer: { intensity: 'leve', outdoor: true },
  outro: { intensity: 'leve', outdoor: true },
};
