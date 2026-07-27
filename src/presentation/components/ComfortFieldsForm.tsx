import { View } from 'react-native';

import {
  HUMIDITY_MAX,
  HUMIDITY_MIN,
  TEMP_MAX_C,
  TEMP_MIN_C,
  WIND_MAX_KMH,
  WIND_MIN_KMH,
} from '@/domain/usecases/validateComfortPreferences';
import type { ComfortDraft } from '@/presentation/hooks/comfortDraft';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { NumericRangeInput } from './NumericRangeInput';
import { NumericStepperInput } from './NumericStepperInput';

/** Fatores do perfil manual (§8, 1a–1c). */
export type ComfortField = 'temperature' | 'humidity' | 'wind';

/** Passo dos botões −/+: 1 °C na temperatura, 5 em umidade e vento (§4.1). */
const COARSE_STEP = 5;

type ComfortFieldsFormProps = {
  /** Quais fatores mostrar: uma tela por fator em /preferences, todos no hábito. */
  fields: ComfortField[];
  value: ComfortDraft;
  onChange: (patch: Partial<ComfortDraft>) => void;
  /** Mensagem da validação da faixa de temperatura, vinda do domain. */
  tempError?: string;
};

/**
 * Campos numéricos do perfil de conforto. Só compõe os inputs — os limites vêm
 * do domain e a validação é de quem chama, então serve tanto às preferências
 * globais quanto ao conforto de um hábito.
 */
export function ComfortFieldsForm({
  fields,
  value,
  onChange,
  tempError,
}: ComfortFieldsFormProps) {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.lg }}>
      {fields.includes('temperature') && (
        <NumericRangeInput
          error={tempError}
          hint={strings.preferences.tempFeeling(value.tempMin, value.tempMax)}
          max={TEMP_MAX_C}
          min={TEMP_MIN_C}
          onChange={([tempMin, tempMax]) => onChange({ tempMin, tempMax })}
          unit="°C"
          value={[value.tempMin, value.tempMax]}
        />
      )}

      {fields.includes('humidity') && (
        <NumericStepperInput
          accessibilityLabel={strings.preferences.humidityLabel}
          fieldName={strings.preferences.numeric.humidityField}
          hint={strings.preferences.humidityFeeling(value.maxHumidity)}
          label={strings.preferences.humidityLabel}
          max={HUMIDITY_MAX}
          min={HUMIDITY_MIN}
          onChange={(maxHumidity) => onChange({ maxHumidity })}
          step={COARSE_STEP}
          unit="%"
          value={value.maxHumidity}
        />
      )}

      {fields.includes('wind') && (
        <NumericStepperInput
          accessibilityLabel={strings.preferences.windLabel}
          fieldName={strings.preferences.numeric.windField}
          hint={strings.preferences.windFeeling(value.maxWind)}
          label={strings.preferences.windLabel}
          max={WIND_MAX_KMH}
          min={WIND_MIN_KMH}
          onChange={(maxWind) => onChange({ maxWind })}
          step={COARSE_STEP}
          unit="km/h"
          value={value.maxWind}
        />
      )}
    </View>
  );
}
