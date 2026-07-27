import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import type { ThermalPreset } from '@/domain/entities/preferences';
import { Button } from '@/presentation/components/Button';
import { StepHeader } from '@/presentation/components/StepHeader';
import { ThermalPresetPicker } from '@/presentation/components/ThermalPresetPicker';
import { usePreferencesForm } from '@/presentation/hooks/usePreferencesForm';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from '../onboarding/OnboardingShell';
import { preferencesFlow } from './flow';

type ThermalStepScreenProps = {
  /** Fora do onboarding (⚙️ da home): contagem e destinos próprios. */
  standalone?: boolean;
};

/**
 * Etapa 1 (§8.1): sensibilidade térmica em linguagem natural. Escolher um card
 * segue direto para a rotina de sono; quem quer números vai pelas sub-etapas.
 */
export function ThermalStepScreen({ standalone = false }: ThermalStepScreenProps) {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const flow = preferencesFlow(standalone);
  const draft = usePreferencesForm((state) => state.draft);
  const selectPreset = usePreferencesForm((state) => state.selectPreset);
  const startCustom = usePreferencesForm((state) => state.startCustom);

  function choosePreset(preset: ThermalPreset) {
    selectPreset(preset);
    router.push(flow.sleep);
  }

  return (
    <OnboardingShell
      header={
        <StepHeader
          onBack={() => router.back()}
          step={flow.steps.thermal}
          total={flow.steps.total}
        />
      }
      footer={
        draft.kind === 'custom' ? (
          <Button
            label={strings.onboarding.next}
            onPress={() => router.push(flow.temperature)}
          />
        ) : undefined
      }
    >
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
          {strings.preferences.thermalTitle}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {strings.preferences.thermalHint}
        </Text>
      </View>

      <ThermalPresetPicker
        onCustom={() => {
          startCustom();
          router.push(flow.temperature);
        }}
        onSelectPreset={choosePreset}
        value={draft}
      />
    </OnboardingShell>
  );
}
