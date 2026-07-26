import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

/** Quanto tempo o aviso de ajuste fica visível depois do clamp. */
const CLAMP_NOTICE_MS = 1200;

type NumericStepperInputProps = {
  /** Rótulo visível acima do campo. */
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Sufixo fixo, não digitável (`%`, `km/h`, `°C`). */
  unit: string;
  onChange: (value: number) => void;
  /** Descrição completa para leitores de tela. */
  accessibilityLabel: string;
  /** Nome do campo nos rótulos dos botões ("Diminuir temperatura mínima"). */
  fieldName: string;
  /** Leitura do valor em linguagem natural, abaixo do campo. */
  hint?: string;
  /** Mensagem de validação vinda da tela (a regra vive no domain). */
  error?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Campo numérico com stepper (§4.1): teclado numérico para acertar o valor
 * exato e botões −/+ para ajuste fino.
 *
 * O texto digitado é estado local e só reporta número no `onChange`: assim dá
 * para escrever "-" e "-1" a caminho de "-10" sem o campo se corrigir no meio
 * da digitação. Os limites são aplicados no blur, não a cada tecla.
 */
export function NumericStepperInput({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  accessibilityLabel,
  fieldName,
  hint,
  error,
}: NumericStepperInputProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();
  // Enquanto a pessoa edita, o rascunho manda; fora da edição (`null`) o campo
  // espelha a prop — sem efeito de sincronização e sem estado duplicado.
  const [draftText, setDraftText] = useState<string | null>(null);
  const [clampNotice, setClampNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const text = draftText ?? String(value);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  function showClampNotice(applied: number) {
    setClampNotice(strings.preferences.numeric.clamped(`${applied}${unit}`));
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setClampNotice(null), CLAMP_NOTICE_MS);
  }

  /** Fim da edição: número inválido volta ao último valor; fora dos limites é limitado. */
  function commit() {
    const typed = draftText;
    setDraftText(null); // volta a espelhar a prop
    if (typed === null) return;

    const parsed = Number(typed.replace(',', '.'));
    if (typed.trim() === '' || Number.isNaN(parsed)) return;

    const rounded = Math.round(parsed);
    const limited = clamp(rounded, min, max);
    if (limited !== rounded) showClampNotice(limited);
    if (limited !== value) onChange(limited);
  }

  function adjust(delta: number) {
    const next = clamp(value + delta, min, max);
    if (next !== value) onChange(next);
  }

  const atMin = value <= min;
  const atMax = value >= max;

  function stepperButton(direction: 'decrease' | 'increase') {
    const disabled = direction === 'decrease' ? atMin : atMax;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.preferences.numeric[direction](fieldName)}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => adjust(direction === 'decrease' ? -step : step)}
        style={[
          styles.stepper,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
            borderRadius: radius.md,
            minHeight: minTouchTarget,
            minWidth: minTouchTarget,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        <Text style={[typography.title, { color: colors.textPrimary }]}>
          {direction === 'decrease' ? '−' : '+'}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}>
        {label}
      </Text>

      <View style={[styles.row, { gap: spacing.sm }]}>
        {stepperButton('decrease')}
        <View
          style={[
            styles.field,
            {
              backgroundColor: colors.surface,
              borderColor: error ? colors.danger : colors.surfaceBorder,
              borderRadius: radius.md,
              minHeight: minTouchTarget + 8,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <TextInput
            accessibilityLabel={accessibilityLabel}
            accessibilityValue={{ text: `${value}${unit}` }}
            inputMode="numeric"
            keyboardType="number-pad"
            onBlur={commit}
            onChangeText={setDraftText}
            onFocus={() => setDraftText(String(value))}
            onSubmitEditing={commit}
            selectTextOnFocus
            style={[typography.title, styles.input, { color: colors.textPrimary }]}
            value={text}
          />
          <Text style={[typography.body, { color: colors.textSecondary }]}>{unit}</Text>
        </View>
        {stepperButton('increase')}
      </View>

      {error ? (
        <Text accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.danger }]}>
          {error}
        </Text>
      ) : clampNotice ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.caption, { color: colors.textSecondary }]}
        >
          {clampNotice}
        </Text>
      ) : hint ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  input: {
    flex: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepper: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
