import { StyleSheet, Text, View } from 'react-native';

import type { WindowDetails as WindowDetailsData } from '@/presentation/hooks/useRecommendation';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

/** Bloco 3 (§6.2): grid compacto com os números da janela recomendada. */
export function WindowDetails({ details }: { details: WindowDetailsData }) {
  const { colors, spacing, radius, typography } = useTheme();

  const items = [
    {
      label: strings.recommendation.details.apparentTemp,
      value: `${Math.round(details.apparentTemp)} °C`,
    },
    {
      label: strings.recommendation.details.precipitationProb,
      value: `${Math.round(details.precipitationProb)}%`,
    },
    {
      label: strings.recommendation.details.wind,
      value: `${Math.round(details.windSpeed)} km/h`,
    },
    { label: strings.recommendation.details.uv, value: String(Math.round(details.maxUv)) },
  ];

  return (
    <View style={[styles.grid, { gap: spacing.sm }]}>
      {items.map((item) => (
        <View
          key={item.label}
          accessible
          accessibilityLabel={`${item.label}: ${item.value}`}
          style={[
            styles.cellBase,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
              borderRadius: radius.md,
              gap: spacing.xs,
              padding: spacing.lg,
            },
          ]}
        >
          <Text style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}>
            {item.label}
          </Text>
          <Text style={[typography.title, { color: colors.textPrimary }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cellBase: {
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
