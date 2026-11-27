import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteSessionForm } from "@/components/delete-session-form";
import { SessionLogger } from "@/components/session-logger";
import { formatDateOnly, parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Log session" };

export default async function LogSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const session = await prisma.session.findFirst({
    where: { id, userId: user.id },
    include: {
      dayType: {
        select: { name: true, kind: true, isMatch: true, countsTowardTarget: true },
      },
      entries: {
        orderBy: { sortOrder: "asc" },
        include: { exercise: { select: { targetText: true } } },
      },
    },
  });

  if (!session) notFound();

  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(parseDateOnly(formatDateOnly(session.date)));

  return (
    <div>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        <span aria-hidden="true">←</span> Today
      </Link>

      <p className="text-sm font-medium text-muted">{dateLabel}</p>
      <div className="mt-0.5 mb-5 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {session.dayType.name}
        </h1>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5 pt-1.5">
          {session.dayType.isMatch ? (
            <span className="rounded-md border border-line bg-raised px-1.5 py-0.5 text-[10px] font-medium text-muted">
              Match
            </span>
          ) : null}
          {!session.dayType.countsTowardTarget ? (
            <span className="rounded-md border border-line bg-raised px-1.5 py-0.5 text-[10px] font-medium text-muted">
              Not counted
            </span>
          ) : null}
        </div>
      </div>

      <SessionLogger
        sessionId={session.id}
        initialNotes={session.notes ?? ""}
        entries={session.entries.map((entry) => ({
          id: entry.id,
          name: entry.name,
          targetText: entry.exercise?.targetText ?? "",
          sets: entry.sets,
          reps: entry.reps,
          unit: entry.unit,
        }))}
      />

      <div className="mt-8">
        <DeleteSessionForm sessionId={session.id} />
      </div>
    </div>
  );
}
