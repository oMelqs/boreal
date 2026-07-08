import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { container } from '@/di/container';
import { ContainerProvider } from '@/di/ContainerProvider';
import { createQueryClient } from '@/presentation/queryClient';
import { useTheme } from '@/presentation/theme/useTheme';

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const { colors } = useTheme();

  return (
    <ContainerProvider container={container}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </QueryClientProvider>
    </ContainerProvider>
  );
}
