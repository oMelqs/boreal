import type { HabitSuggestion } from '../entities/clothing';
import type { FixedSchedule, Habit } from '../entities/habit';
import type { HourlyForecast } from '../entities/hourlyForecast';
import type { UserPreferences } from '../entities/preferences';
import { DEFAULT_USER_PREFERENCES } from '../entities/preferences';
import { currentAwakeCycle } from './awakeWindow';
import { sameLocalDay, splitByLocalDay, weekdayOf } from './localDay';
import { recommendBestWindowForHabit } from './recommendBestWindowForHabit';
import { resolveComfortProfile } from './resolveComfortProfile';
import { suggestOutfit } from './suggestOutfit';

const NO_DATA_REASON = 'A previsão veio sem dados utilizáveis para este horário.';
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Hora cheia do forecast que cobre o horário "HH:mm" do hábito. */
function hourAt(dayHours: HourlyForecast[], time: string): HourlyForecast | undefined {
  const hour = Math.floor(parseMinutes(time) / 60);
  return dayHours.find((candidate) => candidate.time.getUTCHours() === hour);
}

/** 00:00 do dia local de `date`, no frame fake-UTC. */
function startOfLocalDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function fixedSuggestion(
  habit: Habit,
  schedule: FixedSchedule,
  dayHours: HourlyForecast[],
  when: 'hoje' | 'amanha',
  tempOffset: number,
): HabitSuggestion {
  const atStart = hourAt(dayHours, schedule.startTime);
  const atEnd = hourAt(dayHours, schedule.endTime);
  const suggestion = atStart
    ? suggestOutfit({
        atStart,
        ...(atEnd ? { atEnd } : {}),
        intensity: habit.intensity,
        outdoor: habit.outdoor,
        tempOffset,
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
 * Com rotina de sono, "hoje" é o ciclo acordado corrente (§6.2): às 00h30 de
 * quem dorme à 01h00, a âncora do dia é o início do ciclo (ontem) — o hábito
 * de ontem ainda é "hoje" e os fixos de ontem já contam como passados.
 *
 * `hours` é o forecast de até 2 dias; `now` é o agora no relógio da cidade.
 */
export function getTodaySuggestions(
  habits: readonly Habit[],
  hours: readonly HourlyForecast[],
  now: Date,
  preferences: UserPreferences = DEFAULT_USER_PREFERENCES,
): HabitSuggestion[] {
  const sleep = preferences.sleep;
  const cycle = sleep !== undefined ? currentAwakeCycle(now, sleep) : null;
  const anchor = cycle !== null && cycle.start.getTime() <= now.getTime() ? cycle.start : now;

  const { today, tomorrow } = splitByLocalDay(hours, anchor);
  const todayWeekday = weekdayOf(anchor);
  const tomorrowWeekday = ((todayWeekday + 1) % 7) as Habit['days'][number];
  // Minutos desde o início do dia-âncora: às 00h30 ancorado em ontem, 1470.
  const nowMinutes = Math.floor((now.getTime() - startOfLocalDay(anchor)) / MINUTE_MS);

  // "Agora" do amanhã dos hábitos livres: o início do próximo ciclo acordado
  // (com rotina) ou a meia-noite do dia seguinte (comportamento legado).
  const tomorrowNow =
    cycle !== null
      ? cycle.start.getTime() > now.getTime() && !sameLocalDay(cycle.start, now)
        ? cycle.start
        : new Date(cycle.start.getTime() + DAY_MS)
      : new Date(startOfLocalDay(anchor) + DAY_MS);

  const suggestions: HabitSuggestion[] = [];

  for (const habit of habits) {
    if (!habit.enabled) continue;
    const occursToday = habit.days.includes(todayWeekday);
    const occursTomorrow = habit.days.includes(tomorrowWeekday);

    if (habit.schedule.kind === 'fixed') {
      const schedule = habit.schedule;
      // O offset vem do perfil DO HÁBITO: com conforto próprio, é ele que
      // decide o agasalho, não a preferência global.
      const { tempOffset } = resolveComfortProfile(preferences, habit);
      if (occursToday && parseMinutes(schedule.startTime) >= nowMinutes) {
        suggestions.push(fixedSuggestion(habit, schedule, today, 'hoje', tempOffset));
      } else if (occursTomorrow && tomorrow.length > 0) {
        suggestions.push(fixedSuggestion(habit, schedule, tomorrow, 'amanha', tempOffset));
      }
      continue;
    }

    if (occursToday) {
      const result = recommendBestWindowForHabit(hours, now, habit, preferences);
      suggestions.push(
        result.kind === 'window'
          ? { habit, kind: 'window', when: 'hoje', recommendation: result }
          : { habit, kind: 'no-slot', when: 'hoje', reason: result.reason },
      );
    } else if (occursTomorrow && tomorrow.length > 0) {
      const result = recommendBestWindowForHabit(hours, tomorrowNow, habit, preferences);
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
