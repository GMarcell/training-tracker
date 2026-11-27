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
  benchmarkDateSchema,
  type SaveResult,
  type StartSessionState,
} from "@/lib/session-validation";
import { requireUser } from "@/lib/session";
import { parseTarget } from "@/lib/targets";

function revalidateSessionViews(): void {
  revalidatePath("/");
  revalidatePath("/week");
}

const DEFAULT_PRACTICE_MENU = [
  { name: "Warm-up + mobility", targetText: "1 x 10 min" },
  { name: "Skill / team drills", targetText: "4 x 8 min" },
  { name: "Conditioning games", targetText: "4 x 3 min" },
  { name: "Cooldown", targetText: "1 x 5 min" },
];

const DEFAULT_MATCH_MENU = [
  { name: "Warm-up", targetText: "1 x 15 min" },
  { name: "Match", targetText: "1 x 80 min" },
  { name: "Cooldown + recovery", targetText: "1 x 10 min" },
];

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
      kind: true,
      isMatch: true,
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
    const menu =
      dayType.exercises.length > 0
        ? dayType.exercises
        : dayType.kind === "ACTIVITY"
          ? dayType.isMatch
            ? DEFAULT_MATCH_MENU
            : DEFAULT_PRACTICE_MENU
          : dayType.exercises;
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        dayTypeId: dayType.id,
        date: calendarDate,
        entries: {
          create: menu.map((exercise, index) => {
            const target = parseTarget(exercise.targetText);
            return {
              exerciseId: "id" in exercise ? exercise.id : undefined,
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

/** Updates the recurring weekdays for one of the user's program day types. */
export async function updateDayTypeScheduleAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const dayTypeId = formData.get("dayTypeId");
  const weekdays = formData
    .getAll("weekdays")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 7);

  if (typeof dayTypeId !== "string") return;

  await prisma.dayType.updateMany({
    where: { id: dayTypeId, userId: user.id, archived: false },
    data: { plannedWeekdays: [...new Set(weekdays)].sort((a, b) => a - b) },
  });

  revalidatePath("/program");
  revalidatePath("/");
  revalidatePath("/week");
}

export async function saveBenchmarkAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = benchmarkDateSchema.safeParse({ date: formData.get("date") });
  if (!parsed.success) return;
  const metrics = await prisma.metric.findMany({ where: { userId: user.id }, select: { id: true } });
  const values = metrics.flatMap((metric) => {
    const raw = formData.get(`value_${metric.id}`);
    if (typeof raw !== "string" || raw.trim() === "") return [];
    const value = Number(raw);
    return Number.isFinite(value) ? [{ metricId: metric.id, value }] : [];
  });
  if (values.length === 0) return;
  const date = parseDateOnly(parsed.data.date);
  await prisma.benchmark.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, values: { create: values } },
    update: { values: { deleteMany: {}, create: values } },
  });
  revalidatePath("/progress");
}

export async function savePhaseFourSettingsAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const goalName = String(formData.get("goalName") ?? "").trim().slice(0, 120) || null;
  const goalDateRaw = String(formData.get("goalDate") ?? "");
  const reminderTime = String(formData.get("reminderTime") ?? "").trim().slice(0, 5) || null;
  const goalDate = /^\d{4}-\d{2}-\d{2}$/.test(goalDateRaw) ? parseDateOnly(goalDateRaw) : null;
  await prisma.user.update({ where: { id: user.id }, data: { goalName, goalDate, reminderTime } });
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function saveNutritionLogAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const dateRaw = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) return;
  const number = (name: string) => { const value = Number(formData.get(name)); return Number.isFinite(value) && value >= 0 ? value : null; };
  await prisma.nutritionLog.upsert({
    where: { userId_date: { userId: user.id, date: parseDateOnly(dateRaw) } },
    create: { userId: user.id, date: parseDateOnly(dateRaw), waterLiters: number("water"), proteinGrams: number("protein"), calories: number("calories") === null ? null : Math.round(number("calories") as number) },
    update: { waterLiters: number("water"), proteinGrams: number("protein"), calories: number("calories") === null ? null : Math.round(number("calories") as number) },
  });
  revalidatePath("/settings");
}
