"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseDateOnly, startOfWeek } from "@/lib/dates";
import { prisma } from "@/lib/db";
import {
  saveEntrySchema,
  sessionIdSchema,
  sessionNotesSchema,
  startSessionSchema,
  weekTargetSchema,
  type SaveResult,
  type StartSessionState,
} from "@/lib/session-validation";
import { requireUser } from "@/lib/session";
import { parseTarget } from "@/lib/targets";

function revalidateSessionViews(): void {
  revalidatePath("/");
  revalidatePath("/week");
}

/**
 * Starts (or quick-logs) a session for a calendar date. One session per date is
 * enforced by the schema, so an existing session is reported instead of
 * overwritten.
 */
export async function startSessionAction(
  _state: StartSessionState,
  formData: FormData,
): Promise<StartSessionState> {
  const user = await requireUser();
  const parsed = startSessionSchema.safeParse({
    dayTypeId: formData.get("dayTypeId"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { error: "That session could not be started. Please try again." };
  }

  const { dayTypeId, date } = parsed.data;

  const dayType = await prisma.dayType.findFirst({
    where: { id: dayTypeId, userId: user.id, archived: false },
    select: {
      id: true,
      exercises: {
        where: { archived: false },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, targetText: true },
      },
    },
  });

  if (!dayType) {
    return { error: "That day type is no longer available." };
  }

  const calendarDate = parseDateOnly(date);
  const existing = await prisma.session.findFirst({
    where: { userId: user.id, date: calendarDate },
    select: { id: true },
  });

  if (existing) {
    return {
      error: "You already have a session for that day. Open it to make changes.",
    };
  }

  let sessionId: string;
  try {
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        dayTypeId: dayType.id,
        date: calendarDate,
        entries: {
          create: dayType.exercises.map((exercise, index) => {
            const target = parseTarget(exercise.targetText);
            return {
              exerciseId: exercise.id,
              name: exercise.name,
              sets: target.sets,
              reps: target.reps,
              unit: target.unit,
              sortOrder: index,
            };
          }),
        },
      },
      select: { id: true },
    });
    sessionId = session.id;
  } catch {
    return { error: "We could not start that session. Please try again." };
  }

  revalidateSessionViews();
  redirect(`/log/${sessionId}`);
}

/** Autosave for one exercise entry; scoped to the signed-in user's sessions. */
export async function saveEntryAction(input: {
  entryId: string;
  sets: number;
  reps: number;
}): Promise<SaveResult> {
  const user = await requireUser();
  const parsed = saveEntrySchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Those values are not valid." };
  }

  const entry = await prisma.exerciseEntry.findFirst({
    where: { id: parsed.data.entryId, session: { userId: user.id } },
    select: { id: true },
  });

  if (!entry) {
    return { ok: false, error: "That exercise is no longer available." };
  }

  await prisma.exerciseEntry.update({
    where: { id: entry.id },
    data: { sets: parsed.data.sets, reps: parsed.data.reps },
  });

  revalidateSessionViews();
  return { ok: true };
}

/** Autosave for the session note; scoped to the signed-in user. */
export async function saveSessionNotesAction(input: {
  sessionId: string;
  notes: string;
}): Promise<SaveResult> {
  const user = await requireUser();
  const parsed = sessionNotesSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Notes must be 1000 characters or fewer." };
  }

  const updated = await prisma.session.updateMany({
    where: { id: parsed.data.sessionId, userId: user.id },
    data: { notes: parsed.data.notes || null },
  });

  if (updated.count === 0) {
    return { ok: false, error: "That session is no longer available." };
  }

  revalidateSessionViews();
  return { ok: true };
}

export async function deleteSessionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = sessionIdSchema.safeParse({
    sessionId: formData.get("sessionId"),
  });

  if (parsed.success) {
    await prisma.session.deleteMany({
      where: { id: parsed.data.sessionId, userId: user.id },
    });
    revalidateSessionViews();
  }

  redirect("/");
}

/** Sets or replaces the weekly target for one week (Monday-normalized). */
export async function setWeekTargetAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = weekTargetSchema.safeParse({
    weekStart: formData.get("weekStart"),
    target: formData.get("target"),
  });

  if (!parsed.success) return;

  const weekStart = parseDateOnly(startOfWeek(parsed.data.weekStart));

  await prisma.weekTargetOverride.upsert({
    where: { userId_weekStart: { userId: user.id, weekStart } },
    create: { userId: user.id, weekStart, target: parsed.data.target },
    update: { target: parsed.data.target },
  });

  revalidateSessionViews();
}

/** Removes a per-week override so the week falls back to the base target. */
export async function clearWeekTargetAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = weekTargetSchema
    .pick({ weekStart: true })
    .safeParse({ weekStart: formData.get("weekStart") });

  if (!parsed.success) return;

  const weekStart = parseDateOnly(startOfWeek(parsed.data.weekStart));

  await prisma.weekTargetOverride.deleteMany({
    where: { userId: user.id, weekStart },
  });

  revalidateSessionViews();
}
