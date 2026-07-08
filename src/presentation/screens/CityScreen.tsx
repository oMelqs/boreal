import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuroraStrip } from '@/presentation/components/AuroraStrip';
import { useCityStore } from '@/presentation/hooks/useCityStore';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

/** Stub da tela de recomendação — corpo real chega no próximo PR. */
export function CityScreen() {
  const { colors, spacing, typography } = useTheme();
  const city = useCityStore((state) => state.selectedCity);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { gap: spacing.md, padding: spacing.xl }]}>
        <Text
          accessibilityRole="header"
          style={[typography.display, { color: colors.textPrimary }]}
        >
          {city?.name ?? strings.city.fallbackTitle}
        </Text>
        <AuroraStrip />
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {strings.city.stubHint}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
});
