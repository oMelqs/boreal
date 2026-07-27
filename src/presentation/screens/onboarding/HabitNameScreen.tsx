import { useRouter } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { HabitCategory } from '@/domain/entities/habit';
import { Button } from '@/presentation/components/Button';
import { Chip } from '@/presentation/components/Chip';
import { StepHeader } from '@/presentation/components/StepHeader';
import { useOnboarding, validateDraft } from '@/presentation/hooks/useOnboarding';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from './OnboardingShell';

const CATEGORIES = Object.keys(strings.onboarding.category) as HabitCategory[];

export function HabitNameScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius, minTouchTarget } = useTheme();
  const draft = useOnboarding((state) => state.draft);
  const updateDraft = useOnboarding((state) => state.updateDraft);
  const setDraftCategory = useOnboarding((state) => state.setDraftCategory);

  const nameError = validateDraft(draft).find((error) => error.field === 'name');
  const showError = draft.name.length > 0 && nameError !== undefined;

  return (
    <OnboardingShell
      header={<StepHeader step={1} total={4} onBack={() => router.back()} />}
      footer={
        <Button
          disabled={nameError !== undefined}
          label={strings.onboarding.next}
          onPress={() => router.push('/onboarding/habit/schedule')}
        />
      }
    >
      <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
        {strings.onboarding.nameTitle}
      </Text>

      <View style={{ gap: spacing.xs }}>
        <TextInput
          accessibilityLabel={strings.onboarding.nameLabel}
          autoFocus
          maxLength={40}
          onChangeText={(name) => updateDraft({ name })}
          placeholder={strings.onboarding.namePlaceholder}
          placeholderTextColor={colors.textSecondary}
          style={[
            typography.title,
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: showError ? colors.danger : colors.surfaceBorder,
              borderRadius: radius.md,
              color: colors.textPrimary,
              minHeight: minTouchTarget + 8,
              paddingHorizontal: spacing.lg,
            },
          ]}
          value={draft.name}
        />
        {showError ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[typography.caption, { color: colors.danger }]}
          >
            {nameError.message}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}>
          {strings.onboarding.categoryLabel}
        </Text>
        <View style={[styles.chips, { gap: spacing.sm }]}>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={strings.onboarding.category[category]}
              onPress={() => setDraftCategory(category)}
              selected={draft.category === category}
            />
          ))}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  input: {
    borderWidth: 1,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
