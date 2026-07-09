import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { TimelineHour } from '@/presentation/hooks/useRecommendation';
import { formatHour, formatTemp } from '@/presentation/format/format';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';
import { weatherCodeIcon } from '@/presentation/weather/weatherCode';

const BAR_MAX_HEIGHT = 36;
/** Largura fixa da célula: pré-requisito do getItemLayout/initialScrollIndex. */
const CELL_WIDTH = 76;
const CELL_GAP = 8;

function hourA11yLabel(hour: TimelineHour): string {
  const time = formatHour(hour.time);
  if (hour.score === null) return strings.recommendation.timeline.noDataA11y(time);
  if (!hour.isDay) return strings.recommendation.timeline.nightA11y(time);
  return strings.recommendation.timeline.hourA11y(
    time,
    String(Math.round(hour.temp ?? 0)),
    strings.recommendation.badge[hour.score.label].toLowerCase(),
  );
}

function HourCell({ hour }: { hour: TimelineHour }) {
  const { colors, spacing, radius, typography } = useTheme();
  const barColor = hour.score ? colors.score[hour.score.label] : colors.surfaceBorder;
  const barHeight = hour.score
    ? Math.max(4, Math.round((hour.score.value / 100) * BAR_MAX_HEIGHT))
    : 4;

  return (
    <View
      accessible
      accessibilityLabel={hourA11yLabel(hour)}
      style={[
        styles.cell,
        {
          backgroundColor: colors.surface,
          borderColor: hour.inWindow ? colors.accent : colors.surfaceBorder,
          borderRadius: radius.md,
          borderWidth: hour.inWindow ? 2 : 1,
          opacity: hour.isDay ? 1 : 0.55,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      <Text
        style={[
          typography.caption,
          { color: hour.isNow ? colors.accent : colors.textSecondary },
        ]}
      >
        {hour.isNow ? strings.recommendation.timeline.now : formatHour(hour.time)}
      </Text>
      <Text style={styles.icon}>{weatherCodeIcon(hour.weatherCode, hour.isDay)}</Text>
      <Text style={[typography.heading, { color: colors.textPrimary }]}>
        {formatTemp(hour.temp)}
      </Text>
      <View style={styles.barTrack}>
        <View
          style={{
            backgroundColor: barColor,
            borderRadius: 2,
            height: barHeight,
            width: 5,
          }}
        />
      </View>
      {!hour.isDay ? (
        <Text style={[typography.label, { color: colors.textSecondary }]}>
          {strings.recommendation.timeline.night}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Bloco 2 (§6.2): contexto visual da recomendação, hora a hora. Abre já
 * posicionada na janela recomendada (uma célula antes, para dar contexto).
 */
export function HourlyTimeline({ hours }: { hours: TimelineHour[] }) {
  const { spacing, scheme } = useTheme();
  const windowIndex = hours.findIndex((hour) => hour.inWindow);
  const initialIndex = windowIndex > 0 ? windowIndex - 1 : 0;

  return (
    <FlatList
      contentContainerStyle={{ gap: CELL_GAP, paddingVertical: spacing.xs }}
      data={hours}
      extraData={scheme}
      getItemLayout={(_data, index) => ({
        length: CELL_WIDTH,
        offset: (CELL_WIDTH + CELL_GAP) * index,
        index,
      })}
      horizontal
      initialScrollIndex={initialIndex}
      keyExtractor={(hour) => hour.time.toISOString()}
      renderItem={({ item }) => <HourCell hour={item} />}
      showsHorizontalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  barTrack: {
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  cell: {
    alignItems: 'center',
    gap: 6,
    width: CELL_WIDTH,
  },
  icon: {
    fontSize: 20,
    lineHeight: 24,
  },
});
