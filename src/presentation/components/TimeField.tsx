import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/presentation/theme/useTheme';

type TimeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

/** Aplica a máscara HH:mm enquanto digita (só dígitos, ":" automático). */
export function maskTime(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** Campo de horário sem lib de picker: teclado numérico + máscara leve. */
export function TimeField({ label, value, onChange, error }: TimeFieldProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        inputMode="numeric"
        maxLength={5}
        onChangeText={(text) => onChange(maskTime(text))}
        placeholder="19:00"
        placeholderTextColor={colors.textSecondary}
        style={[
          typography.title,
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.surfaceBorder,
            borderRadius: radius.md,
            color: colors.textPrimary,
            minHeight: minTouchTarget + 8,
            paddingHorizontal: spacing.lg,
          },
        ]}
        value={value}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
