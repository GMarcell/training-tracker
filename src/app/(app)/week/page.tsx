import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProgressRing } from "@/components/progress-ring";
import { WeekChart } from "@/components/week-chart";
import {
  addDays,
  formatDateOnly,
  formatShortDate,
  isValidDateOnly,
  parseDateOnly,
  startOfWeek,
  todayInTimeZone,
} from "@/lib/dates";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  clearWeekTargetAction,
  setWeekTargetAction,
} from "@/app/actions/sessions";
import { toWeekSessions } from "@/lib/session-data";
import { percentChange, summarizeWeek } from "@/lib/week";

export const metadata = { title: "Week" };

const HISTORY_WEEKS = 12;

const statusLabel = {
  hit: "Target hit",
  "to-go": "To go",
  missed: "Missed",
} as const;

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const today = todayInTimeZone(user.timezone);
  const currentWeekStart = startOfWeek(today);
  const accountWeekStart = startOfWeek(
    todayInTimeZone(user.timezone, user.createdAt),
  );
  const requestedWeekStart =
    params.week && isValidDateOnly(params.week)
      ? startOfWeek(params.week)
      : currentWeekStart;
  // Never report weeks from before the account existed as "missed".
  const selectedWeekStart =
    requestedWeekStart < accountWeekStart
      ? accountWeekStart
      : requestedWeekStart;
  const maxWindowStart = addDays(
    selectedWeekStart,
    -(HISTORY_WEEKS - 1) * 7,
  );
  const windowStart =
    maxWindowStart > accountWeekStart ? maxWindowStart : accountWeekStart;

  const [dayTypes, sessions, overrides] = await Promise.all([
    prisma.dayType.findMany({
      where: { userId: user.id },
      select: { skipInMatchWeek: true, archived: true },
    }),
    prisma.session.findMany({
      where: {
        userId: user.id,
        date: {
          gte: parseDateOnly(windowStart),
          lte: parseDateOnly(addDays(selectedWeekStart, 6)),
        },
      },
      select: {
        date: true,
        dayType: { select: { countsTowardTarget: true, isMatch: true } },
        entries: { select: { sets: true, reps: true } },
      },
    }),
    prisma.weekTargetOverride.findMany({
      where: {
        userId: user.id,
        weekStart: {
          gte: parseDateOnly(windowStart),
          lte: parseDateOnly(selectedWeekStart),
        },
      },
      select: { weekStart: true, target: true },
    }),
  ]);

  const weekSessions = toWeekSessions(sessions);
  const overrideByWeek = new Map(
    overrides.map((override) => [
      formatDateOnly(override.weekStart),
      override.target,
    ]),
  );

  const weekStarts: string[] = [];
  for (
    let weekStart = windowStart;
    weekStart <= selectedWeekStart;
    weekStart = addDays(weekStart, 7)
  ) {
    weekStarts.push(weekStart);
  }

  const summaries = weekStarts.map((weekStart) =>
    summarizeWeek({
      weekStart,
      sessions: weekSessions,
      baseTarget: user.weeklyTarget,
      dayTypes,
      override: overrideByWeek.get(weekStart) ?? null,
      isCurrentWeek: weekStart === currentWeekStart,
    }),
  );

  const report = summaries[summaries.length - 1];
  const previous = summaries[summaries.length - 2];
  const selectedOverride = overrideByWeek.get(report.weekStart) ?? null;
  const nextWeek = addDays(selectedWeekStart, 7);
  const canGoNext = nextWeek <= currentWeekStart;
  const canGoPrev = selectedWeekStart > accountWeekStart;

  const chartData = summaries.map((summary) => ({
    label: formatShortDate(summary.weekStart),
    sessions: summary.sessionsDone,
    target: summary.target,
  }));

  const history = summaries
    .slice(0, -1)
    .map((summary, index, list) => ({
      summary,
      change:
        index === 0
          ? null
          : percentChange(
              summary.totalVolume,
              list[index - 1].totalVolume,
            ),
    }))
    .reverse();

  return (
    <div>
      <PageHeader
        eyebrow="Weekly report"
        title="Week"
        description="Sessions against target, volume, and how the last 12 weeks compare."
      />

      <div className="mb-3 flex items-center justify-between gap-3">
        {canGoPrev ? (
          <Link
            href={`/week?week=${addDays(selectedWeekStart, -7)}`}
            aria-label="Previous week"
            className="tap flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-lg text-ink transition-colors hover:border-accent/50"
          >
            <span aria-hidden="true">←</span>
          </Link>
        ) : (
          <span
            aria-hidden="true"
            className="tap flex h-10 w-10 items-center justify-center rounded-full border border-line/50 text-lg text-muted/40"
          >
            ←
          </span>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold text-ink">
            {formatShortDate(report.weekStart)} –{" "}
            {formatShortDate(report.weekEnd)}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
            {selectedWeekStart === currentWeekStart ? "This week" : "Selected week"}
          </p>
        </div>
        {canGoNext ? (
          <Link
            href={`/week?week=${nextWeek}`}
            aria-label="Next week"
            className="tap flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel text-lg text-ink transition-colors hover:border-accent/50"
          >
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span
            aria-hidden="true"
            className="tap flex h-10 w-10 items-center justify-center rounded-full border border-line/50 text-lg text-muted/40"
          >
            →
          </span>
        )}
      </div>

      <section className="card px-4 py-4">
        <div className="flex items-center gap-4">
          <ProgressRing done={report.sessionsDone} target={report.target} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                {report.sessionsDone} of {report.target} sessions
              </p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  report.status === "hit"
                    ? "bg-accent/15 text-accent"
                    : report.status === "to-go"
                      ? "bg-warning/10 text-warning"
                      : "bg-danger/10 text-danger"
                }`}
              >
                {statusLabel[report.status]}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              {report.completionPct}% complete
              {report.status === "to-go"
                ? ` · ${report.remaining} to go`
                : report.status === "missed"
                  ? ` · ${report.remaining} short`
                  : ""}
            </p>
            <p className="mt-1 text-xs text-muted">
              {report.totalSets} sets · {report.totalVolume} volume
              {previous
                ? ` · ${describeChange(
                    percentChange(report.totalVolume, previous.totalVolume),
                  )}`
                : ""}
            </p>
            {report.isMatchWeek ? (
              <p className="mt-2 rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[11px] leading-4 text-muted">
                Match week — target reduced by {report.skippedDayTypes} skipped
                day type{report.skippedDayTypes === 1 ? "" : "s"}.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 border-t border-line pt-3">
          <Stat label="Done" value={String(report.sessionsDone)} />
          <Stat label="Target" value={String(report.target)} />
          <Stat label="Sets" value={String(report.totalSets)} />
          <Stat label="Volume" value={String(report.totalVolume)} />
        </div>

        <form
          action={setWeekTargetAction}
          className="mt-4 flex items-end gap-2 border-t border-line pt-3"
        >
          <input type="hidden" name="weekStart" value={report.weekStart} />
          <label className="flex-1 text-xs font-medium text-muted">
            Weekly target
            <input
              type="number"
              name="target"
              min={0}
              max={30}
              defaultValue={report.target}
              className="field mt-1 h-11 min-h-11 py-0"
            />
          </label>
          <button
            type="submit"
            className="tap h-11 rounded-xl border border-line bg-raised px-4 text-sm font-semibold text-ink transition-colors hover:border-accent/50"
          >
            Set
          </button>
          {selectedOverride != null ? (
            <ClearOverrideButton />
          ) : null}
        </form>
        {selectedOverride != null ? (
          <p className="mt-2 text-[11px] text-muted">
            Custom target for this week. Clear it to use your base target.
          </p>
        ) : null}
      </section>

      <section className="card mt-4 px-4 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Sessions per week</h2>
          <span className="text-xs text-muted">
            Last {summaries.length} week{summaries.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-3">
          <WeekChart data={chartData} />
        </div>
        <p className="mt-2 text-[11px] text-muted">
          Bars are counted sessions; the dashed line is each week&apos;s target
          after match-week adjustments and overrides.
        </p>
      </section>

      {history.length > 0 ? (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">
            Week history
          </h2>
          <div className="card divide-y divide-line px-4">
            {history.map(({ summary, change }) => (
              <Link
                key={summary.weekStart}
                href={`/week?week=${summary.weekStart}`}
                className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-accent"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {formatShortDate(summary.weekStart)} –{" "}
                    {formatShortDate(summary.weekEnd)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {summary.sessionsDone}/{summary.target} sessions ·{" "}
                    {summary.totalVolume} volume
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`block text-[10px] font-semibold uppercase tracking-wider ${
                      summary.status === "hit"
                        ? "text-accent"
                        : summary.status === "missed"
                          ? "text-danger"
                          : "text-muted"
                    }`}
                  >
                    {statusLabel[summary.status]}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    {describeChange(change)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}

function describeChange(change: number | null): string {
  if (change == null) return "No earlier volume";
  if (change === 0) return "No volume change";
  return `${change > 0 ? "+" : ""}${change}% volume`;
}

function ClearOverrideButton() {
  return (
    <button
      type="submit"
      formAction={clearWeekTargetAction}
      className="tap h-11 rounded-xl border border-line px-3 text-sm font-medium text-muted transition-colors hover:border-danger/50 hover:text-danger"
    >
      Clear
    </button>
  );
}
