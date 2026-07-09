import type { HabitSuggestion } from '../entities/clothing';
import type { FixedSchedule, Habit } from '../entities/habit';
import type { HourlyForecast } from '../entities/hourlyForecast';
import { splitByLocalDay, weekdayOf } from './localDay';
import { recommendBestWindowForHabit } from './recommendBestWindowForHabit';
import { suggestOutfit } from './suggestOutfit';

const NO_DATA_REASON = 'A previsão veio sem dados utilizáveis para este horário.';

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Hora cheia do forecast que cobre o horário "HH:mm" do hábito. */
function hourAt(dayHours: HourlyForecast[], time: string): HourlyForecast | undefined {
  const hour = Math.floor(parseMinutes(time) / 60);
  return dayHours.find((candidate) => candidate.time.getUTCHours() === hour);
}

/** 00:00 do dia local seguinte a `now`, no frame fake-UTC. */
function startOfTomorrow(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

function fixedSuggestion(
  habit: Habit,
  schedule: FixedSchedule,
  dayHours: HourlyForecast[],
  when: 'hoje' | 'amanha',
): HabitSuggestion {
  const atStart = hourAt(dayHours, schedule.startTime);
  const atEnd = hourAt(dayHours, schedule.endTime);
  const suggestion = atStart
    ? suggestOutfit({
        atStart,
        ...(atEnd ? { atEnd } : {}),
        intensity: habit.intensity,
        outdoor: habit.outdoor,
      })
    : null;

  if (!suggestion) {
    return { habit, kind: 'no-slot', when: 'hoje', reason: NO_DATA_REASON };
  }
  return { habit, kind: 'clothing', when, suggestion };
}

/** Posição do card dentro do grupo (§7.4): fixos pelo início, livres pela janela. */
function sortMinutes(suggestion: HabitSuggestion): number {
  if (suggestion.kind === 'window') {
    return suggestion.recommendation.kind === 'window'
      ? suggestion.recommendation.start.getUTCHours() * 60
      : Number.MAX_SAFE_INTEGER;
  }
  const schedule = suggestion.habit.schedule;
  if (schedule.kind === 'fixed') return parseMinutes(schedule.startTime);
  if (suggestion.kind === 'no-slot') {
    return schedule.earliest !== undefined
      ? parseMinutes(schedule.earliest)
      : Number.MAX_SAFE_INTEGER;
  }
  return 0;
}

/**
 * Orquestrador do painel "Hoje" (§7): para cada hábito ativo que ocorre hoje
 * (ou amanhã, como próxima ocorrência), produz a sugestão certa — vestimenta
 * para horário fixo, janela recomendada para horário livre, ou `no-slot` com
 * o porquê. Ordenação: primeiro os de hoje por horário, depois os de amanhã.
 *
 * `hours` é o forecast de até 2 dias; `now` é o agora no relógio da cidade.
 */
export function getTodaySuggestions(
  habits: readonly Habit[],
  hours: readonly HourlyForecast[],
  now: Date,
): HabitSuggestion[] {
  const { today, tomorrow } = splitByLocalDay(hours, now);
  const todayWeekday = weekdayOf(now);
  const tomorrowWeekday = ((todayWeekday + 1) % 7) as Habit['days'][number];
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const suggestions: HabitSuggestion[] = [];

  for (const habit of habits) {
    if (!habit.enabled) continue;
    const occursToday = habit.days.includes(todayWeekday);
    const occursTomorrow = habit.days.includes(tomorrowWeekday);

    if (habit.schedule.kind === 'fixed') {
      const schedule = habit.schedule;
      if (occursToday && parseMinutes(schedule.startTime) >= nowMinutes) {
        suggestions.push(fixedSuggestion(habit, schedule, today, 'hoje'));
      } else if (occursTomorrow && tomorrow.length > 0) {
        suggestions.push(fixedSuggestion(habit, schedule, tomorrow, 'amanha'));
      }
      continue;
    }

    if (occursToday) {
      const result = recommendBestWindowForHabit(hours, now, habit);
      suggestions.push(
        result.kind === 'window'
          ? { habit, kind: 'window', when: 'hoje', recommendation: result }
          : { habit, kind: 'no-slot', when: 'hoje', reason: result.reason },
      );
    } else if (occursTomorrow && tomorrow.length > 0) {
      const result = recommendBestWindowForHabit(hours, startOfTomorrow(now), habit);
      suggestions.push(
        result.kind === 'window'
          ? { habit, kind: 'window', when: 'amanha', recommendation: result }
          : { habit, kind: 'no-slot', when: 'hoje', reason: result.reason },
      );
    }
  }

  return suggestions.sort((a, b) => {
    const groupA = a.kind === 'no-slot' ? 0 : a.when === 'hoje' ? 0 : 1;
    const groupB = b.kind === 'no-slot' ? 0 : b.when === 'hoje' ? 0 : 1;
    if (groupA !== groupB) return groupA - groupB;
    return sortMinutes(a) - sortMinutes(b);
  });
}
