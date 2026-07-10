import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { DEFAULT_PREFERENCES } from '@/domain/entities/preferences';
import { AuroraStrip } from '@/presentation/components/AuroraStrip';
import { Button } from '@/presentation/components/Button';
import { usePreferences } from '@/presentation/hooks/usePreferences';
import { strings } from '@/presentation/i18n/strings';
import { useTheme } from '@/presentation/theme/useTheme';

import { OnboardingShell } from './OnboardingShell';

export function WelcomeScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const { preferences, savePreferences } = usePreferences();

  async function skip() {
    // Marca como concluído para o guard não recriar o loop; dá para
    // cadastrar hábitos depois pela própria home.
    await savePreferences({ ...(preferences ?? DEFAULT_PREFERENCES), onboardingDone: true });
    router.replace('/');
  }

  return (
    <OnboardingShell
      footer={
        <>
          <Button label={strings.onboarding.start} onPress={() => router.push('/onboarding/city')} />
          <Button label={strings.onboarding.skip} onPress={skip} variant="ghost" />
        </>
      }
    >
      <View style={[styles.hero, { gap: spacing.lg }]}>
        <Text style={[typography.display, { color: colors.textPrimary }]}>
          {strings.onboarding.welcomeTitle}
        </Text>
        <AuroraStrip width={120} />
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {strings.onboarding.welcomeHint}
        </Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 48,
  },
});
