import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useContainer } from '@/di/ContainerProvider';
import { Button } from '@/presentation/components/Button';
import { ComfortBadge } from '@/presentation/components/ComfortBadge';
import { StepHeader } from '@/presentation/components/StepHeader';
import { useOnboarding } from '@/presentation/hooks/useOnboarding';
import { usePreferences } from '@/presentation/hooks/usePreferences';
import { draftToPreferences, usePreferencesForm } from '@/presentation/hooks/usePreferencesForm';
import { strings } from '@/presentation/i18n/strings';
import {
  comfortSummary,
  sleepSummary,
} from '@/presentation/screens/preferences/preferencesSummary';
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
  const draft = usePreferencesForm((state) => state.draft);
  const resetForm = usePreferencesForm((state) => state.reset);
  const [saving, setSaving] = useState(false);

  const comfortProfile = draftToPreferences(draft);

  async function finish() {
    setSaving(true);
    try {
      for (const habit of habits) {
        await container.saveHabit(habit);
      }
      await savePreferences({
        defaultCity: city ?? preferences?.defaultCity ?? null,
        onboardingDone: true,
        preferences: comfortProfile,
      });
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
      reset();
      resetForm();
      router.replace('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingShell
      header={<StepHeader step={5} total={5} onBack={() => router.back()} />}
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

      <View style={[styles.summaryRow, { gap: spacing.md }]}>
        {[
          { label: strings.preferences.profileCardLabel, value: comfortSummary(comfortProfile) },
          { label: strings.preferences.awakeCardLabel, value: sleepSummary(comfortProfile) },
        ].map((item) => (
          <View
            key={item.label}
            style={[
              styles.card,
              styles.summaryCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
                borderRadius: radius.md,
                gap: 2,
                padding: spacing.lg,
              },
            ]}
          >
            <Text style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
            <Text style={[typography.body, { color: colors.textPrimary }]}>{item.value}</Text>
          </View>
        ))}
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
          {habit.comfortOverride ? (
            <ComfortBadge
              comfort={habit.comfortOverride}
              habitName={habit.name}
              onEdit={() => {
                editHabit(habit.id);
                router.push('/onboarding/habit/comfort');
              }}
            />
          ) : null}
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
  summaryCard: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
