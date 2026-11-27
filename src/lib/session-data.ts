import { formatDateOnly } from "@/lib/dates";
import type { WeekSession } from "@/lib/week";

type SessionForWeek = {
  date: Date;
  dayType: { countsTowardTarget: boolean; isMatch: boolean };
  entries: Array<{ sets: number; reps: number }>;
};

/** Maps Prisma session rows to the plain shape the week helpers expect. */
export function toWeekSessions(sessions: SessionForWeek[]): WeekSession[] {
  return sessions.map((session) => ({
    date: formatDateOnly(session.date),
    dayType: {
      countsTowardTarget: session.dayType.countsTowardTarget,
      isMatch: session.dayType.isMatch,
    },
    entries: session.entries.map((entry) => ({
      sets: entry.sets,
      reps: entry.reps,
    })),
  }));
}

export const weekSessionSelect = {
  date: true,
  dayType: { select: { countsTowardTarget: true, isMatch: true } },
  entries: { select: { sets: true, reps: true } },
} as const;
