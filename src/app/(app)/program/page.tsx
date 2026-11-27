import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Program" };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function ProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser();
  const { created } = await searchParams;

  const [dayTypes, metrics] = await Promise.all([
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
    prisma.metric.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Your setup"
        title="Program"
        description="Day types, their exercises and the metrics you track."
      />

      {created ? (
        <p className="mb-4 rounded-xl border border-accent/35 bg-accent/10 px-3.5 py-3 text-sm text-accent">
          Program added. Your new days and metrics are below.
        </p>
      ) : null}

      <Link
        href="/program/new"
        className="card mb-4 flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:border-accent/50"
      >
        <span>
          <span className="block text-sm font-semibold text-accent">
            Build a program with AI
          </span>
          <span className="mt-0.5 block text-xs leading-5 text-muted">
            Describe your goal and get a full week of training drafted by Groq.
          </span>
        </span>
        <span aria-hidden="true" className="text-lg text-muted">
          →
        </span>
      </Link>

      {dayTypes.length === 0 ? (
        <div className="card px-4 py-5 text-sm leading-6 text-muted">
          No day types yet. Program editing is coming next; your account starts
          blank because you chose the Blank template.
        </div>
      ) : (
        <div className="space-y-3">
          {dayTypes.map((dayType) => (
            <section key={dayType.id} className="card px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-ink">
                  {dayType.name}
                </h2>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                  {dayType.isMatch ? <Badge>Match</Badge> : null}
                  {dayType.skipInMatchWeek ? <Badge>Skip in match week</Badge> : null}
                  {!dayType.countsTowardTarget ? <Badge>Not counted</Badge> : null}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-muted">
                  {dayType.kind === "ACTIVITY" ? "Activity" : "Training"}
                </span>
                <span aria-hidden="true" className="text-muted">
                  ·
                </span>
                {dayType.plannedWeekdays.length === 0 ? (
                  <span className="text-xs text-muted">No planned days</span>
                ) : (
                  WEEKDAYS.map((label, index) =>
                    dayType.plannedWeekdays.includes(index + 1) ? (
                      <span
                        key={label}
                        className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-semibold text-accent"
                      >
                        {label}
                      </span>
                    ) : null,
                  )
                )}
              </div>

              {dayType.exercises.length > 0 ? (
                <ol className="mt-3 divide-y divide-line border-t border-line">
                  {dayType.exercises.map((exercise) => (
                    <li
                      key={exercise.id}
                      className="flex items-baseline justify-between gap-3 py-2"
                    >
                      <span className="text-sm text-ink">{exercise.name}</span>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
                        {exercise.targetText}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
                  Activity session — no exercises required.
                </p>
              )}
            </section>
          ))}
        </div>
      )}

      <section className="card mt-4 px-4 py-4">
        <h2 className="text-sm font-semibold text-ink">Metrics</h2>
        {metrics.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No metrics yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {metrics.map((metric) => (
              <li
                key={metric.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="text-sm text-ink">{metric.name}</span>
                <span className="text-xs text-muted">
                  {metric.unit} · {metric.decimals} dp
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-4 text-center text-xs text-muted">
        Editing and reordering arrives with the Program management phase.
      </p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-line bg-raised px-1.5 py-0.5 text-[10px] font-medium text-muted">
      {children}
    </span>
  );
}
