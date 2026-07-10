import { StyleSheet, Text, View } from 'react-native';

import type { OutfitLevel } from '@/domain/entities/clothing';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

/** Emoji grande + rótulo do nível de agasalho (o rótulo desambigua). */
export function OutfitBadge({ outfit }: { outfit: OutfitLevel }) {
  const { colors, typography, spacing } = useTheme();
  const { emoji, label } = strings.outfit[outfit];

  return (
    <View accessible accessibilityLabel={label} style={[styles.badge, { gap: spacing.xs }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[typography.label, styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    width: 72,
  },
  emoji: {
    fontSize: 34,
    lineHeight: 40,
  },
  label: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
