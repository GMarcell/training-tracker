"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProgramAiError, generateProgram } from "@/lib/program-ai";
import {
  generatedProgramSchema,
  normalizeGeneratedProgram,
  programRequestSchema,
  type GeneratedProgram,
  type ProgramRequest,
} from "@/lib/program-schema";
import {
  checkLimit,
  recordLimitHit,
  type LimitRule,
} from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";

/** Program generations per account per hour (each one calls a paid API). */
const PROGRAM_AI_RULE: LimitRule = { max: 10, windowMs: 60 * 60 * 1000 };

export type ProgramBuilderState =
  | {
      error?: string;
      fieldErrors?: Record<string, string[] | undefined>;
      program?: GeneratedProgram;
      input?: ProgramRequest;
    }
  | undefined;

export async function generateProgramAction(
  _state: ProgramBuilderState,
  formData: FormData,
): Promise<ProgramBuilderState> {
  const user = await requireUser();

  const limit = checkLimit("program-ai", user.id, PROGRAM_AI_RULE);
  if (!limit.allowed) {
    return {
      error: `Too many program generations. Try again in ${Math.ceil(
        limit.retryAfterSeconds / 60,
      )} minute(s).`,
    };
  }

  const parsed = programRequestSchema.safeParse({
    goal: formData.get("goal"),
    daysPerWeek: formData.get("daysPerWeek"),
    equipment: formData.get("equipment"),
    experience: formData.get("experience"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  recordLimitHit("program-ai", user.id, PROGRAM_AI_RULE);

  try {
    const program = await generateProgram(parsed.data);
    return { program, input: parsed.data };
  } catch (error) {
    if (error instanceof ProgramAiError) {
      return { error: error.message, input: parsed.data };
    }
    console.error("Unexpected program generation error", error);
    return {
      error: "Something went wrong while building your program. Please try again.",
      input: parsed.data,
    };
  }
}

/**
 * Persists a generated program for the signed-in user. The draft travels in a
 * hidden field, so it is re-validated here rather than trusted.
 */
export async function saveGeneratedProgramAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();

  const raw = formData.get("program");
  if (typeof raw !== "string") {
    redirect("/program/new?error=missing");
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    redirect("/program/new?error=invalid");
  }

  const parsed = generatedProgramSchema.safeParse(json);
  if (!parsed.success) {
    redirect("/program/new?error=invalid");
  }

  const program = normalizeGeneratedProgram(parsed.data);

  const [lastDayType, existingMetrics] = await Promise.all([
    prisma.dayType.findFirst({
      where: { userId: user.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    }),
    prisma.metric.findMany({
      where: { userId: user.id },
      select: { name: true },
    }),
  ]);

  const existingMetricNames = new Set(
    existingMetrics.map((metric) => metric.name.toLowerCase()),
  );
  const metricsToCreate = program.metrics.filter(
    (metric) => !existingMetricNames.has(metric.name.toLowerCase()),
  );

  const isFirstProgram = lastDayType == null;
  let sortOrder = (lastDayType?.sortOrder ?? -1) + 1;

  await prisma.$transaction(async (tx) => {
    for (const day of program.dayTypes) {
      await tx.dayType.create({
        data: {
          userId: user.id,
          name: day.name,
          kind: day.kind,
          plannedWeekdays: day.plannedWeekdays,
          countsTowardTarget: day.countsTowardTarget,
          skipInMatchWeek: day.skipInMatchWeek,
          isMatch: day.isMatch,
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

    for (const metric of metricsToCreate) {
      await tx.metric.create({
        data: {
          userId: user.id,
          name: metric.name,
          unit: metric.unit,
          direction: metric.direction,
          decimals: metric.decimals,
          targetMin: metric.targetMin ?? null,
          targetMax: metric.targetMax ?? null,
        },
      });
    }

    // Only adopt the AI's weekly target when this is the user's first program;
    // appending days should not silently change an existing target.
    if (isFirstProgram) {
      await tx.user.update({
        where: { id: user.id },
        data: { weeklyTarget: program.weeklyTarget },
      });
    }
  });

  revalidatePath("/program");
  revalidatePath("/");
  revalidatePath("/week");
  redirect("/program?created=1");
}
