import { useRouter } from 'expo-router';
import { Text } from 'react-native';

import { Button } from '@/presentation/components/Button';
import { StepHeader } from '@/presentation/components/StepHeader';
import { WeekdayPicker } from '@/presentation/components/WeekdayPicker';
import { useHabits } from '@/presentation/hooks/useHabits';
import { draftToHabit, useOnboarding, validateDraft } from '@/presentation/hooks/useOnboarding';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';
import { generateId } from '@/presentation/utils/generateId';

import { OnboardingShell } from './OnboardingShell';

export function HabitDaysScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const draft = useOnboarding((state) => state.draft);
  const editingId = useOnboarding((state) => state.editingId);
  const editingCreatedAt = useOnboarding((state) => state.editingCreatedAt);
  const mode = useOnboarding((state) => state.mode);
  const updateDraft = useOnboarding((state) => state.updateDraft);
  const toggleDraftDay = useOnboarding((state) => state.toggleDraftDay);
  const commitDraft = useOnboarding((state) => state.commitDraft);
  const finishManage = useOnboarding((state) => state.finishManage);
  const { save } = useHabits();

  const hasErrors = validateDraft(draft).length > 0;

  async function saveHabit() {
    if (mode === 'manage') {
      // Gerenciar hábitos: persiste direto no repository (§8.3).
      const habit = draftToHabit(
        draft,
        editingId ?? generateId(),
        editingCreatedAt ?? new Date().toISOString(),
      );
      await save(habit);
      finishManage();
      router.dismissTo('/habits');
      return;
    }

    const wasEditing = editingId !== null;
    if (!commitDraft()) return;
    // Editar veio da revisão; hábito novo volta para a lista da etapa 2.
    router.dismissTo(wasEditing ? '/onboarding/review' : '/onboarding/habits');
  }

  return (
    <OnboardingShell
      header={<StepHeader step={3} total={3} onBack={() => router.back()} />}
      footer={<Button disabled={hasErrors} label={strings.onboarding.save} onPress={saveHabit} />}
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
