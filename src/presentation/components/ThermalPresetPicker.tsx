import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThermalPreset } from '@/domain/entities/preferences';
import type { ComfortDraft } from '@/presentation/hooks/comfortDraft';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { ThermalPresetCard } from './ThermalPresetCard';

const PRESETS: ThermalPreset[] = ['friorento', 'equilibrado', 'calorento'];

type ThermalPresetPickerProps = {
  value: ComfortDraft;
  onSelectPreset: (preset: ThermalPreset) => void;
  /** Link "Prefiro definir na mão"; escondido quando já está no modo manual. */
  onCustom: () => void;
};

/**
 * Os três cards de sensibilidade térmica mais a saída para o modo manual.
 * Não conhece rota: quem navega (ou não) é a tela — as preferências seguem
 * para a próxima etapa, o conforto de um hábito fica na mesma tela.
 */
export function ThermalPresetPicker({
  value,
  onSelectPreset,
  onCustom,
}: ThermalPresetPickerProps) {
  const { colors, spacing, typography, minTouchTarget } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      {PRESETS.map((preset) => (
        <ThermalPresetCard
          key={preset}
          onPress={() => onSelectPreset(preset)}
          preset={preset}
          selected={value.kind === 'preset' && value.preset === preset}
        />
      ))}

      {value.kind === 'preset' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.preferences.customLink}
          onPress={onCustom}
          style={[styles.link, { minHeight: minTouchTarget }]}
        >
          <Text style={[typography.label, { color: colors.accent }]}>
            {strings.preferences.customLink}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
