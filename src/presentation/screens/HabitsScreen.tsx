import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Habit } from '@/domain/entities/habit';
import { Button } from '@/presentation/components/Button';
import { ComfortBadge } from '@/presentation/components/ComfortBadge';
import { EmptyState } from '@/presentation/components/EmptyState';
import { Skeleton } from '@/presentation/components/Skeleton';
import { useHabits } from '@/presentation/hooks/useHabits';
import { useOnboarding } from '@/presentation/hooks/useOnboarding';
import { strings } from '@/presentation/i18n/strings';
import { habitScheduleSummary } from '@/presentation/screens/onboarding/habitSummary';
import { useTheme } from '@/presentation/theme/useTheme';

function HabitRow({ habit }: { habit: Habit }) {
  const router = useRouter();
  const { colors, spacing, radius, typography } = useTheme();
  const { toggle, remove } = useHabits();
  const beginManage = useOnboarding((state) => state.beginManage);
  const [confirming, setConfirming] = useState(false);

  function edit() {
    beginManage(habit);
    router.push('/onboarding/habit/name');
  }

  /** Selo do conforto próprio: entra pelo mesmo mini-fluxo, na etapa 4/4. */
  function editComfort() {
    beginManage(habit);
    router.push('/onboarding/habit/comfort');
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          borderRadius: radius.md,
          gap: spacing.sm,
          opacity: habit.enabled ? 1 : 0.65,
          padding: spacing.lg,
        },
      ]}
    >
      <View style={[styles.row, { gap: spacing.md }]}>
        <View style={styles.texts}>
          <View style={[styles.nameRow, { gap: spacing.sm }]}>
            <Text style={[typography.heading, { color: colors.textPrimary }]}>{habit.name}</Text>
            {!habit.enabled ? (
              <Text style={[typography.label, { color: colors.textSecondary }]}>
                {strings.habits.disabledTag}
              </Text>
            ) : null}
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {habitScheduleSummary(habit)}
          </Text>
          {habit.comfortOverride ? (
            <ComfortBadge
              comfort={habit.comfortOverride}
              habitName={habit.name}
              onEdit={editComfort}
            />
          ) : null}
        </View>
        <Switch
          accessibilityLabel={strings.habits.toggleLabel(habit.name)}
          onValueChange={() => void toggle(habit)}
          thumbColor={colors.surface}
          trackColor={{ false: colors.surfaceBorder, true: colors.accent }}
          value={habit.enabled}
        />
      </View>

      {confirming ? (
        <View style={[styles.actions, { gap: spacing.lg }]}>
          <Text style={[typography.caption, { color: colors.textPrimary }]}>
            {strings.habits.confirmRemove}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.habits.confirmYes}
            onPress={() => void remove(habit.id)}
            style={styles.action}
          >
            <Text style={[typography.label, { color: colors.danger }]}>
              {strings.habits.confirmYes}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.habits.confirmNo}
            onPress={() => setConfirming(false)}
            style={styles.action}
          >
            <Text style={[typography.label, { color: colors.textSecondary }]}>
              {strings.habits.confirmNo}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.actions, { gap: spacing.lg }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.habits.editLabel(habit.name)}
            onPress={edit}
            style={styles.action}
          >
            <Text style={[typography.label, { color: colors.accent }]}>
              {strings.onboarding.edit}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.habits.removeLabel(habit.name)}
            onPress={() => setConfirming(true)}
            style={styles.action}
          >
            <Text style={[typography.label, { color: colors.danger }]}>
              {strings.onboarding.remove}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/** Gerenciar hábitos (§8.3): lista com switch, edição pelo mini-fluxo, exclusão. */
export function HabitsScreen() {
  const router = useRouter();
  const { colors, spacing, typography, minTouchTarget } = useTheme();
  const { habits, isLoading } = useHabits();
  const beginManage = useOnboarding((state) => state.beginManage);

  function addNew() {
    beginManage();
    router.push('/onboarding/habit/name');
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { gap: spacing.lg, padding: spacing.xl }]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.city.backLabel}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={[styles.back, { minHeight: minTouchTarget, minWidth: minTouchTarget }]}
          >
            <Text style={[typography.title, { color: colors.textPrimary }]}>‹</Text>
          </Pressable>
          <Text
            accessibilityRole="header"
            style={[typography.title, styles.title, { color: colors.textPrimary }]}
          >
            {strings.habits.title}
          </Text>
          <View style={{ width: minTouchTarget }} />
        </View>

        {isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={96} />
            <Skeleton height={96} />
          </View>
        ) : habits.length === 0 ? (
          <EmptyState emoji="🌱" hint={strings.habits.empty} />
        ) : (
          <View style={{ gap: spacing.md }}>
            {habits.map((habit) => (
              <HabitRow key={habit.id} habit={habit} />
            ))}
          </View>
        )}

        <Button label={strings.habits.add} onPress={addNew} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  action: {
    justifyContent: 'center',
    minHeight: 32,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  back: {
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  nameRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});
