import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { City } from '@/domain/entities/city';
import type { PanelWeather } from '@/presentation/hooks/useTodaySuggestions';
import { formatTemp, formatWindow } from '@/presentation/format/format';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';
import { weatherCodeDescription, weatherCodeIcon } from '@/presentation/weather/weatherCode';

import { ScoreBadge } from './ScoreBadge';

type WeatherCardProps = {
  city: City;
  weather: PanelWeather;
  /** Abre a tela de detalhes (recomendação da cidade). */
  onPress: () => void;
  /** Com rotina de sono, o fim do dia é a hora de dormir (§6.2). */
  hasSleepRoutine?: boolean;
};

/** A janela é noturna quando o motor a explicou como tal. */
function isNightWindow(bestWindow: PanelWeather['bestWindow']): boolean {
  return bestWindow.kind === 'window' && bestWindow.reasons.includes('já de noite');
}

/**
 * Card de clima da home: condição de agora da cidade + teaser do melhor
 * horário para sair. Sempre visível quando há cidade (mesmo sem hábitos);
 * toque leva à tela de detalhes (`/city/[id]`).
 */
export function WeatherCard({
  city,
  weather,
  onPress,
  hasSleepRoutine = false,
}: WeatherCardProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();
  const { current, bestWindow } = weather;

  const description = current
    ? weatherCodeDescription(current.hour.weatherCode)
    : strings.today.weather.noReading;
  const temp = current ? formatTemp(current.hour.temp) : '—';
  const icon = current ? weatherCodeIcon(current.hour.weatherCode, current.hour.isDay) : '🌡️';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={strings.today.weather.cardLabel(city.name, description, temp)}
      accessibilityHint={strings.today.weather.cardHint}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          borderRadius: radius.lg,
          gap: spacing.md,
          minHeight: minTouchTarget,
          padding: spacing.lg,
        },
      ]}
    >
      <View style={[styles.topRow, { gap: spacing.md }]}>
        <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
          {icon}
        </Text>
        <View style={styles.texts}>
          <Text style={[typography.heading, { color: colors.textPrimary }]}>{city.name}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {description}
            {current
              ? ` · ${strings.today.weather.feelsLike(formatTemp(current.hour.apparentTemp))}`
              : ''}
            {current && current.hour.precipitationProb !== null && current.hour.precipitationProb >= 20
              ? ` · ${strings.today.weather.rain(Math.round(current.hour.precipitationProb))}`
              : ''}
          </Text>
        </View>
        <Text style={[typography.display, { color: colors.textPrimary }]}>{temp}</Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        {bestWindow.kind === 'window' ? (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {(isNightWindow(bestWindow)
              ? strings.today.weather.nightWindow
              : strings.today.weather.bestWindow)(
              formatWindow(bestWindow.start, bestWindow.end),
            )}
          </Text>
        ) : bestWindow.kind === 'day-over' ? (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {hasSleepRoutine
              ? strings.today.weather.routineOver
              : strings.today.weather.dayOver}
          </Text>
        ) : null}
        {/* Badge e "ver detalhes" numa linha curta própria → alinham entre si
            mesmo quando o teaser acima quebra em duas linhas. */}
        <View style={[styles.bottomRow, { gap: spacing.sm }]}>
          {bestWindow.kind === 'window' ? (
            <ScoreBadge score={bestWindow.averageScore} />
          ) : null}
          <View style={styles.spacer} />
          <Text style={[typography.label, { color: colors.accent }]}>
            {strings.today.weather.cardHint} ›
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  card: {
    borderWidth: 1,
  },
  icon: {
    fontSize: 40,
    lineHeight: 44,
  },
  spacer: {
    flex: 1,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
