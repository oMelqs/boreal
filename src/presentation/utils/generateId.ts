/**
 * Id local sem dependência: timestamp base36 + sufixo aleatório. Unicidade
 * suficiente para registros criados no device (decisão transversal da
 * feature de hábitos — o domain permanece determinístico e recebe o Habit
 * pronto).
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
