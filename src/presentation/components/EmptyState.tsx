import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/presentation/theme/useTheme';

type EmptyStateProps = {
  emoji: string;
  title?: string;
  hint: string;
};

/** Estado vazio com tom leve (§6.1): vazio inicial e "nenhum resultado". */
export function EmptyState({ emoji, title, hint }: EmptyStateProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { gap: spacing.sm, paddingVertical: spacing.xxxl }]}>
      <Text accessibilityElementsHidden style={styles.emoji}>
        {emoji}
      </Text>
      {title ? (
        <Text style={[typography.title, styles.centered, { color: colors.textPrimary }]}>
          {title}
        </Text>
      ) : null}
      <Text style={[typography.body, styles.centered, { color: colors.textSecondary }]}>
        {hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 44,
    lineHeight: 52,
  },
});
