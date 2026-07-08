import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { City } from '@/domain/entities/city';
import { AuroraStrip } from '@/presentation/components/AuroraStrip';
import { ErrorState } from '@/presentation/components/ErrorState';
import { HourlyTimeline } from '@/presentation/components/HourlyTimeline';
import { RecommendationHero } from '@/presentation/components/RecommendationHero';
import { Skeleton } from '@/presentation/components/Skeleton';
import { WindowDetails } from '@/presentation/components/WindowDetails';
import { formatCityLocation } from '@/presentation/components/CityListItem';
import { useCityStore } from '@/presentation/hooks/useCityStore';
import { useRecommendation } from '@/presentation/hooks/useRecommendation';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

type CityScreenProps = {
  /** Injetável nos testes para "agora" determinístico. */
  nowOverride?: Date;
};

export function CityScreen({ nowOverride }: CityScreenProps) {
  const city = useCityStore((state) => state.selectedCity);

  if (!city) {
    return <MissingCity />;
  }
  return <CityContent city={city} nowOverride={nowOverride} />;
}

function MissingCity() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.missing, { gap: spacing.lg, padding: spacing.xl }]}>
        <Text style={[typography.body, styles.centered, { color: colors.textPrimary }]}>
          {strings.city.missingCity}
        </Text>
        <BackButton onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const { colors, spacing, typography, minTouchTarget } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={strings.city.backLabel}
      onPress={onPress}
      style={[
        styles.backButton,
        { minHeight: minTouchTarget, minWidth: minTouchTarget, paddingRight: spacing.sm },
      ]}
    >
      <Text style={[typography.display, styles.backGlyph, { color: colors.textPrimary }]}>‹</Text>
    </Pressable>
  );
}

function CityContent({ city, nowOverride }: { city: City; nowOverride?: Date }) {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const vm = useRecommendation(city, nowOverride ? { now: nowOverride } : {});

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { gap: spacing.xl, padding: spacing.xl }]}
        refreshControl={
          vm.status === 'success' ? (
            <RefreshControl
              onRefresh={vm.refresh}
              refreshing={vm.isRefreshing}
              tintColor={colors.accent}
            />
          ) : undefined
        }
      >
        <View style={[styles.header, { gap: spacing.md }]}>
          <BackButton onPress={() => router.back()} />
          <View style={[styles.headerTexts, { gap: spacing.xs }]}>
            <Text style={[typography.title, { color: colors.textPrimary }]}>{city.name}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {formatCityLocation(city)}
            </Text>
          </View>
        </View>
        <AuroraStrip />

        {vm.status === 'loading' && (
          <View style={{ gap: spacing.xl }}>
            <Skeleton height={148} />
            <Skeleton height={120} />
            <Skeleton height={148} />
          </View>
        )}

        {vm.status === 'error' && <ErrorState message={vm.errorMessage} onRetry={vm.retry} />}

        {vm.status === 'success' &&
          (vm.recommendation.kind === 'no-data' ? (
            <ErrorState message={strings.errors.forecastNoData} onRetry={vm.refresh} />
          ) : (
            <>
              <RecommendationHero recommendation={vm.recommendation} />
              {vm.timeline.length > 0 && (
                <View style={{ gap: spacing.sm }}>
                  <Text
                    style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}
                  >
                    {strings.recommendation.timelineTitle}
                  </Text>
                  <HourlyTimeline hours={vm.timeline} />
                </View>
              )}
              {vm.windowDetails && (
                <View style={{ gap: spacing.sm }}>
                  <Text
                    style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}
                  >
                    {strings.recommendation.detailsTitle}
                  </Text>
                  <WindowDetails details={vm.windowDetails} />
                </View>
              )}
            </>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    justifyContent: 'center',
  },
  backGlyph: {
    lineHeight: 40,
  },
  centered: {
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerTexts: {
    flex: 1,
  },
  missing: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
