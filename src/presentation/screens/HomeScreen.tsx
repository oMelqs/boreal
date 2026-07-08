import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { City } from '@/domain/entities/city';
import { AuroraStrip } from '@/presentation/components/AuroraStrip';
import { CityListItem } from '@/presentation/components/CityListItem';
import { EmptyState } from '@/presentation/components/EmptyState';
import { ErrorState } from '@/presentation/components/ErrorState';
import { SearchInput } from '@/presentation/components/SearchInput';
import { useCitySearch } from '@/presentation/hooks/useCitySearch';
import { useCityStore, useCityStoreHydrated } from '@/presentation/hooks/useCityStore';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

type HomeScreenProps = {
  /** Sobrescrito nos testes de fluxo (0 = sem debounce). */
  searchDebounceMs?: number;
};

export function HomeScreen({ searchDebounceMs }: HomeScreenProps) {
  const router = useRouter();
  const { colors, spacing, typography, minTouchTarget } = useTheme();
  const search = useCitySearch(searchDebounceMs);
  const recentCities = useCityStore((state) => state.recentCities);
  const selectCity = useCityStore((state) => state.selectCity);
  const clearRecents = useCityStore((state) => state.clearRecents);
  const hydrated = useCityStoreHydrated();

  const [listOpacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (search.status === 'success') {
      listOpacity.setValue(0);
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [search.status, listOpacity]);

  function openCity(city: City) {
    selectCity(city);
    router.push(`/city/${city.id}`);
  }

  const showRecents = search.status === 'idle' && hydrated && recentCities.length > 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { padding: spacing.xl, gap: spacing.xl }]}>
        <View style={{ gap: spacing.sm }}>
          <Text
            accessibilityRole="header"
            style={[typography.display, { color: colors.textPrimary }]}
          >
            {strings.home.title}
          </Text>
          <AuroraStrip />
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {strings.home.subtitle}
          </Text>
        </View>

        <SearchInput
          value={search.query}
          onChangeText={search.setQuery}
          loading={search.status === 'loading'}
        />

        {search.status === 'idle' &&
          (showRecents ? (
            <View style={{ gap: spacing.sm }}>
              <View style={styles.recentsHeader}>
                <Text style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}>
                  {strings.search.recentTitle}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={strings.search.clearRecentsLabel}
                  onPress={clearRecents}
                  style={[styles.clearButton, { minHeight: minTouchTarget }]}
                >
                  <Text style={[typography.label, { color: colors.accent }]}>
                    {strings.search.clearRecents}
                  </Text>
                </Pressable>
              </View>
              <FlatList
                data={recentCities}
                keyExtractor={(city) => String(city.id)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => <CityListItem city={item} onPress={openCity} />}
              />
            </View>
          ) : (
            <EmptyState
              emoji="🌌"
              title={strings.search.emptyTitle}
              hint={strings.search.emptyHint}
            />
          ))}

        {search.status === 'loading' && (
          <View style={[styles.loading, { paddingVertical: spacing.xxl }]}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}

        {search.status === 'success' && (
          <Animated.View style={[styles.results, { opacity: listOpacity }]}>
            <FlatList
              data={search.cities}
              keyExtractor={(city) => String(city.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => <CityListItem city={item} onPress={openCity} />}
            />
          </Animated.View>
        )}

        {search.status === 'no-results' && (
          <EmptyState emoji="🧭" hint={strings.search.noResults(search.query.trim())} />
        )}

        {search.status === 'error' && search.errorMessage && (
          <ErrorState message={search.errorMessage} onRetry={search.retry} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  loading: {
    alignItems: 'center',
  },
  recentsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  results: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
