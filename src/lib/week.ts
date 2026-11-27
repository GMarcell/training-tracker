import { addDays, isoWeekday, startOfWeek } from "@/lib/dates";

/** The minimum shape needed from an ExerciseEntry for volume calculations. */
export type VolumeEntry = { sets: number; reps: number };

export type WeekDayType = {
  skipInMatchWeek: boolean;
  archived?: boolean;
};

export type WeekSession = {
  date: string;
  dayType: {
    countsTowardTarget: boolean;
    isMatch: boolean;
  };
  entries: VolumeEntry[];
};

export type WeekSummary = {
  weekStart: string;
  weekEnd: string;
  target: number;
  baseTarget: number;
  isMatchWeek: boolean;
  /** Active day types skipped in a match week (only used when isMatchWeek). */
  skippedDayTypes: number;
  sessionsDone: number;
  remaining: number;
  completionPct: number;
  totalSets: number;
  totalVolume: number;
  status: "hit" | "to-go" | "missed";
};

export function exerciseVolume(entry: VolumeEntry): number {
  const sets = Math.max(0, Math.trunc(entry.sets));
  const reps = Math.max(0, Math.trunc(entry.reps));
  return sets * reps;
}

export function totalVolume(entries: VolumeEntry[]): number {
  return entries.reduce((sum, entry) => sum + exerciseVolume(entry), 0);
}

export function totalSets(entries: VolumeEntry[]): number {
  return entries.reduce(
    (sum, entry) => sum + Math.max(0, Math.trunc(entry.sets)),
    0,
  );
}

export function isMatchWeek(
  sessions: Array<{ dayType: { isMatch: boolean } }>,
): boolean {
  return sessions.some((session) => session.dayType.isMatch);
}

/**
 * Base target minus every active day type flagged skipInMatchWeek during a
 * match week. An explicit per-week override always wins.
 */
export function computeWeekTarget(input: {
  baseTarget: number;
  dayTypes: WeekDayType[];
  sessions: Array<{ dayType: { isMatch: boolean } }>;
  override?: number | null;
}): {
  target: number;
  baseTarget: number;
  isMatchWeek: boolean;
  skippedDayTypes: number;
} {
  const matchWeek = isMatchWeek(input.sessions);
  const skippedDayTypes = matchWeek
    ? input.dayTypes.filter(
        (dayType) => !dayType.archived && dayType.skipInMatchWeek,
      ).length
    : 0;

  const target =
    input.override != null
      ? Math.max(0, input.override)
      : matchWeek
        ? Math.max(0, input.baseTarget - skippedDayTypes)
        : Math.max(0, input.baseTarget);

  return {
    target,
    baseTarget: Math.max(0, input.baseTarget),
    isMatchWeek: matchWeek,
    skippedDayTypes,
  };
}

export function sessionsInWeek(
  sessions: WeekSession[],
  weekStart: string,
): WeekSession[] {
  const weekEnd = addDays(weekStart, 6);
  return sessions.filter(
    (session) => session.date >= weekStart && session.date <= weekEnd,
  );
}

/**
 * Sessions that count toward the weekly target: sessions whose day type counts
 * and which are not matches (matches never count, even if misconfigured).
 */
export function countedSessions(sessions: WeekSession[]): WeekSession[] {
  return sessions.filter(
    (session) =>
      session.dayType.countsTowardTarget && !session.dayType.isMatch,
  );
}

export function summarizeWeek(input: {
  weekStart: string;
  sessions: WeekSession[];
  baseTarget: number;
  dayTypes: WeekDayType[];
  override?: number | null;
  isCurrentWeek: boolean;
}): WeekSummary {
  const weekStart = startOfWeek(input.weekStart);
  const weekEnd = addDays(weekStart, 6);
  const sessions = sessionsInWeek(input.sessions, weekStart);
  const counted = countedSessions(sessions);
  const sessionsDone = counted.length;

  const targetInfo = computeWeekTarget({
    baseTarget: input.baseTarget,
    dayTypes: input.dayTypes,
    sessions,
    override: input.override,
  });

  const remaining = Math.max(0, targetInfo.target - sessionsDone);
  const status: WeekSummary["status"] =
    sessionsDone >= targetInfo.target
      ? "hit"
      : input.isCurrentWeek
        ? "to-go"
        : "missed";

  const entries = counted.flatMap((session) => session.entries);

  return {
    weekStart,
    weekEnd,
    target: targetInfo.target,
    baseTarget: targetInfo.baseTarget,
    isMatchWeek: targetInfo.isMatchWeek,
    skippedDayTypes: targetInfo.skippedDayTypes,
    sessionsDone,
    remaining,
    completionPct:
      targetInfo.target === 0
        ? 100
        : Math.round((sessionsDone / targetInfo.target) * 100),
    totalSets: totalSets(entries),
    totalVolume: totalVolume(entries),
    status,
  };
}

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function plannedDayTypesForDate<
  T extends { plannedWeekdays: number[]; archived?: boolean },
>(dayTypes: T[], dateString: string): T[] {
  const weekday = isoWeekday(dateString);
  return dayTypes.filter(
    (dayType) =>
      !dayType.archived && dayType.plannedWeekdays.includes(weekday),
  );
}
