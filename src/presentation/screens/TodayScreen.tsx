import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraStrip } from '@/presentation/components/AuroraStrip';
import { Button } from '@/presentation/components/Button';
import { EmptyState } from '@/presentation/components/EmptyState';
import { ErrorState } from '@/presentation/components/ErrorState';
import { HabitCard } from '@/presentation/components/HabitCard';
import { Skeleton } from '@/presentation/components/Skeleton';
import { formatLocalDate } from '@/presentation/format/format';
import { useTodaySuggestions } from '@/presentation/hooks/useTodaySuggestions';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

type TodayScreenProps = {
  /** Injetável nos testes para "agora" determinístico. */
  nowOverride?: Date;
};

/** Painel "Hoje" (§8.2): cada hábito do dia com sua sugestão. */
export function TodayScreen({ nowOverride }: TodayScreenProps) {
  const router = useRouter();
  const { colors, spacing, typography, minTouchTarget } = useTheme();
  const vm = useTodaySuggestions(nowOverride ? { now: nowOverride } : {});

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { gap: spacing.lg, padding: spacing.xl }]}
        refreshControl={
          vm.status === 'ready' ? (
            <RefreshControl
              onRefresh={vm.refresh}
              refreshing={vm.isRefreshing}
              tintColor={colors.accent}
            />
          ) : undefined
        }
      >
        <View style={[styles.header, { gap: spacing.xs }]}>
          <View style={styles.headerText}>
            <Text
              accessibilityRole="header"
              style={[typography.title, { color: colors.textPrimary }]}
            >
              {vm.status === 'no-city' || vm.status === 'loading'
                ? strings.home.title
                : vm.city.name}
            </Text>
            {vm.status === 'ready' ? (
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {formatLocalDate(vm.now)}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.today.changeCity}
            onPress={() => router.push('/city-picker')}
            style={[styles.changeCity, { minHeight: minTouchTarget }]}
          >
            <Text style={[typography.label, { color: colors.accent }]}>
              {strings.today.changeCity}
            </Text>
          </Pressable>
        </View>
        <AuroraStrip />

        {vm.status === 'loading' && (
          <View
            accessible
            accessibilityLabel={strings.recommendation.loadingForecast}
            accessibilityLiveRegion="polite"
            style={{ gap: spacing.lg }}
          >
            <Skeleton height={140} />
            <Skeleton height={140} />
            <Skeleton height={140} />
          </View>
        )}

        {vm.status === 'no-city' && (
          <View style={{ gap: spacing.lg }}>
            <EmptyState
              emoji="🧭"
              title={strings.today.noCityTitle}
              hint={strings.today.noCityHint}
            />
            <Button
              label={strings.today.noCityCta}
              onPress={() => router.push('/city-picker')}
            />
          </View>
        )}

        {vm.status === 'error' && <ErrorState message={vm.errorMessage} onRetry={vm.retry} />}

        {vm.status === 'empty' && (
          <View style={{ gap: spacing.lg }}>
            <EmptyState
              emoji="🌱"
              title={strings.today.emptyTitle}
              hint={strings.today.emptyHint}
            />
            <Button
              label={strings.today.emptyCta}
              onPress={() => router.push('/onboarding/habits')}
            />
            <Button
              label={strings.today.searchLink}
              onPress={() => router.push('/search')}
              variant="ghost"
            />
          </View>
        )}

        {vm.status === 'ready' && (
          <>
            {vm.suggestions.map((suggestion) => (
              <HabitCard
                key={`${suggestion.habit.id}-${suggestion.kind}`}
                now={vm.now}
                suggestion={suggestion}
                todayHours={vm.todayHours}
              />
            ))}
            <Button
              label={strings.today.searchLink}
              onPress={() => router.push('/search')}
              variant="ghost"
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  changeCity: {
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  safeArea: {
    flex: 1,
  },
});
