import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { container } from '@/di/container';
import { ContainerProvider } from '@/di/ContainerProvider';
import { useWidgetPublisher } from '@/presentation/hooks/useWidgetPublisher';
import { createQueryClient } from '@/presentation/queryClient';
import { useTheme } from '@/presentation/theme/useTheme';
import { publishWidgetSnapshot } from '@/widgets/publishWidgetSnapshot';

/**
 * Casca de navegação. Existe separada da raiz porque o publicador do widget
 * precisa dos providers montados acima dele — ele usa as mesmas queries do
 * painel para não buscar nada a mais.
 */
function AppStack() {
  const { colors, scheme } = useTheme();
  useWidgetPublisher({ publishNative: publishWidgetSnapshot });

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);

  return (
    <ContainerProvider container={container}>
      <QueryClientProvider client={queryClient}>
        <AppStack />
      </QueryClientProvider>
    </ContainerProvider>
  );
}
