import { Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

/** Erro amigável com retry funcional (§6.1). */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();

  return (
    <View style={[styles.container, { gap: spacing.lg, paddingVertical: spacing.xxl }]}>
      <Text style={[typography.body, styles.message, { color: colors.textPrimary }]}>
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.search.retry}
        onPress={onRetry}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.accent,
            borderRadius: radius.pill,
            minHeight: minTouchTarget,
            opacity: pressed ? 0.85 : 1,
            paddingHorizontal: spacing.xl,
          },
        ]}
      >
        <Text style={[typography.heading, { color: colors.onAccent }]}>
          {strings.search.retry}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
