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

/** Quantas horas a timeline cobre (§9.2): seis entradas, uma por hora. */
const TIMELINE_HOURS = 6;
const HOUR_MS = 60 * 60 * 1000;

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
  publishNative: (timeline: WidgetSnapshot[]) => Promise<void>;
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

    const now = nowInTimezone(city.timezone);
    const generatedAt = new Date();

    // Uma entrada por hora: em vez de projetar o snapshot de agora, o use case
    // roda de novo com o relógio adiantado. A roupa das 18h passa a considerar
    // a temperatura das 18h, e não sobra função de projeção para manter.
    const timeline = Array.from({ length: TIMELINE_HOURS }, (_, offset) =>
      buildWidgetSnapshot({
        city,
        forecast,
        habits,
        preferences,
        now: new Date(now.getTime() + offset * HOUR_MS),
        generatedAt: new Date(generatedAt.getTime() + offset * HOUR_MS),
      }),
    );

    // O `generatedAt` muda a cada render, então a comparação ignora ele: sem
    // isso, cada re-render republicaria o mesmo conteúdo. Basta a primeira
    // entrada — as demais derivam dela.
    const fingerprint = JSON.stringify({ ...timeline[0], generatedAt: '' });
    if (fingerprint === lastPublished.current) return;
    lastPublished.current = fingerprint;

    // O storage guarda só o agora: o task handler do Android não tem uso para
    // as horas futuras.
    void container.publishWidgetSnapshot(timeline[0]);
    void publishNative(timeline);
  }, [city, habits, forecast, preferences, container, publishNative]);
}
