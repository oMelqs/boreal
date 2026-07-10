import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/presentation/theme/useTheme';

type ChipProps = {
  label: string;
  onPress: () => void;
  selected?: boolean;
};

/** Pill selecionável (categorias, durações, presets) — estado anunciado. */
export function Chip({ label, onPress, selected = false }: ChipProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.accent : colors.surfaceBorder,
          borderRadius: radius.pill,
          borderWidth: selected ? 2 : 1,
          minHeight: minTouchTarget,
          opacity: pressed ? 0.85 : 1,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      {selected ? <View style={[styles.dot, { backgroundColor: colors.accent }]} /> : null}
      <Text
        style={[typography.body, { color: selected ? colors.accent : colors.textPrimary }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
});
