import type { ComfortScore } from './comfortScore';

/**
 * Resultado do motor de recomendação.
 *
 * - `window`: melhor janela contígua de 2–3h do restante do dia. `end` é
 *   exclusivo (início da última hora + 1h): a janela das horas 17:00 e 18:00
 *   é exibida como "17h–19h". `caveat` presente quando o score médio é baixo
 *   (< 40): traz o motivo dominante para enquadramento honesto na UI.
 * - `day-over`: não restam horas de dia elegíveis (já anoiteceu ou resta
 *   menos que a janela mínima de 2h).
 * - `no-data`: ainda havia horas de dia pela frente, mas todas sem dados
 *   utilizáveis da API — a UI deve tratar como erro, não como fim do dia.
 */
export type Recommendation =
  | {
      kind: 'window';
      start: Date;
      end: Date;
      averageScore: ComfortScore;
      reasons: string[];
      caveat?: string;
    }
  | { kind: 'day-over' }
  | { kind: 'no-data' };
