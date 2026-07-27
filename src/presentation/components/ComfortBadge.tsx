import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ComfortPreferences } from '@/domain/entities/preferences';
import { strings } from '@/presentation/i18n/strings';
import { comfortShortLabel } from '@/presentation/screens/preferences/preferencesSummary';
import { useTheme } from '@/presentation/theme/useTheme';

type ComfortBadgeProps = {
  comfort: ComfortPreferences;
  /** Entra no rótulo de acessibilidade da versão clicável. */
  habitName: string;
  /** Quando presente, o selo vira atalho para a etapa de conforto do hábito. */
  onEdit?: () => void;
};

/**
 * Selo do hábito que não usa o perfil global (§9): mostra a faixa escolhida
 * ("🎯 27–34 °C") ou o nome do preset, que é o que explica por que a janela
 * dele sai diferente das outras.
 */
export function ComfortBadge({ comfort, habitName, onEdit }: ComfortBadgeProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const summary = comfortShortLabel(comfort);

  const style = [
    styles.badge,
    {
      borderColor: colors.accent,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 2,
    },
  ];
  const label = <Text style={[typography.label, { color: colors.accent }]}>🎯 {summary}</Text>;

  if (onEdit === undefined) {
    return (
      <View
        accessible
        accessibilityLabel={strings.preferences.ownComfortLabel(summary)}
        style={style}
      >
        {label}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={strings.preferences.ownComfortEdit(habitName, summary)}
      // Área de toque de 44 pt sem esticar o selo: a pill é discreta por
      // design e crescer em altura quebraria a linha do título.
      hitSlop={12}
      onPress={onEdit}
      style={style}
    >
      {label}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
});
