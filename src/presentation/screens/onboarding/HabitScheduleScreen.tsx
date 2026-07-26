import { useRouter } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';

import type { FlexibleSchedule } from '@/domain/entities/habit';
import { Button } from '@/presentation/components/Button';
import { Chip } from '@/presentation/components/Chip';
import { StepHeader } from '@/presentation/components/StepHeader';
import { TimeField } from '@/presentation/components/TimeField';
import { useOnboarding, validateDraft } from '@/presentation/hooks/useOnboarding';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from './OnboardingShell';

const DURATIONS: FlexibleSchedule['durationMinutes'][] = [30, 60, 90, 120];

export function HabitScheduleScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const draft = useOnboarding((state) => state.draft);
  const updateDraft = useOnboarding((state) => state.updateDraft);

  const scheduleError = validateDraft(draft).find((error) => error.field === 'schedule');
  const fixed = draft.scheduleKind === 'fixed';
  const touched = fixed
    ? draft.startTime.length > 0 || draft.endTime.length > 0
    : draft.earliest.length > 0 || draft.latest.length > 0;
  const errorMessage = touched && scheduleError ? scheduleError.message : undefined;

  return (
    <OnboardingShell
      header={<StepHeader step={2} total={3} onBack={() => router.back()} />}
      footer={
        <Button
          disabled={scheduleError !== undefined}
          label={strings.onboarding.next}
          onPress={() => router.push('/onboarding/habit/days')}
        />
      }
    >
      <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
        {strings.onboarding.scheduleTitle}
      </Text>

      <View style={[styles.chips, { gap: spacing.sm }]}>
        <Chip
          label={strings.onboarding.scheduleFixed}
          onPress={() => updateDraft({ scheduleKind: 'fixed' })}
          selected={fixed}
        />
        <Chip
          label={strings.onboarding.scheduleFlexible}
          onPress={() => updateDraft({ scheduleKind: 'flexible' })}
          selected={!fixed}
        />
      </View>

      {fixed ? (
        <View style={{ gap: spacing.lg }}>
          <TimeField
            label={strings.onboarding.startTimeLabel}
            onChange={(startTime) => updateDraft({ startTime })}
            value={draft.startTime}
          />
          <TimeField
            error={errorMessage}
            label={strings.onboarding.endTimeLabel}
            onChange={(endTime) => updateDraft({ endTime })}
            value={draft.endTime}
          />
          {/* Só faz sentido no horário fixo: hábito livre recebe janela, não roupa. */}
          <View style={[styles.outfitRow, { gap: spacing.md }]}>
            <View style={styles.outfitTexts}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>
                {strings.onboarding.outfitToggleLabel}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {strings.onboarding.outfitToggleHint}
              </Text>
            </View>
            <Switch
              accessibilityLabel={strings.onboarding.outfitToggleLabel}
              onValueChange={(suggestOutfit) => updateDraft({ suggestOutfit })}
              thumbColor={colors.surface}
              trackColor={{ false: colors.surfaceBorder, true: colors.accent }}
              value={draft.suggestOutfit}
            />
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.lg }}>
          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}>
              {strings.onboarding.durationLabel}
            </Text>
            <View style={[styles.chips, { gap: spacing.sm }]}>
              {DURATIONS.map((minutes) => (
                <Chip
                  key={minutes}
                  label={strings.onboarding.durationOption(minutes)}
                  onPress={() => updateDraft({ durationMinutes: minutes })}
                  selected={draft.durationMinutes === minutes}
                />
              ))}
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}>
              {strings.onboarding.boundsLabel}
            </Text>
            <View style={[styles.boundsRow, { gap: spacing.md }]}>
              <View style={styles.boundsField}>
                <TimeField
                  label={strings.onboarding.earliestLabel}
                  onChange={(earliest) => updateDraft({ earliest })}
                  value={draft.earliest}
                />
              </View>
              <View style={styles.boundsField}>
                <TimeField
                  error={errorMessage}
                  label={strings.onboarding.latestLabel}
                  onChange={(latest) => updateDraft({ latest })}
                  value={draft.latest}
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  boundsField: {
    flex: 1,
  },
  boundsRow: {
    flexDirection: 'row',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  outfitRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  outfitTexts: {
    flex: 1,
    gap: 2,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
