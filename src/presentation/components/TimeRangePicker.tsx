import { StyleSheet, Text, View } from 'react-native';

import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { Button } from './Button';
import { TimeField } from './TimeField';

type TimeRangePickerProps = {
  wakeTime: string;
  sleepTime: string;
  /** false → a pessoa optou por considerar só as horas com luz do dia. */
  enabled: boolean;
  onChange: (patch: { wakeTime?: string; sleepTime?: string }) => void;
  onToggle: (enabled: boolean) => void;
  error?: string;
};

/** "HH:mm" → minutos; null quando ainda está incompleto/inválido. */
function parseMinutes(time: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Rotina de sono (§8.5): dois horários com a máscara HH:mm do app, mais a
 * saída "só com luz do dia" para quem não quer sugestões noturnas. Rotina que
 * cruza a meia-noite é suportada — o aviso confirma isso em vez de bloquear.
 */
export function TimeRangePicker({
  wakeTime,
  sleepTime,
  enabled,
  onChange,
  onToggle,
  error,
}: TimeRangePickerProps) {
  const { colors, spacing, typography } = useTheme();

  const wake = parseMinutes(wakeTime);
  const sleep = parseMinutes(sleepTime);
  const crossesMidnight = wake !== null && sleep !== null && sleep < wake;

  if (!enabled) {
    return (
      <View style={{ gap: spacing.md }}>
        <Text style={[typography.body, { color: colors.textPrimary }]}>
          {strings.preferences.daylightOnlyActive}
        </Text>
        <Button
          label={strings.preferences.useSleepRoutine}
          onPress={() => onToggle(true)}
          variant="ghost"
        />
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={[styles.row, { gap: spacing.md }]}>
        <View style={styles.field}>
          <TimeField
            label={strings.preferences.wakeLabel}
            onChange={(value) => onChange({ wakeTime: value })}
            value={wakeTime}
          />
        </View>
        <View style={styles.field}>
          <TimeField
            error={error}
            label={strings.preferences.sleepLabel}
            onChange={(value) => onChange({ sleepTime: value })}
            value={sleepTime}
          />
        </View>
      </View>

      {crossesMidnight && error === undefined ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.caption, { color: colors.textSecondary }]}
        >
          {strings.preferences.crossMidnightNotice}
        </Text>
      ) : null}

      <Button
        label={strings.preferences.daylightOnly}
        onPress={() => onToggle(false)}
        variant="ghost"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
});
