import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { Button } from '@/presentation/components/Button';
import { StepHeader } from '@/presentation/components/StepHeader';
import { WeekdayPicker } from '@/presentation/components/WeekdayPicker';
import { useOnboarding, validateDraft } from '@/presentation/hooks/useOnboarding';
import { useSaveHabit } from '@/presentation/hooks/useSaveHabit';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from './OnboardingShell';

export function HabitDaysScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const draft = useOnboarding((state) => state.draft);
  const updateDraft = useOnboarding((state) => state.updateDraft);
  const toggleDraftDay = useOnboarding((state) => state.toggleDraftDay);
  const saveHabit = useSaveHabit();

  const hasErrors = validateDraft(draft).length > 0;
  // Hábito que dispensa roupa também não usa clima: a etapa de conforto é
  // pulada e o cadastro termina aqui.
  const skipsComfort = draft.scheduleKind === 'fixed' && !draft.suggestOutfit;

  return (
    <OnboardingShell
      header={<StepHeader step={3} total={4} onBack={() => router.back()} />}
      footer={
        <Button
          disabled={hasErrors}
          label={skipsComfort ? strings.onboarding.save : strings.onboarding.next}
          onPress={
            skipsComfort
              ? () => void saveHabit()
              : () => router.push('/onboarding/habit/comfort')
          }
        />
      }
    >
      <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
        {strings.onboarding.daysTitle}
      </Text>

      <WeekdayPicker
        onSetDays={(days) => updateDraft({ days })}
        onToggleDay={toggleDraftDay}
        value={draft.days}
      />
    </OnboardingShell>
  );
}
