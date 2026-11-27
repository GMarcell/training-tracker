import { z } from "zod";

export const PROGRAM_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export const WEEKDAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export const generatedExerciseSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetText: z.string().trim().max(60).default(""),
});

export const generatedDayTypeSchema = z.object({
  name: z.string().trim().min(1).max(60),
  kind: z.enum(["TRAINING", "ACTIVITY"]).default("TRAINING"),
  plannedWeekdays: z
    .array(z.number().int().min(1).max(7))
    .max(7)
    .default([]),
  isMatch: z.boolean().default(false),
  skipInMatchWeek: z.boolean().default(false),
  countsTowardTarget: z.boolean().default(true),
  exercises: z.array(generatedExerciseSchema).max(15).default([]),
});

export const generatedMetricSchema = z.object({
  name: z.string().trim().min(1).max(60),
  unit: z.string().trim().min(1).max(20),
  direction: z
    .enum(["HIGHER_IS_BETTER", "LOWER_IS_BETTER", "NEUTRAL"])
    .default("HIGHER_IS_BETTER"),
  decimals: z.number().int().min(0).max(2).default(1),
  targetMin: z.number().nullable().optional(),
  targetMax: z.number().nullable().optional(),
});

export const generatedProgramSchema = z.object({
  name: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(400),
  weeklyTarget: z.number().int().min(1).max(14),
  dayTypes: z.array(generatedDayTypeSchema).min(1).max(7),
  metrics: z.array(generatedMetricSchema).max(8).default([]),
});

export type GeneratedExercise = z.infer<typeof generatedExerciseSchema>;
export type GeneratedDayType = z.infer<typeof generatedDayTypeSchema>;
export type GeneratedMetric = z.infer<typeof generatedMetricSchema>;
export type GeneratedProgram = z.infer<typeof generatedProgramSchema>;

export const programRequestSchema = z.object({
  goal: z
    .string()
    .trim()
    .min(10, "Describe your goal in a little more detail")
    .max(500, "Keep your goal under 500 characters"),
  daysPerWeek: z.coerce.number().int().min(1).max(7),
  equipment: z.enum(["bodyweight", "minimal", "full-gym"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  notes: z.string().trim().max(300).optional().default(""),
});

export type ProgramRequest = z.infer<typeof programRequestSchema>;

export const EQUIPMENT_LABELS: Record<ProgramRequest["equipment"], string> = {
  bodyweight: "Bodyweight / no equipment",
  minimal: "Minimal kit (bands, dumbbells)",
  "full-gym": "Full gym",
};

export const EXPERIENCE_LABELS: Record<ProgramRequest["experience"], string> = {
  beginner: "Beginner (under a year)",
  intermediate: "Intermediate (1–3 years)",
  advanced: "Advanced (3+ years)",
};

/**
 * Cleans a generated program before validation-independent use: weekdays are
 * deduplicated and sorted, and only the first match day is kept as a match.
 */
export function normalizeGeneratedProgram(
  program: GeneratedProgram,
): GeneratedProgram {
  let matchSeen = false;
  const dayTypes = program.dayTypes.map((day) => {
    const plannedWeekdays = [...new Set(day.plannedWeekdays)].sort(
      (a, b) => a - b,
    );
    const isMatch = day.isMatch && !matchSeen;
    if (isMatch) matchSeen = true;
    return {
      ...day,
      plannedWeekdays,
      isMatch,
      exercises: day.exercises,
    };
  });

  const metricNames = new Set<string>();
  const metrics = program.metrics.filter((metric) => {
    const key = metric.name.toLowerCase();
    if (metricNames.has(key)) return false;
    metricNames.add(key);
    return true;
  });

  return { ...program, dayTypes, metrics };
}
