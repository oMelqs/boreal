import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/presentation/theme/useTheme';

type OnboardingShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
};

/** Moldura comum das etapas: header fixo, conteúdo rolável, footer de ações. */
export function OnboardingShell({ children, footer, header }: OnboardingShellProps) {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { padding: spacing.xl, gap: spacing.lg }]}>
        {header}
        <ScrollView
          contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.content}
        >
          {children}
        </ScrollView>
        {footer ? <View style={{ gap: spacing.sm }}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
