import { Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

type StepHeaderProps = {
  step: number;
  total: number;
  onBack?: () => void;
};

/** Progresso do onboarding: "Etapa X de Y" anunciado + barra fina em accent. */
export function StepHeader({ step, total, onBack }: StepHeaderProps) {
  const { colors, spacing, typography, minTouchTarget, radius } = useTheme();
  const progress = Math.min(step / total, 1);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.onboarding.back}
            onPress={onBack}
            style={[styles.back, { minHeight: minTouchTarget, minWidth: minTouchTarget }]}
          >
            <Text style={[typography.title, { color: colors.textPrimary }]}>‹</Text>
          </Pressable>
        ) : (
          <View style={{ width: minTouchTarget }} />
        )}
        <Text
          accessibilityLiveRegion="polite"
          style={[typography.label, styles.stepLabel, { color: colors.textSecondary }]}
        >
          {strings.onboarding.stepLabel(step, total)}
        </Text>
        <View style={{ width: minTouchTarget }} />
      </View>
      <View
        accessibilityElementsHidden
        style={[styles.track, { backgroundColor: colors.surfaceBorder, borderRadius: radius.pill }]}
      >
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: radius.pill,
            height: 4,
            width: `${progress * 100}%`,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    textTransform: 'uppercase',
  },
  track: {
    height: 4,
    overflow: 'hidden',
  },
});
