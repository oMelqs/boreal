import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/presentation/components/Button';
import { RangeSlider, Slider } from '@/presentation/components/RangeSlider';
import { StepHeader } from '@/presentation/components/StepHeader';
import { usePreferencesForm } from '@/presentation/hooks/usePreferencesForm';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from '../onboarding/OnboardingShell';
import { preferencesFlow } from './flow';

/** Sub-etapas do modo manual (§8, 1a–1c). */
export type ComfortField = 'temperature' | 'humidity' | 'wind';

const COPY = {
  temperature: {
    title: strings.preferences.tempTitle,
    hint: strings.preferences.tempHint,
  },
  humidity: {
    title: strings.preferences.humidityTitle,
    hint: strings.preferences.humidityHint,
  },
  wind: {
    title: strings.preferences.windTitle,
    hint: strings.preferences.windHint,
  },
} as const;

type ComfortSliderScreenProps = {
  field: ComfortField;
  standalone?: boolean;
};

/**
 * Uma sub-etapa do modo manual: um fator por tela, com o valor escolhido lido
 * em linguagem natural logo abaixo do controle.
 */
export function ComfortSliderScreen({ field, standalone = false }: ComfortSliderScreenProps) {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const flow = preferencesFlow(standalone);
  const draft = usePreferencesForm((state) => state.draft);
  const update = usePreferencesForm((state) => state.update);

  const next =
    field === 'temperature' ? flow.humidity : field === 'humidity' ? flow.wind : flow.sleep;

  return (
    <OnboardingShell
      header={
        <StepHeader
          onBack={() => router.back()}
          step={flow.steps.thermal}
          total={flow.steps.total}
        />
      }
      footer={<Button label={strings.onboarding.next} onPress={() => router.push(next)} />}
    >
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
          {COPY[field].title}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{COPY[field].hint}</Text>
      </View>

      {field === 'temperature' && (
        <RangeSlider
          describeValue={strings.preferences.tempFeeling}
          edgeLabels={{
            min: `${strings.preferences.tempRangeLabel} — mínima`,
            max: `${strings.preferences.tempRangeLabel} — máxima`,
          }}
          formatValue={strings.preferences.tempRangeValue}
          label={strings.preferences.tempRangeLabel}
          max={45}
          min={-10}
          minSpread={4}
          onChange={([tempMin, tempMax]) => update({ tempMin, tempMax })}
          value={[draft.tempMin, draft.tempMax]}
        />
      )}

      {field === 'humidity' && (
        <Slider
          describeValue={strings.preferences.humidityFeeling}
          formatValue={strings.preferences.humidityValue}
          label={strings.preferences.humidityLabel}
          max={100}
          min={40}
          onChange={(maxHumidity) => update({ maxHumidity })}
          value={draft.maxHumidity}
        />
      )}

      {field === 'wind' && (
        <Slider
          describeValue={strings.preferences.windFeeling}
          formatValue={strings.preferences.windValue}
          label={strings.preferences.windLabel}
          max={60}
          min={5}
          onChange={(maxWind) => update({ maxWind })}
          value={draft.maxWind}
        />
      )}
    </OnboardingShell>
  );
}
