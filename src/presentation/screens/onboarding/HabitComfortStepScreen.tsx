import { useRouter } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';

import type { ThermalPreset } from '@/domain/entities/preferences';
import { Button } from '@/presentation/components/Button';
import { ComfortFieldsForm } from '@/presentation/components/ComfortFieldsForm';
import { StepHeader } from '@/presentation/components/StepHeader';
import { ThermalPresetPicker } from '@/presentation/components/ThermalPresetPicker';
import { customFromPreset, EMPTY_COMFORT_DRAFT } from '@/presentation/hooks/comfortDraft';
import { useOnboarding, validateDraft } from '@/presentation/hooks/useOnboarding';
import { useSaveHabit } from '@/presentation/hooks/useSaveHabit';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from './OnboardingShell';

/**
 * Última etapa do mini-fluxo (§5): conforto próprio do hábito, opcional. Usa os
 * mesmos cards e campos de `/preferences`; aqui tudo cabe numa tela só, porque
 * é uma pergunta a mais dentro de um fluxo curto.
 */
export function HabitComfortStepScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const draft = useOnboarding((state) => state.draft);
  const updateDraft = useOnboarding((state) => state.updateDraft);
  const saveHabit = useSaveHabit();

  const comfort = draft.comfort;
  const comfortError = validateDraft(draft).find((error) => error.field === 'comfort');

  function toggleCustom(enabled: boolean) {
    updateDraft({ comfort: enabled ? EMPTY_COMFORT_DRAFT : null });
  }

  function selectPreset(preset: ThermalPreset) {
    updateDraft({ comfort: { ...(comfort ?? EMPTY_COMFORT_DRAFT), kind: 'preset', preset } });
  }

  return (
    <OnboardingShell
      header={<StepHeader step={4} total={4} onBack={() => router.back()} />}
      footer={
        <Button
          disabled={comfortError !== undefined}
          label={strings.onboarding.save}
          onPress={() => void saveHabit()}
        />
      }
    >
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
          {strings.onboarding.comfortTitle}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {strings.onboarding.comfortHint}
        </Text>
      </View>

      <View style={[styles.toggleRow, { gap: spacing.md }]}>
        <Text style={[typography.body, styles.toggleLabel, { color: colors.textPrimary }]}>
          {comfort ? strings.onboarding.comfortCustomize : strings.onboarding.comfortInherit}
        </Text>
        <Switch
          accessibilityLabel={strings.onboarding.comfortCustomize}
          onValueChange={toggleCustom}
          thumbColor={colors.surface}
          trackColor={{ false: colors.surfaceBorder, true: colors.accent }}
          value={comfort !== null}
        />
      </View>

      {comfort ? (
        <>
          <ThermalPresetPicker
            onCustom={() => updateDraft({ comfort: customFromPreset(comfort) })}
            onSelectPreset={selectPreset}
            value={comfort}
          />
          {comfort.kind === 'custom' ? (
            <ComfortFieldsForm
              fields={['temperature', 'humidity', 'wind']}
              onChange={(patch) => updateDraft({ comfort: { ...comfort, ...patch } })}
              tempError={comfortError?.message}
              value={comfort}
            />
          ) : null}
        </>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  toggleLabel: {
    flex: 1,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
