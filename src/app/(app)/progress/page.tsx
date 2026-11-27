import { BenchmarkChart } from "@/components/benchmark-chart";
import { BenchmarkForm } from "@/components/benchmark-form";
import { PageHeader } from "@/components/page-header";
import { formatDateOnly, todayInTimeZone } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const user = await requireUser();
  const [metrics, benchmarks] = await Promise.all([
    prisma.metric.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.benchmark.findMany({ where: { userId: user.id }, orderBy: { date: "asc" }, take: 100, include: { values: true } }),
  ]);

  return <div>
    <PageHeader eyebrow="Benchmarks" title="Progress" description="Record benchmarks and see how they change over time." />
    {metrics.length === 0 ? <div className="card px-4 py-5 text-sm leading-6 text-muted">Add metrics in your program first, then return here to record progress.</div> : <>
      <BenchmarkForm date={todayInTimeZone(user.timezone)} metrics={metrics} />
      <div className="mt-4 space-y-3">{metrics.map((metric) => {
        const points = benchmarks.flatMap((benchmark) => { const value = benchmark.values.find((item) => item.metricId === metric.id); return value ? [{ date: formatDateOnly(benchmark.date).slice(5), value: Number(value.value) }] : []; });
        const values = points.map((point) => point.value); const latest = values.at(-1); const start = values[0];
        const best = values.length ? (metric.direction === "LOWER_IS_BETTER" ? Math.min(...values) : Math.max(...values)) : undefined;
        const change = latest !== undefined && start !== undefined ? latest - start : undefined;
        return <section key={metric.id} className="card px-4 py-4">
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-ink">{metric.name}</h2><p className="text-xs text-muted">{metric.unit}</p></div><p className="text-xl font-semibold tabular-nums text-ink">{latest ?? "—"}</p></div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs"><Stat label="Start" value={start} /><Stat label="Best" value={best} /><Stat label="Change" value={change === undefined ? undefined : `${change > 0 ? "+" : ""}${change}`} /></div>
          {points.length > 1 ? <BenchmarkChart data={points} unit={metric.unit} /> : <p className="mt-4 text-xs text-muted">Add another benchmark to see a trend chart.</p>}
        </section>;
      })}</div>
    </>}
  </div>;
}

function Stat({ label, value }: { label: string; value?: number | string }) {
  return <div className="rounded-lg bg-raised px-2.5 py-2"><p className="text-muted">{label}</p><p className="mt-1 font-semibold tabular-nums text-ink">{value ?? "—"}</p></div>;
}
