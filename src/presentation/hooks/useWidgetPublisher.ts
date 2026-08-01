import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { nowInTimezone } from '@/data/time/nowInTimezone';
import { useContainer } from '@/di/ContainerProvider';
import type { City } from '@/domain/entities/city';
import type { WidgetSnapshot } from '@/domain/entities/widgetSnapshot';
import { DEFAULT_USER_PREFERENCES } from '@/domain/entities/preferences';
import { buildWidgetSnapshot } from '@/domain/usecases/buildWidgetSnapshot';

import { usePreferences } from './usePreferences';
import { useResolvedCity } from './useResolvedCity';

/**
 * Mantém o widget em dia enquanto o app está aberto (§9.1 do SPECS-WIDGET).
 *
 * Usa **as mesmas queryKeys do painel** (`habits`, `forecast`): nenhum fetch a
 * mais, e como as mutações de hábito e de preferências já invalidam essas
 * chaves, salvar qualquer coisa republica sozinho — sem espalhar chamada de
 * publicação por cada tela.
 *
 * Montado uma vez no layout raiz. Publica no storage (o que o task handler do
 * Android lê com o app fechado) e entrega às plataformas.
 */
type Options = {
  /**
   * Entrega às plataformas nativas — quem monta o hook injeta. O módulo do
   * widget carrega SwiftUI e a lib do Android; importá-lo daqui derrubaria
   * qualquer teste deste hook com "Cannot find native module 'ExpoWidgets'".
   */
  publishNative: (snapshot: WidgetSnapshot) => Promise<void>;
};

export function useWidgetPublisher({ publishNative }: Options): void {
  const container = useContainer();
  const resolved = useResolvedCity();
  const stored = usePreferences();
  const city = resolved.city;
  const lastPublished = useRef<string | null>(null);

  const habitsQuery = useQuery({
    queryKey: ['habits'],
    queryFn: () => container.getHabits(),
    staleTime: Infinity,
  });

  const forecastQuery = useQuery({
    queryKey: ['forecast', city?.id],
    queryFn: () => container.getForecast(city as City),
    enabled: city !== null,
    staleTime: 5 * 60 * 1000,
  });

  const habits = habitsQuery.data;
  const forecast = forecastQuery.data;
  const preferences = stored.preferences?.preferences ?? DEFAULT_USER_PREFERENCES;

  useEffect(() => {
    if (city === null || habits === undefined || forecast === undefined) return;

    const snapshot = buildWidgetSnapshot({
      city,
      forecast,
      habits,
      preferences,
      now: nowInTimezone(city.timezone),
      generatedAt: new Date(),
    });

    // O `generatedAt` muda a cada render, então a comparação ignora ele: sem
    // isso, cada re-render republicaria o mesmo conteúdo.
    const fingerprint = JSON.stringify({ ...snapshot, generatedAt: '' });
    if (fingerprint === lastPublished.current) return;
    lastPublished.current = fingerprint;

    void container.publishWidgetSnapshot(snapshot);
    void publishNative(snapshot);
  }, [city, habits, forecast, preferences, container, publishNative]);
}
