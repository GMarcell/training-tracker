import { prisma } from "@/lib/db";
import { parseDateOnly, isValidDateOnly } from "@/lib/dates";
import { requireUser } from "@/lib/session";

function fields(line: string): string[] { return line.split(",").map((value) => value.trim().replace(/^"|"$/g, "").replaceAll('""', '"')); }

export async function POST(request: Request) {
  const user = await requireUser();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.redirect(new URL("/settings?import=missing", request.url));
  const lines = (await file.text()).split(/\r?\n/).filter(Boolean).slice(1);
  const metrics = await prisma.metric.findMany({ where: { userId: user.id }, select: { id: true, name: true } });
  const metricMap = new Map(metrics.map((metric) => [metric.name.toLowerCase(), metric.id]));
  for (const line of lines) {
    const [type, date, name, rawValue] = fields(line);
    if (type !== "benchmark" || !isValidDateOnly(date)) continue;
    const metricId = metricMap.get(name.toLowerCase());
    const value = Number(rawValue);
    if (!metricId || !Number.isFinite(value)) continue;
    const benchmark = await prisma.benchmark.upsert({ where: { userId_date: { userId: user.id, date: parseDateOnly(date) } }, create: { userId: user.id, date: parseDateOnly(date) }, update: {} });
    await prisma.benchmarkValue.upsert({ where: { benchmarkId_metricId: { benchmarkId: benchmark.id, metricId } }, create: { benchmarkId: benchmark.id, metricId, value }, update: { value } });
  }
  return Response.redirect(new URL("/progress?import=1", request.url));
}
