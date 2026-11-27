import { formatDateOnly } from "@/lib/dates";
/* eslint-disable react-hooks/purity */

export function ServerGoalCountdown({ goalName, goalDate }: { goalName: string | null; goalDate: Date | null }) {
  if (!goalName || !goalDate) return null;
  const days = Math.max(0, Math.ceil((goalDate.getTime() - Date.now()) / 86400000));
  return <section className="card mt-3 flex items-center justify-between gap-4 px-4 py-3.5"><div><p className="text-xs font-semibold uppercase tracking-wider text-accent">Goal countdown</p><p className="mt-1 text-sm text-muted">{goalName} · {formatDateOnly(goalDate)}</p></div><p className="text-right text-2xl font-semibold tabular-nums text-ink">{days}<span className="ml-1 text-xs font-medium text-muted">days</span></p></section>;
}
