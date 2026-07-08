import { StyleSheet, Text, View } from 'react-native';

import type { ComfortScore } from '@/domain/entities/comfortScore';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

/** Selo de classificação do score (Ótimo/Bom/Razoável/Ruim) na cor semântica. */
export function ScoreBadge({ score }: { score: ComfortScore }) {
  const { colors, spacing, radius, typography } = useTheme();
  const color = colors.score[score.label];

  return (
    <View
      accessibilityLabel={`score ${strings.recommendation.badge[score.label]}`}
      style={[
        styles.badge,
        {
          borderColor: color,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[typography.label, { color }]}>
        {strings.recommendation.badge[score.label]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
});
