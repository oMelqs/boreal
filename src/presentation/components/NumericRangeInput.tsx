import { StyleSheet, Text, View } from 'react-native';

import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { NumericStepperInput } from './NumericStepperInput';

type NumericRangeInputProps = {
  value: [number, number];
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: [number, number]) => void;
  /** Leitura da faixa em linguagem natural (ex.: "de ameno a calor moderado"). */
  hint: string;
  /** Mensagem de validação da faixa; a regra vive no domain. */
  error?: string;
};

/**
 * Par de campos numéricos "De"/"Até" (§4.2) para a faixa de temperatura
 * agradável. Cada ponta é um stepper independente — o erro de amplitude vem
 * da validação do domain e é exibido uma vez, abaixo dos dois campos.
 */
export function NumericRangeInput({
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  hint,
  error,
}: NumericRangeInputProps) {
  const { colors, spacing, typography } = useTheme();
  const [low, high] = value;
  const copy = strings.preferences.numeric;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={[styles.row, { gap: spacing.md }]}>
        <View style={styles.field}>
          <NumericStepperInput
            accessibilityLabel={copy.tempMinLabel}
            fieldName={copy.tempMinField}
            label={copy.from}
            max={max}
            min={min}
            onChange={(next) => onChange([next, high])}
            step={step}
            unit={unit}
            value={low}
          />
        </View>
        <View style={styles.field}>
          <NumericStepperInput
            accessibilityLabel={copy.tempMaxLabel}
            fieldName={copy.tempMaxField}
            label={copy.to}
            max={max}
            min={min}
            onChange={(next) => onChange([low, next])}
            step={step}
            unit={unit}
            value={high}
          />
        </View>
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.caption, { color: colors.danger }]}
        >
          {error}
        </Text>
      ) : (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{hint}</Text>
      )}
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
