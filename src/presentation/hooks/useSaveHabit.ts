import { useRouter } from 'expo-router';

import { draftToHabit, useOnboarding } from '@/presentation/hooks/useOnboarding';
import { useHabits } from '@/presentation/hooks/useHabits';
import { generateId } from '@/presentation/utils/generateId';

/**
 * Fecha o mini-fluxo de hábito. Duas telas terminam o cadastro — a de conforto
 * no caso normal e a de dias quando o hábito dispensa clima —, então a regra de
 * onde gravar e para onde voltar vive aqui, não duplicada em cada uma.
 *
 * No modo "manage" persiste direto no repository (§8.3); no onboarding, apenas
 * commita na lista local, que só é gravada ao concluir.
 */
export function useSaveHabit() {
  const router = useRouter();
  const draft = useOnboarding((state) => state.draft);
  const editingId = useOnboarding((state) => state.editingId);
  const editingCreatedAt = useOnboarding((state) => state.editingCreatedAt);
  const mode = useOnboarding((state) => state.mode);
  const commitDraft = useOnboarding((state) => state.commitDraft);
  const finishManage = useOnboarding((state) => state.finishManage);
  const { save } = useHabits();

  return async function saveHabit() {
    if (mode === 'manage') {
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
  };
}
