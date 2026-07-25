import { useEffect } from 'react';

import { DEFAULT_USER_PREFERENCES } from '@/domain/entities/preferences';
import { usePreferences } from '@/presentation/hooks/usePreferences';
import { usePreferencesForm } from '@/presentation/hooks/usePreferencesForm';

import { ThermalStepScreen } from './ThermalStepScreen';

/**
 * Entrada do fluxo avulso (⚙️ da home): carrega o perfil salvo no formulário
 * antes da primeira etapa, para a pessoa ver o que já escolheu.
 */
export function PreferencesEntryScreen() {
  const { preferences } = usePreferences();
  const hydrate = usePreferencesForm((state) => state.hydrate);

  useEffect(() => {
    if (preferences) hydrate(preferences.preferences ?? DEFAULT_USER_PREFERENCES);
  }, [preferences, hydrate]);

  return <ThermalStepScreen standalone />;
}
