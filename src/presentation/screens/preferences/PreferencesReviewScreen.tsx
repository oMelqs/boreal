import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DEFAULT_PREFERENCES } from '@/domain/entities/preferences';
import { Button } from '@/presentation/components/Button';
import { StepHeader } from '@/presentation/components/StepHeader';
import { usePreferences } from '@/presentation/hooks/usePreferences';
import { draftToPreferences, usePreferencesForm } from '@/presentation/hooks/usePreferencesForm';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from '../onboarding/OnboardingShell';
import { preferencesFlow } from './flow';
import { comfortSummary, sleepSummary } from './preferencesSummary';

/**
 * Revisão do fluxo avulso (§8.6): resumo em cards e gravação de uma vez. A
 * mutation invalida as preferências, e os painéis recalculam na hora.
 */
export function PreferencesReviewScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius } = useTheme();
  const flow = preferencesFlow(true);
  const { preferences, savePreferences } = usePreferences();
  const draft = usePreferencesForm((state) => state.draft);
  const [saving, setSaving] = useState(false);

  const comfortProfile = draftToPreferences(draft);
  const summary = [
    { label: strings.preferences.profileCardLabel, value: comfortSummary(comfortProfile) },
    { label: strings.preferences.awakeCardLabel, value: sleepSummary(comfortProfile) },
  ];

  async function save() {
    setSaving(true);
    try {
      await savePreferences({
        ...(preferences ?? DEFAULT_PREFERENCES),
        preferences: comfortProfile,
      });
      router.dismissTo('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingShell
      header={
        <StepHeader
          onBack={() => router.back()}
          step={flow.steps.review}
          total={flow.steps.total}
        />
      }
      footer={<Button disabled={saving} label={strings.preferences.save} onPress={save} />}
    >
      <View style={{ gap: spacing.xs }}>
        <Text accessibilityRole="header" style={[typography.title, { color: colors.textPrimary }]}>
          {strings.preferences.reviewTitle}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {strings.preferences.reviewHint}
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        {summary.map((item) => (
          <View
            key={item.label}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surfaceBorder,
                borderRadius: radius.md,
                gap: 2,
                padding: spacing.lg,
              },
            ]}
          >
            <Text style={[typography.label, styles.uppercase, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
            <Text style={[typography.heading, { color: colors.textPrimary }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});
