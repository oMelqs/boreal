import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import {
  HUMIDITY_MAX,
  HUMIDITY_MIN,
  TEMP_MAX_C,
  TEMP_MIN_C,
  WIND_MAX_KMH,
  WIND_MIN_KMH,
} from '@/domain/usecases/validateComfortPreferences';
import { Button } from '@/presentation/components/Button';
import { NumericRangeInput } from '@/presentation/components/NumericRangeInput';
import { NumericStepperInput } from '@/presentation/components/NumericStepperInput';
import { StepHeader } from '@/presentation/components/StepHeader';
import { usePreferencesForm, validateDraft } from '@/presentation/hooks/usePreferencesForm';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from '../onboarding/OnboardingShell';
import { preferencesFlow } from './flow';

/** Sub-etapas do modo manual (§8, 1a–1c). */
export type ComfortField = 'temperature' | 'humidity' | 'wind';

/** Passo dos botões −/+: 1 °C na temperatura, 5 em umidade e vento (§4.1). */
const COARSE_STEP = 5;

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

type ComfortFieldScreenProps = {
  field: ComfortField;
  standalone?: boolean;
};

/**
 * Uma sub-etapa do modo manual: um fator por tela, com entrada numérica (aqui
 * o valor exato importa) e a leitura em linguagem natural logo abaixo.
 */
export function ComfortFieldScreen({ field, standalone = false }: ComfortFieldScreenProps) {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const flow = preferencesFlow(standalone);
  const draft = usePreferencesForm((state) => state.draft);
  const update = usePreferencesForm((state) => state.update);

  // A regra de amplitude vive no domain; a tela só exibe a mensagem dele e
  // segura o avanço enquanto a faixa estiver inválida.
  const tempError = validateDraft(draft).find((error) => error.field === 'tempRange');
  const blocked = field === 'temperature' && tempError !== undefined;

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
      footer={
        <Button
          disabled={blocked}
          label={strings.onboarding.next}
          onPress={() => router.push(next)}
        />
      }
    >
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
          {COPY[field].title}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{COPY[field].hint}</Text>
      </View>

      {field === 'temperature' && (
        <NumericRangeInput
          error={tempError?.message}
          hint={strings.preferences.tempFeeling(draft.tempMin, draft.tempMax)}
          max={TEMP_MAX_C}
          min={TEMP_MIN_C}
          onChange={([tempMin, tempMax]) => update({ tempMin, tempMax })}
          unit="°C"
          value={[draft.tempMin, draft.tempMax]}
        />
      )}

      {field === 'humidity' && (
        <NumericStepperInput
          accessibilityLabel={strings.preferences.humidityLabel}
          fieldName={strings.preferences.numeric.humidityField}
          hint={strings.preferences.humidityFeeling(draft.maxHumidity)}
          label={strings.preferences.humidityLabel}
          max={HUMIDITY_MAX}
          min={HUMIDITY_MIN}
          onChange={(maxHumidity) => update({ maxHumidity })}
          step={COARSE_STEP}
          unit="%"
          value={draft.maxHumidity}
        />
      )}

      {field === 'wind' && (
        <NumericStepperInput
          accessibilityLabel={strings.preferences.windLabel}
          fieldName={strings.preferences.numeric.windField}
          hint={strings.preferences.windFeeling(draft.maxWind)}
          label={strings.preferences.windLabel}
          max={WIND_MAX_KMH}
          min={WIND_MIN_KMH}
          onChange={(maxWind) => update({ maxWind })}
          step={COARSE_STEP}
          unit="km/h"
          value={draft.maxWind}
        />
      )}
    </OnboardingShell>
  );
}
