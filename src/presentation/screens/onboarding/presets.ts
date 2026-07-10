import type { DraftHabit } from '@/presentation/hooks/useOnboarding';

/** Sugestões rápidas do §8.1 — pré-preenchem o mini-fluxo. */
export const PRESET_HABITS: { label: string; prefill: Partial<DraftHabit> }[] = [
  {
    label: '🐕 Passear com o cachorro',
    prefill: {
      name: 'Passear com o cachorro',
      category: 'pet',
      intensity: 'leve',
      outdoor: true,
      scheduleKind: 'flexible',
      durationMinutes: 30,
    },
  },
  {
    label: '🏋️ Academia',
    prefill: {
      name: 'Academia',
      category: 'exercicio',
      intensity: 'moderada',
      outdoor: false,
      scheduleKind: 'fixed',
    },
  },
  {
    label: '🎓 Faculdade',
    prefill: {
      name: 'Faculdade',
      category: 'estudo',
      intensity: 'leve',
      outdoor: false,
      scheduleKind: 'fixed',
    },
  },
  {
    label: '🚶 Caminhada',
    prefill: {
      name: 'Caminhada',
      category: 'exercicio',
      intensity: 'moderada',
      outdoor: true,
      scheduleKind: 'flexible',
      durationMinutes: 60,
    },
  },
];
