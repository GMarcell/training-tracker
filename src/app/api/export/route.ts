import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDateOnly } from "@/lib/dates";

function csv(value: unknown): string { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }

export async function GET() {
  const user = await requireUser();
  const [sessions, benchmarks] = await Promise.all([
    prisma.session.findMany({ where: { userId: user.id }, orderBy: { date: "asc" }, include: { entries: true } }),
    prisma.benchmark.findMany({ where: { userId: user.id }, orderBy: { date: "asc" }, include: { values: { include: { metric: true } } } }),
  ]);
  const rows = ["type,date,name,value,unit,sets,reps,notes"];
  for (const session of sessions) for (const entry of session.entries) rows.push(["session", formatDateOnly(session.date), entry.name, "", entry.unit, entry.sets, entry.reps, session.notes ?? ""].map(csv).join(","));
  for (const benchmark of benchmarks) for (const value of benchmark.values) rows.push(["benchmark", formatDateOnly(benchmark.date), value.metric.name, value.value, value.metric.unit, "", "", ""].map(csv).join(","));
  return new Response(rows.join("\n") + "\n", { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="training-tracker.csv"' } });
}
