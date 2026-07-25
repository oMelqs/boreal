import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useContainer } from '@/di/ContainerProvider';
import { DEFAULT_USER_PREFERENCES } from '@/domain/entities/preferences';
import { Button } from '@/presentation/components/Button';
import { StepHeader } from '@/presentation/components/StepHeader';
import { useOnboarding } from '@/presentation/hooks/useOnboarding';
import { usePreferences } from '@/presentation/hooks/usePreferences';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { habitScheduleSummary } from './habitSummary';
import { OnboardingShell } from './OnboardingShell';

export function ReviewScreen() {
  const router = useRouter();
  const container = useContainer();
  const queryClient = useQueryClient();
  const { colors, typography, spacing, radius } = useTheme();
  const { habits, city, editHabit, removeHabit, reset } = useOnboarding();
  const { preferences, savePreferences } = usePreferences();
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    try {
      for (const habit of habits) {
        await container.saveHabit(habit);
      }
      await savePreferences({
        defaultCity: city ?? preferences?.defaultCity ?? null,
        onboardingDone: true,
        preferences: preferences?.preferences ?? DEFAULT_USER_PREFERENCES,
      });
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
      reset();
      router.replace('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingShell
      header={<StepHeader step={3} total={3} onBack={() => router.back()} />}
      footer={<Button disabled={saving} label={strings.onboarding.finish} onPress={finish} />}
    >
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
          {strings.onboarding.reviewTitle}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {habits.length > 0 ? strings.onboarding.reviewHint : strings.onboarding.reviewEmpty}
        </Text>
      </View>

      {habits.map((habit) => (
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
          <View style={[styles.actions, { gap: spacing.lg }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${strings.onboarding.edit} ${habit.name}`}
              onPress={() => {
                editHabit(habit.id);
                router.push('/onboarding/habit/name');
              }}
              style={styles.action}
            >
              <Text style={[typography.label, { color: colors.accent }]}>
                {strings.onboarding.edit}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${strings.onboarding.remove} ${habit.name}`}
              onPress={() => removeHabit(habit.id)}
              style={styles.action}
            >
              <Text style={[typography.label, { color: colors.danger }]}>
                {strings.onboarding.remove}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  action: {
    justifyContent: 'center',
    minHeight: 32,
  },
  actions: {
    flexDirection: 'row',
  },
  card: {
    borderWidth: 1,
  },
});
