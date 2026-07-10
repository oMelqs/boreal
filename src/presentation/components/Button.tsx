import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/presentation/theme/useTheme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
};

/** Botão padrão do app: primário em accent, ghost para ações secundárias. */
export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? colors.accent : 'transparent',
          borderRadius: radius.pill,
          minHeight: minTouchTarget,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          paddingHorizontal: spacing.xl,
        },
      ]}
    >
      <Text style={[typography.heading, { color: primary ? colors.onAccent : colors.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
