import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThermalPreset } from '@/domain/entities/preferences';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

type ThermalPresetCardProps = {
  preset: ThermalPreset;
  selected: boolean;
  onPress: () => void;
};

/**
 * Card grande de sensibilidade térmica (§8.1): emoji, nome e um exemplo
 * concreto — a pessoa se reconhece na frase em vez de pensar em números.
 */
export function ThermalPresetCard({ preset, selected, onPress }: ThermalPresetCardProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();
  const copy = strings.preferences.preset[preset];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${copy.label}. ${copy.hint}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.accent : colors.surfaceBorder,
          borderRadius: radius.md,
          borderWidth: selected ? 2 : 1,
          gap: spacing.md,
          minHeight: minTouchTarget + 24,
          opacity: pressed ? 0.85 : 1,
          padding: spacing.lg,
        },
      ]}
    >
      <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
        {copy.emoji}
      </Text>
      <View style={styles.texts}>
        <Text
          style={[typography.heading, { color: selected ? colors.accent : colors.textPrimary }]}
        >
          {copy.label}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{copy.hint}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  emoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
