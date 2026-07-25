import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/presentation/components/Button';
import { StepHeader } from '@/presentation/components/StepHeader';
import { TimeRangePicker } from '@/presentation/components/TimeRangePicker';
import { usePreferencesForm, validateDraft } from '@/presentation/hooks/usePreferencesForm';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from '../onboarding/OnboardingShell';
import { preferencesFlow } from './flow';

type SleepStepScreenProps = {
  standalone?: boolean;
};

/**
 * Etapa da rotina de sono (§8.5): define até onde as sugestões podem ir à
 * noite. Quem não quiser noite escolhe "só com luz do dia" e o app segue com o
 * comportamento anterior.
 */
export function SleepStepScreen({ standalone = false }: SleepStepScreenProps) {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const flow = preferencesFlow(standalone);
  const draft = usePreferencesForm((state) => state.draft);
  const update = usePreferencesForm((state) => state.update);

  const sleepError = validateDraft(draft).find((error) => error.field === 'sleep');

  return (
    <OnboardingShell
      header={
        <StepHeader
          onBack={() => router.back()}
          step={flow.steps.sleep}
          total={flow.steps.total}
        />
      }
      footer={
        <Button
          disabled={sleepError !== undefined}
          label={strings.onboarding.next}
          onPress={() => router.push(flow.afterSleep)}
        />
      }
    >
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
          {strings.preferences.sleepTitle}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {strings.preferences.sleepHint}
        </Text>
      </View>

      <TimeRangePicker
        enabled={draft.sleepEnabled}
        error={sleepError?.message}
        onChange={(patch) => update(patch)}
        onToggle={(sleepEnabled) => update({ sleepEnabled })}
        sleepTime={draft.sleepTime}
        wakeTime={draft.wakeTime}
      />
    </OnboardingShell>
  );
}
