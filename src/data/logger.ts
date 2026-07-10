/**
 * Logger mínimo do app (CLAUDE.md: sem console.log solto em código final).
 * Só fala em desenvolvimento; em produção é silencioso — os avisos daqui são
 * diagnósticos (ex.: registro corrompido descartado do storage), nunca fluxo.
 */
export const logger = {
  warn(message: string, detail?: unknown): void {
    if (__DEV__) {
      if (detail !== undefined) {
        console.warn(`[boreal] ${message}`, detail);
      } else {
        console.warn(`[boreal] ${message}`);
      }
    }
  },
};
