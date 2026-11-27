import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Benchmarks"
        title="Progress"
        description="Track your own metrics and see how they change over time."
      />
      <div className="card px-4 py-5">
        <p className="text-sm leading-6 text-muted">
          Phase 2 adds dated benchmarks, per-metric summaries and trend charts
          with optional target ranges.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {["Start", "Latest", "Best", "Change"].map((label) => (
            <div
              key={label}
              className="rounded-xl border border-line bg-raised px-3 py-3"
            >
              <p className="text-xs text-muted">{label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-ink/40">
                —
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
