import { StyleSheet, Text, View } from 'react-native';

import type { Recommendation } from '@/domain/entities/recommendation';
import { formatReasonsSentence, formatWindow } from '@/presentation/format/format';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { ScoreBadge } from './ScoreBadge';

type RecommendationHeroProps = {
  recommendation: Extract<Recommendation, { kind: 'window' | 'day-over' }>;
};

/**
 * Bloco 1 da hierarquia (§6.2): a primeira coisa que se lê. Janela em
 * destaque gigante com o porquê; day-over ocupa o lugar do hero em tom leve.
 */
export function RecommendationHero({ recommendation }: RecommendationHeroProps) {
  const { colors, spacing, radius, typography } = useTheme();

  if (recommendation.kind === 'day-over') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
            borderRadius: radius.lg,
            gap: spacing.sm,
            padding: spacing.xl,
          },
        ]}
      >
        <Text accessibilityElementsHidden style={styles.moon}>
          🌙
        </Text>
        <Text style={[typography.title, { color: colors.textPrimary }]}>
          {strings.recommendation.dayOverTitle}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {strings.recommendation.dayOverHint}
        </Text>
      </View>
    );
  }

  const caveatColor = colors.score[recommendation.averageScore.label];

  return (
    <View style={{ gap: spacing.md }}>
      <Text style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}>
        {strings.recommendation.heroLabel}
      </Text>
      <Text
        accessibilityRole="header"
        style={[styles.window, { color: colors.textPrimary }]}
      >
        {formatWindow(recommendation.start, recommendation.end)}
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary }]}>
        {formatReasonsSentence(recommendation.reasons)}
      </Text>
      <ScoreBadge score={recommendation.averageScore} />
      {recommendation.caveat ? (
        <View
          style={[
            styles.caveat,
            {
              borderColor: caveatColor,
              borderRadius: radius.md,
              padding: spacing.md,
            },
          ]}
        >
          <Text style={[typography.caption, { color: colors.textPrimary }]}>
            {strings.recommendation.caveat(recommendation.caveat)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  caveat: {
    borderLeftWidth: 3,
    borderWidth: 1,
  },
  moon: {
    fontSize: 40,
    lineHeight: 48,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  window: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 68,
  },
});
