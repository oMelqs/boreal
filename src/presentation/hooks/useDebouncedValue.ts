import { useEffect, useState } from 'react';

/**
 * Propaga `value` somente após `delayMs` sem mudanças (busca dispara com
 * 400 ms de pausa na digitação — §4.1). `delayMs <= 0` propaga imediatamente.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), Math.max(delayMs, 0));
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  // Sem atraso não há o que debonçar: devolve o valor direto.
  return delayMs <= 0 ? value : debounced;
}
