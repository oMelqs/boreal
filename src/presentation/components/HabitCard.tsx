import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HabitSuggestion } from '@/domain/entities/clothing';
import type { HourlyForecast } from '@/domain/entities/hourlyForecast';
import { formatReasonsSentence, formatWindow } from '@/presentation/format/format';
import { buildTimeline } from '@/presentation/hooks/useRecommendation';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { AccessoryChips } from './AccessoryChips';
import { HourlyTimeline } from './HourlyTimeline';
import { OutfitBadge } from './OutfitBadge';
import { ScoreBadge } from './ScoreBadge';

type HabitCardProps = {
  suggestion: HabitSuggestion;
  /** Horas restantes de hoje — timeline expansível dos cards de janela. */
  todayHours: HourlyForecast[];
  now: Date;
};

function TomorrowBadge() {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <View
      style={[
        styles.tomorrow,
        {
          borderColor: colors.accent,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: 2,
        },
      ]}
    >
      <Text style={[typography.label, { color: colors.accent }]}>
        {strings.today.tomorrowBadge}
      </Text>
    </View>
  );
}

/** Card do painel Hoje (§8.2): vestimenta, janela recomendada ou no-slot. */
export function HabitCard({ suggestion, todayHours, now }: HabitCardProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { habit } = suggestion;

  const schedule =
    habit.schedule.kind === 'fixed'
      ? `${habit.schedule.startTime}–${habit.schedule.endTime}`
      : null;

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderRadius: radius.lg,
      gap: spacing.md,
      padding: spacing.lg,
    },
  ];

  if (suggestion.kind === 'no-slot') {
    return (
      <View accessible accessibilityLabel={`${habit.name}: ${suggestion.reason}`} style={cardStyle}>
        <Text style={[typography.heading, { color: colors.textSecondary }]}>{habit.name}</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{suggestion.reason}</Text>
      </View>
    );
  }

  if (suggestion.kind === 'clothing') {
    const { suggestion: clothing } = suggestion;
    return (
      <View style={cardStyle}>
        <View style={[styles.headerRow, { gap: spacing.sm }]}>
          <View style={styles.titleBlock}>
            <Text style={[typography.heading, { color: colors.textPrimary }]}>{habit.name}</Text>
            {schedule ? (
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{schedule}</Text>
            ) : null}
          </View>
          {suggestion.when === 'amanha' ? <TomorrowBadge /> : null}
        </View>
        <View style={[styles.clothingRow, { gap: spacing.lg }]}>
          <OutfitBadge outfit={clothing.outfit} />
          <Text style={[typography.body, styles.summary, { color: colors.textPrimary }]}>
            {clothing.summary}
          </Text>
        </View>
        <AccessoryChips accessories={clothing.accessories} />
      </View>
    );
  }

  // kind === 'window'
  const { recommendation } = suggestion;
  if (recommendation.kind !== 'window') {
    // Não deve ocorrer (orquestrador converte para no-slot), mas sem crash.
    return null;
  }

  return (
    <View style={cardStyle}>
      <View style={[styles.headerRow, { gap: spacing.sm }]}>
        <View style={styles.titleBlock}>
          <Text style={[typography.heading, { color: colors.textPrimary }]}>{habit.name}</Text>
          <Text style={[typography.title, { color: colors.accent }]}>
            {formatWindow(recommendation.start, recommendation.end)}
          </Text>
        </View>
        {suggestion.when === 'amanha' ? <TomorrowBadge /> : null}
      </View>
      <Text style={[typography.body, { color: colors.textSecondary }]}>
        {formatReasonsSentence(recommendation.reasons)}
      </Text>
      <View style={styles.headerRow}>
        <ScoreBadge score={recommendation.averageScore} />
      </View>
      {recommendation.caveat ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {strings.recommendation.caveat(recommendation.caveat)}
        </Text>
      ) : null}
      {suggestion.when === 'hoje' && todayHours.length > 0 ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={
              expanded ? strings.today.collapseTimeline : strings.today.expandTimeline
            }
            onPress={() => setExpanded((current) => !current)}
            style={styles.expandButton}
          >
            <Text style={[typography.label, { color: colors.accent }]}>
              {expanded ? strings.today.collapseTimeline : strings.today.expandTimeline}
            </Text>
          </Pressable>
          {expanded ? (
            <HourlyTimeline hours={buildTimeline(todayHours, now, recommendation)} />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  clothingRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  expandButton: {
    justifyContent: 'center',
    minHeight: 40,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summary: {
    flex: 1,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  tomorrow: {
    borderWidth: 1,
  },
});
