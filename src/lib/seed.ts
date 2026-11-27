import type { Prisma } from "@/generated/prisma/client";
import { getTemplate, type TemplateId } from "@/lib/templates";

/**
 * Creates the starter day types, exercises and metrics for a newly registered
 * user. Runs inside the registration transaction.
 */
export async function seedTemplate(
  tx: Prisma.TransactionClient,
  userId: string,
  templateId: TemplateId,
): Promise<void> {
  const template = getTemplate(templateId);

  let sortOrder = 0;
  for (const day of template.dayTypes) {
    await tx.dayType.create({
      data: {
        userId,
        name: day.name,
        kind: day.kind,
        plannedWeekdays: day.plannedWeekdays,
        countsTowardTarget: day.countsTowardTarget ?? true,
        skipInMatchWeek: day.skipInMatchWeek ?? false,
        isMatch: day.isMatch ?? false,
        sortOrder: sortOrder++,
        exercises: {
          create: day.exercises.map((exercise, index) => ({
            name: exercise.name,
            targetText: exercise.targetText,
            sortOrder: index,
          })),
        },
      },
    });
  }

  for (const metric of template.metrics) {
    await tx.metric.create({
      data: {
        userId,
        name: metric.name,
        unit: metric.unit,
        direction: metric.direction,
        decimals: metric.decimals,
        targetMin: metric.targetMin ?? null,
        targetMax: metric.targetMax ?? null,
      },
    });
  }
}
