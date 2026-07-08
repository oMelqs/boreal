import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { City } from '@/domain/entities/city';
import { useTheme } from '@/presentation/theme/useTheme';

type CityListItemProps = {
  city: City;
  onPress: (city: City) => void;
};

/** "Admin1, País" — desambiguação exigida pelo §4.1. */
export function formatCityLocation(city: City): string {
  return [city.admin1, city.country].filter(Boolean).join(', ');
}

export function CityListItem({ city, onPress }: CityListItemProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();
  const location = formatCityLocation(city);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={location ? `${city.name} — ${location}` : city.name}
      onPress={() => onPress(city)}
      style={({ pressed }) => [
        styles.item,
        {
          borderRadius: radius.md,
          minHeight: minTouchTarget + 8,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor: pressed ? colors.surface : 'transparent',
        },
      ]}
    >
      <View style={styles.texts}>
        <Text style={[typography.heading, { color: colors.textPrimary }]}>{city.name}</Text>
        {location ? (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{location}</Text>
        ) : null}
      </View>
      <Text
        accessibilityElementsHidden
        style={[typography.heading, { color: colors.textSecondary }]}
      >
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  texts: {
    gap: 2,
  },
});
