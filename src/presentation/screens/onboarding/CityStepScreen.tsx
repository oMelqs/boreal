import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import type { City } from '@/domain/entities/city';
import { DEFAULT_USER_PREFERENCES } from '@/domain/entities/preferences';
import { CityListItem } from '@/presentation/components/CityListItem';
import { EmptyState } from '@/presentation/components/EmptyState';
import { ErrorState } from '@/presentation/components/ErrorState';
import { SearchInput } from '@/presentation/components/SearchInput';
import { StepHeader } from '@/presentation/components/StepHeader';
import { useCitySearch } from '@/presentation/hooks/useCitySearch';
import { useOnboarding } from '@/presentation/hooks/useOnboarding';
import { usePreferences } from '@/presentation/hooks/usePreferences';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from './OnboardingShell';

type CityStepScreenProps = {
  searchDebounceMs?: number;
  /** Fora do onboarding (trocar cidade da home): salva e volta. */
  standalone?: boolean;
};

export function CityStepScreen({ searchDebounceMs, standalone = false }: CityStepScreenProps) {
  const router = useRouter();
  const { colors, typography, spacing, scheme } = useTheme();
  const search = useCitySearch(searchDebounceMs);
  const setCity = useOnboarding((state) => state.setCity);
  const { preferences, savePreferences } = usePreferences();

  async function selectCity(city: City) {
    setCity(city);
    // Cidade salva ao selecionar (§8.1); onboarding segue pendente.
    await savePreferences({
      defaultCity: city,
      onboardingDone: preferences?.onboardingDone ?? false,
      preferences: preferences?.preferences ?? DEFAULT_USER_PREFERENCES,
    });
    if (standalone) {
      router.back();
    } else {
      router.push('/onboarding/comfort');
    }
  }

  return (
    <OnboardingShell
      header={
        standalone ? (
          <StepHeader step={1} total={1} onBack={() => router.back()} />
        ) : (
          <StepHeader step={1} total={5} onBack={() => router.back()} />
        )
      }
    >
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
          {strings.onboarding.cityTitle}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {strings.onboarding.cityHint}
        </Text>
      </View>

      <SearchInput
        value={search.query}
        onChangeText={search.setQuery}
        loading={search.status === 'loading'}
      />

      {search.status === 'loading' && (
        <ActivityIndicator accessibilityLabel={strings.search.loading} color={colors.accent} />
      )}
      {search.status === 'success' && (
        <FlatList
          data={search.cities}
          extraData={scheme}
          keyExtractor={(city) => String(city.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <CityListItem city={item} onPress={selectCity} />}
          scrollEnabled={false}
        />
      )}
      {search.status === 'no-results' && (
        <EmptyState emoji="🧭" hint={strings.search.noResults(search.query.trim())} />
      )}
      {search.status === 'error' && search.errorMessage && (
        <ErrorState message={search.errorMessage} onRetry={search.retry} />
      )}
    </OnboardingShell>
  );
}
