import { Pressable, StyleSheet, Text } from 'react-native';

import { useThemeStore } from '@/presentation/hooks/useThemeStore';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

/**
 * Botão discreto de tema: mostra o ícone do tema-alvo (🌙 no claro, ☀️ no
 * escuro) e alterna claro/escuro ao toque, fixando a escolha no override.
 */
export function ThemeToggle() {
  const { scheme, minTouchTarget } = useTheme();
  const setOverride = useThemeStore((state) => state.setOverride);

  const target = scheme === 'dark' ? 'light' : 'dark';
  const icon = scheme === 'dark' ? '☀️' : '🌙';
  const label = target === 'light' ? strings.today.themeToLight : strings.today.themeToDark;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => setOverride(target)}
      style={[styles.button, { minHeight: minTouchTarget, minWidth: minTouchTarget }]}
    >
      <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.icon}>
        {icon}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
});
