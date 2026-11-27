import { z } from "zod";
import { isValidDateOnly } from "@/lib/dates";

const id = z.string().trim().min(1).max(64);
const calendarDate = z
  .string()
  .refine(isValidDateOnly, "Choose a valid date");

export const startSessionSchema = z.object({
  dayTypeId: id,
  date: calendarDate,
});

export const saveEntrySchema = z.object({
  entryId: id,
  sets: z.coerce.number().int().min(0).max(999),
  reps: z.coerce.number().int().min(0).max(9999),
});

export const sessionNotesSchema = z.object({
  sessionId: id,
  notes: z.string().trim().max(1000, "Notes are too long"),
});

export const sessionIdSchema = z.object({ sessionId: id });

export const weekTargetSchema = z.object({
  weekStart: calendarDate,
  target: z.coerce.number().int().min(0).max(30),
});

export type StartSessionState = { error?: string } | undefined;
export type SaveResult = { ok: true } | { ok: false; error: string };
