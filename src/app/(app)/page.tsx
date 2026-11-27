import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProgressRing } from "@/components/progress-ring";
import { StartSessionForm } from "@/components/start-session-form";
import { addDays, parseDateOnly, startOfWeek, todayInTimeZone } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toWeekSessions, weekSessionSelect } from "@/lib/session-data";
import {
  plannedDayTypesForDate,
  summarizeWeek,
  totalSets,
  totalVolume,
} from "@/lib/week";

export const metadata = { title: "Today" };

export default async function TodayPage() {
  const user = await requireUser();
  const today = todayInTimeZone(user.timezone);
  const weekStart = startOfWeek(today);

  const [dayTypes, todaySession, weekSessions, override] = await Promise.all([
    prisma.dayType.findMany({
      where: { userId: user.id, archived: false },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        exercises: {
          where: { archived: false },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.session.findFirst({
      where: { userId: user.id, date: parseDateOnly(today) },
      include: {
        dayType: { select: { name: true, isMatch: true } },
        entries: { select: { sets: true, reps: true } },
      },
    }),
    prisma.session.findMany({
      where: {
        userId: user.id,
        date: {
          gte: parseDateOnly(weekStart),
          lte: parseDateOnly(addDays(weekStart, 6)),
        },
      },
      select: weekSessionSelect,
    }),
    prisma.weekTargetOverride.findUnique({
      where: {
        userId_weekStart: { userId: user.id, weekStart: parseDateOnly(weekStart) },
      },
      select: { target: true },
    }),
  ]);

  const summary = summarizeWeek({
    weekStart,
    sessions: toWeekSessions(weekSessions),
    baseTarget: user.weeklyTarget,
    dayTypes: dayTypes.map((dayType) => ({
      skipInMatchWeek: dayType.skipInMatchWeek,
      archived: dayType.archived,
    })),
    override: override?.target ?? null,
    isCurrentWeek: true,
  });

  const planned = plannedDayTypesForDate(dayTypes, today);
  const quickLogTypes = dayTypes.filter(
    (dayType) =>
      (dayType.kind === "ACTIVITY" || dayType.isMatch) &&
      !planned.some((plannedType) => plannedType.id === dayType.id),
  );

  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(parseDateOnly(today));

  const firstName = user.name.trim().split(/\s+/)[0];
  const empty = dayTypes.length === 0;

  return (
    <div>
      <p className="text-sm font-medium text-muted">{dateLabel}</p>
      <PageHeader
        title={`Hi ${firstName}`}
        description={
          empty
            ? "Your account is ready. Add a day type in Program to start planning."
            : "Log today's session, then let the week take care of itself."
        }
      />

      <section className="card flex items-center gap-4 px-4 py-4">
        <ProgressRing done={summary.sessionsDone} target={summary.target} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {summary.status === "hit" ? "Target hit" : "This week"}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {summary.status === "hit"
              ? `${summary.sessionsDone} sessions done. Everything else is a bonus.`
              : summary.remaining === 1
                ? "1 session to go."
                : `${summary.remaining} sessions to go.`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {summary.totalSets} sets · {summary.totalVolume} volume
            {summary.isMatchWeek
              ? ` · match-week target (${summary.skippedDayTypes} skipped)`
              : ""}
          </p>
          <Link
            href="/week"
            className="mt-2 inline-block text-xs font-semibold text-accent underline-offset-4 hover:underline"
          >
            View week
          </Link>
        </div>
      </section>

      <h2 className="mt-6 mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
        Today
      </h2>

      {todaySession ? (
        <section className="card px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Logged
              </p>
              <h3 className="mt-1 text-base font-semibold text-ink">
                {todaySession.dayType.name}
              </h3>
            </div>
            {todaySession.dayType.isMatch ? (
              <span className="rounded-md border border-line bg-raised px-1.5 py-0.5 text-[10px] font-medium text-muted">
                Match
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted">
            {todaySession.entries.length > 0
              ? `${totalSets(todaySession.entries)} sets · ${totalVolume(
                  todaySession.entries,
                )} volume`
              : "Activity logged"}
          </p>
          <Link
            href={`/log/${todaySession.id}`}
            className="tap mt-3 flex items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-strong"
          >
            Open log
          </Link>
        </section>
      ) : planned.length === 0 ? (
        <div className="card px-4 py-4 text-sm leading-6 text-muted">
          Nothing planned for today. Rest up, or quick-log a practice or match
          below.
        </div>
      ) : (
        <div className="space-y-3">
          {planned.map((dayType) => (
            <section key={dayType.id} className="card px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-ink">
                  {dayType.name}
                </h3>
                <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted">
                  {dayType.kind === "ACTIVITY" ? "Activity" : "Training"}
                </span>
              </div>

              {dayType.exercises.length > 0 ? (
                <ul className="mt-2.5 divide-y divide-line border-t border-line">
                  {dayType.exercises.map((exercise) => (
                    <li
                      key={exercise.id}
                      className="flex items-baseline justify-between gap-3 py-1.5"
                    >
                      <span className="text-sm text-ink">{exercise.name}</span>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
                        {exercise.targetText}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  Activity session — no exercises required.
                </p>
              )}

              <StartSessionForm
                dayTypeId={dayType.id}
                date={today}
                label={
                  dayType.kind === "ACTIVITY" ? "Quick log" : "Start session"
                }
                variant={dayType.kind === "ACTIVITY" ? "secondary" : "primary"}
              />
            </section>
          ))}
        </div>
      )}

      {!todaySession && quickLogTypes.length > 0 ? (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">
            Quick log
          </h2>
          <div className="space-y-2">
            {quickLogTypes.map((dayType) => (
              <StartSessionForm
                key={dayType.id}
                dayTypeId={dayType.id}
                date={today}
                label={dayType.name}
                variant="secondary"
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            Practice and match sessions can be logged on any day.
          </p>
        </section>
      ) : null}

      {todaySession ? (
        <p className="mt-4 text-center text-xs text-muted">
          One session per day — open it to edit sets or notes.
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-dashed border-line px-4 py-4">
        <h2 className="text-sm font-semibold text-ink">
          {user.weeklyTarget} sessions per week
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Your target is {user.weeklyTarget}. In a match week, day types marked
          skip-in-match-week are removed from the target automatically.
        </p>
      </section>
    </div>
  );
}
