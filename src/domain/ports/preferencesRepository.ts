import type { Preferences } from '../entities/preferences';

/**
 * Porta de preferências locais (cidade padrão, onboarding). `get` nunca
 * falha por dado corrompido: a implementação devolve o default.
 */
export interface PreferencesRepository {
  get(): Promise<Preferences>;
  save(preferences: Preferences): Promise<void>;
}
