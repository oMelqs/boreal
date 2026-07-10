import { Redirect } from 'expo-router';

import { usePreferences } from '@/presentation/hooks/usePreferences';
import { HomeScreen } from '@/presentation/screens/HomeScreen';

/** Guard do primeiro acesso: sem onboarding concluído, a home é o onboarding. */
export default function Index() {
  const { preferences, isLoading } = usePreferences();

  if (isLoading) return null; // splash nativo ainda visível
  if (preferences && !preferences.onboardingDone) {
    return <Redirect href="/onboarding" />;
  }
  return <HomeScreen />;
}
