import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Habit } from '@/domain/entities/habit';
import { Button } from '@/presentation/components/Button';
import { Chip } from '@/presentation/components/Chip';
import { StepHeader } from '@/presentation/components/StepHeader';
import { useOnboarding } from '@/presentation/hooks/useOnboarding';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { habitScheduleSummary } from './habitSummary';
import { OnboardingShell } from './OnboardingShell';
import { PRESET_HABITS } from './presets';

export function HabitsStepScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius } = useTheme();
  const habits = useOnboarding((state) => state.habits);
  const startDraft = useOnboarding((state) => state.startDraft);
  const editHabit = useOnboarding((state) => state.editHabit);
  const removeHabit = useOnboarding((state) => state.removeHabit);

  function addFromPreset(prefill: (typeof PRESET_HABITS)[number]['prefill']) {
    startDraft(prefill);
    router.push('/onboarding/habit/name');
  }

  return (
    <OnboardingShell
      header={<StepHeader step={2} total={3} onBack={() => router.back()} />}
      footer={
        <Button label={strings.onboarding.next} onPress={() => router.push('/onboarding/review')} />
      }
    >
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
          {strings.onboarding.habitsTitle}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {strings.onboarding.habitsHint}
        </Text>
      </View>

      <View style={[styles.chips, { gap: spacing.sm }]}>
        {PRESET_HABITS.map((preset) => (
          <Chip
            key={preset.label}
            label={preset.label}
            onPress={() => addFromPreset(preset.prefill)}
          />
        ))}
      </View>

      {habits.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}>
            {strings.onboarding.habitCount(habits.length)}
          </Text>
          {habits.map((habit: Habit) => (
            <View
              key={habit.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                  borderRadius: radius.md,
                  gap: spacing.xs,
                  padding: spacing.lg,
                },
              ]}
            >
              <Text style={[typography.heading, { color: colors.textPrimary }]}>{habit.name}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {habitScheduleSummary(habit)}
              </Text>
              <View style={[styles.cardActions, { gap: spacing.lg }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${strings.onboarding.edit} ${habit.name}`}
                  onPress={() => {
                    editHabit(habit.id);
                    router.push('/onboarding/habit/name');
                  }}
                  style={styles.cardAction}
                >
                  <Text style={[typography.label, { color: colors.accent }]}>
                    {strings.onboarding.edit}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${strings.onboarding.remove} ${habit.name}`}
                  onPress={() => removeHabit(habit.id)}
                  style={styles.cardAction}
                >
                  <Text style={[typography.label, { color: colors.danger }]}>
                    {strings.onboarding.remove}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <Button
        label={strings.onboarding.addHabit}
        onPress={() => {
          startDraft();
          router.push('/onboarding/habit/name');
        }}
        variant="ghost"
      />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  cardAction: {
    justifyContent: 'center',
    minHeight: 32,
  },
  cardActions: {
    flexDirection: 'row',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
