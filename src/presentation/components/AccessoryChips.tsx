import { StyleSheet, Text, View } from 'react-native';

import type { Accessory } from '@/domain/entities/clothing';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

/** Pills pequenos de acessório (☂️ 🧴 🧢…), cada um com label por extenso. */
export function AccessoryChips({ accessories }: { accessories: Accessory[] }) {
  const { colors, spacing, radius, typography } = useTheme();
  if (accessories.length === 0) return null;

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      {accessories.map((accessory) => {
        const { emoji, label } = strings.accessory[accessory];
        return (
          <View
            key={accessory}
            accessible
            accessibilityLabel={label}
            style={[
              styles.pill,
              {
                backgroundColor: colors.background,
                borderColor: colors.surfaceBorder,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.textPrimary }]}>
              {emoji} {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
