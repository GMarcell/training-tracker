import { saveBenchmarkAction } from "@/app/actions/sessions";

export function BenchmarkForm({ date, metrics }: { date: string; metrics: Array<{ id: string; name: string; unit: string; decimals: number }> }) {
  return (
    <form action={saveBenchmarkAction} className="card space-y-3 px-4 py-4">
      <div><h2 className="text-sm font-semibold text-ink">Record benchmark</h2><p className="mt-1 text-xs text-muted">Leave metrics blank if you did not test them.</p></div>
      <input name="date" type="date" defaultValue={date} max={date} required className="field h-11 min-h-11 py-0" />
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => <label key={metric.id} className="text-xs text-muted">{metric.name} <span className="text-[10px]">({metric.unit})</span><input name={`value_${metric.id}`} type="number" step={metric.decimals === 0 ? "1" : "0.01"} min="0" placeholder="—" className="field mt-1 h-11 min-h-11 py-0" /></label>)}
      </div>
      <button type="submit" className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-ink hover:bg-accent-strong">Save benchmark</button>
    </form>
  );
}
