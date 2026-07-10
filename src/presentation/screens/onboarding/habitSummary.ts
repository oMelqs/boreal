import type { Habit } from '@/domain/entities/habit';
import { strings } from '@/presentation/i18n/strings';

/** "19:00–22:30 · seg, qua, sex" / "horário livre · 30min · todos os dias". */
export function habitScheduleSummary(habit: Habit): string {
  const schedule =
    habit.schedule.kind === 'fixed'
      ? strings.onboarding.fixedSummary(habit.schedule.startTime, habit.schedule.endTime)
      : strings.onboarding.flexibleSummary(
          strings.onboarding.durationOption(habit.schedule.durationMinutes),
        );

  const days =
    habit.days.length === 7
      ? 'todos os dias'
      : habit.days
          .map((day) => strings.onboarding.weekdaysLong[day].slice(0, 3))
          .join(', ');

  return `${schedule} · ${days}`;
}
