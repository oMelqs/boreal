import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  loading: boolean;
};

/** Campo de busca com indicador de carregamento inline (§6.1). */
export function SearchInput({ value, onChangeText, loading }: SearchInputProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          borderRadius: radius.lg,
          minHeight: minTouchTarget + 8,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <TextInput
        accessibilityLabel={strings.search.inputLabel}
        accessibilityHint={strings.search.inputHint}
        autoCapitalize="words"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={strings.search.placeholder}
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        style={[styles.input, typography.body, { color: colors.textPrimary }]}
        value={value}
      />
      {loading ? (
        <ActivityIndicator
          accessibilityLabel={strings.search.loading}
          color={colors.accent}
          size="small"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  wrapper: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
});
