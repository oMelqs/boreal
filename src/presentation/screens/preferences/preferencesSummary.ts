import type { ComfortPreferences, UserPreferences } from '@/domain/entities/preferences';
import { resolveComfortProfile } from '@/domain/usecases/resolveComfortProfile';
import { strings } from '@/presentation/i18n/strings';

/** "Calorento · 15–23 °C" / "Personalizado · 24–30 °C". */
export function comfortSummary(preferences: UserPreferences): string {
  const [min, max] = resolveComfortProfile(preferences).idealTempRange;
  const name =
    preferences.comfort.kind === 'preset'
      ? strings.preferences.preset[preferences.comfort.preset].label
      : strings.preferences.customName;
  return strings.preferences.profileSummary(name, min, max);
}

/**
 * Versão curta para o selo de um hábito com conforto próprio: "Calorento" ou
 * "27–34 °C". Não passa por `resolveComfortProfile` — no modo manual a faixa já
 * está no próprio override, e num preset o que identifica é o nome.
 */
export function comfortShortLabel(comfort: ComfortPreferences): string {
  if (comfort.kind === 'preset') {
    return strings.preferences.preset[comfort.preset].label;
  }
  const [min, max] = comfort.idealTempRange;
  return strings.preferences.tempRangeShort(min, max);
}

/** "07:00 às 23:00" ou a nota de quem ficou só com luz do dia. */
export function sleepSummary(preferences: UserPreferences): string {
  const { sleep } = preferences;
  return sleep
    ? strings.preferences.awakeSummary(sleep.wakeTime, sleep.sleepTime)
    : strings.preferences.awakeDaylight;
}
