import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Weekday } from '@/domain/entities/habit';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { Chip } from './Chip';

const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS_MON_FRI: Weekday[] = [1, 2, 3, 4, 5];

type WeekdayPickerProps = {
  value: Weekday[];
  /** Toggle de um dia — o dono do estado decide como aplicar (atômico). */
  onToggleDay: (day: Weekday) => void;
  /** Substituição completa (atalhos "Seg–Sex" / "Todos"). */
  onSetDays: (days: Weekday[]) => void;
};

/** Toggles D S T Q Q S S com atalhos "Seg–Sex" e "Todos" (§8.1). */
export function WeekdayPicker({ value, onToggleDay, onSetDays }: WeekdayPickerProps) {
  const { colors, spacing, typography, minTouchTarget, radius } = useTheme();

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={styles.daysRow}>
        {WEEKDAYS.map((day) => {
          const selected = value.includes(day);
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={strings.onboarding.weekdaysLong[day]}
              accessibilityState={{ selected }}
              onPress={() => onToggleDay(day)}
              style={({ pressed }) => [
                styles.day,
                {
                  backgroundColor: selected ? colors.accent : colors.surface,
                  borderColor: selected ? colors.accent : colors.surfaceBorder,
                  borderRadius: radius.pill,
                  height: minTouchTarget,
                  opacity: pressed ? 0.85 : 1,
                  width: minTouchTarget,
                },
              ]}
            >
              <Text
                style={[
                  typography.heading,
                  { color: selected ? colors.onAccent : colors.textSecondary },
                ]}
              >
                {strings.onboarding.weekdaysShort[day]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.shortcuts, { gap: spacing.sm }]}>
        <Chip
          label={strings.onboarding.weekdaysShortcut}
          onPress={() => onSetDays(WEEKDAYS_MON_FRI)}
        />
        <Chip label={strings.onboarding.everyDay} onPress={() => onSetDays(WEEKDAYS)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  day: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shortcuts: {
    flexDirection: 'row',
  },
});
