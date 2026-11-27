import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedTemplate } from "../src/lib/seed";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demo1234";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

/** Parses "4 x 6" / "3 x 10 each leg" into sets and reps, with a safe fallback. */
function parseTarget(targetText: string): { sets: number; reps: number } {
  const match = targetText.match(/(\d+)\s*x\s*(\d+)/i);
  if (!match) return { sets: 3, reps: 10 };
  return { sets: Number(match[1]), reps: Number(match[2]) };
}

/** UTC midnight for the given calendar date, matching the @db.Date columns. */
function utcDate(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** Monday of the week containing `date`. */
function mondayOf(date: Date): Date {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diff),
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

async function main(): Promise<void> {
  const passwordHash = await hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: "Demo Athlete",
      passwordHash,
      weeklyTarget: 5,
    },
  });

  // Seed the starter program only if the account has no day types yet.
  const dayTypeCount = await prisma.dayType.count({ where: { userId: user.id } });
  if (dayTypeCount === 0) {
    await seedTemplate(prisma, user.id, "rugby-sevens");
  }

  const dayTypes = await prisma.dayType.findMany({
    where: { userId: user.id, archived: false },
    include: { exercises: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  const sessionCount = await prisma.session.count({
    where: { userId: user.id },
  });

  if (sessionCount === 0) {
    const today = utcDate(new Date());
    const thisMonday = mondayOf(today);
    const trainingDays = dayTypes.filter((day) => day.kind === "TRAINING");
    const activityDays = dayTypes.filter((day) => day.kind === "ACTIVITY");

    // Six past weeks plus the current one, matching each day type's weekdays.
    for (let weekOffset = 6; weekOffset >= 0; weekOffset -= 1) {
      const weekMonday = addDays(thisMonday, -7 * weekOffset);

      for (const dayType of trainingDays) {
        const weekday = dayType.plannedWeekdays[0];
        if (weekday === undefined) continue;

        const date = addDays(weekMonday, weekday - 1);
        if (date > today) continue;

        await prisma.session.create({
          data: {
            userId: user.id,
            dayTypeId: dayType.id,
            date,
            notes:
              weekOffset === 0 ? "Felt strong today." : "Session logged.",
            entries: {
              create: dayType.exercises.map((exercise, index) => {
                const { sets, reps } = parseTarget(exercise.targetText);
                return {
                  exerciseId: exercise.id,
                  name: exercise.name,
                  sets,
                  reps,
                  unit: "REPS" as const,
                  sortOrder: index,
                };
              }),
            },
          },
        });
      }

      // One activity (practice) day per week, at most two weeks old.
      const practice = activityDays.find((day) => !day.isMatch);
      if (practice && weekOffset <= 1) {
        const weekday = practice.plannedWeekdays[0];
        if (weekday !== undefined) {
          const date = addDays(weekMonday, weekday - 1);
          if (date <= today) {
            await prisma.session.create({
              data: {
                userId: user.id,
                dayTypeId: practice.id,
                date,
                notes: "Team practice.",
              },
            });
          }
        }
      }
    }
  }

  // The Week report hides weeks from before the account existed, so backdate
  // the demo account to its earliest session to show the full history.
  const earliest = await prisma.session.findFirst({
    where: { userId: user.id },
    orderBy: { date: "asc" },
    select: { date: true },
  });
  if (earliest && earliest.date < user.createdAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { createdAt: earliest.date },
    });
  }

  const totals = await prisma.session.count({ where: { userId: user.id } });
  console.log(
    `Seeded ${DEMO_EMAIL} (password: ${DEMO_PASSWORD}) with ${totals} sessions across ${dayTypes.length} day types.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
