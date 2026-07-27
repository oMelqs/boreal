import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/presentation/components/Button';
import type { ComfortField } from '@/presentation/components/ComfortFieldsForm';
import { ComfortFieldsForm } from '@/presentation/components/ComfortFieldsForm';
import { StepHeader } from '@/presentation/components/StepHeader';
import { usePreferencesForm, validateDraft } from '@/presentation/hooks/usePreferencesForm';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from '../onboarding/OnboardingShell';
import { preferencesFlow } from './flow';

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

      <ComfortFieldsForm
        fields={[field]}
        onChange={update}
        tempError={tempError?.message}
        value={draft}
      />
    </OnboardingShell>
  );
}
