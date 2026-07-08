import { createContext, useContext, type ReactNode } from 'react';

import type { Container } from './container';

const ContainerContext = createContext<Container | null>(null);

/**
 * Entrega o composition root aos hooks da presentation. Testes envolvem a
 * árvore com um container fake — sem jest.mock de módulos profundos.
 */
export function ContainerProvider({
  container,
  children,
}: {
  container: Container;
  children: ReactNode;
}) {
  return <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>;
}

export function useContainer(): Container {
  const container = useContext(ContainerContext);
  if (!container) {
    throw new Error('useContainer deve ser usado dentro de um ContainerProvider');
  }
  return container;
}
