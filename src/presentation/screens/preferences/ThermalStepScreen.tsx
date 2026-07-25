import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThermalPreset } from '@/domain/entities/preferences';
import { Button } from '@/presentation/components/Button';
import { StepHeader } from '@/presentation/components/StepHeader';
import { ThermalPresetCard } from '@/presentation/components/ThermalPresetCard';
import { usePreferencesForm } from '@/presentation/hooks/usePreferencesForm';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from '../onboarding/OnboardingShell';
import { preferencesFlow } from './flow';

const PRESETS: ThermalPreset[] = ['friorento', 'equilibrado', 'calorento'];

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
  const { colors, typography, spacing, minTouchTarget } = useTheme();
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

      <View style={{ gap: spacing.md }}>
        {PRESETS.map((preset) => (
          <ThermalPresetCard
            key={preset}
            onPress={() => choosePreset(preset)}
            preset={preset}
            selected={draft.kind === 'preset' && draft.preset === preset}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.preferences.customLink}
        onPress={() => {
          startCustom();
          router.push(flow.temperature);
        }}
        style={[styles.link, { minHeight: minTouchTarget }]}
      >
        <Text style={[typography.label, { color: colors.accent }]}>
          {strings.preferences.customLink}
        </Text>
      </Pressable>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  link: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
