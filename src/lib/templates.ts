import type { DayKind, Direction } from "@/generated/prisma/client";

export type TemplateId = "rugby-sevens" | "blank";

export type TemplateExercise = {
  name: string;
  targetText: string;
};

export type TemplateDayType = {
  name: string;
  kind: DayKind;
  plannedWeekdays: number[];
  countsTowardTarget?: boolean;
  skipInMatchWeek?: boolean;
  isMatch?: boolean;
  exercises: TemplateExercise[];
};

export type TemplateMetric = {
  name: string;
  unit: string;
  direction: Direction;
  decimals: number;
  targetMin?: number;
  targetMax?: number;
};

export type StarterTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  dayTypes: TemplateDayType[];
  metrics: TemplateMetric[];
};

export const RUGBY_SEVENS: StarterTemplate = {
  id: "rugby-sevens",
  name: "Rugby sevens (no equipment)",
  description:
    "A 3-day bodyweight strength and power program with practice and match days.",
  dayTypes: [
    {
      name: "Day 1 - Lower",
      kind: "TRAINING",
      plannedWeekdays: [1],
      exercises: [
        { name: "Jump squats", targetText: "4 x 6" },
        {
          name: "Bulgarian split squats",
          targetText: "4 x 8 each leg",
        },
        { name: "Single-leg RDL", targetText: "3 x 10 each" },
        { name: "Towel hamstring slides", targetText: "3 x 8" },
        { name: "Single-leg calf raise", targetText: "3 x 15 each" },
      ],
    },
    {
      name: "Day 2 - Upper",
      kind: "TRAINING",
      plannedWeekdays: [3],
      exercises: [
        { name: "Table rows", targetText: "4 x max" },
        { name: "Archer / decline push-ups", targetText: "4 x 8-12" },
        { name: "Pike push-ups", targetText: "3 x 8-10" },
        { name: "Plank shoulder taps", targetText: "3 x 20" },
        { name: "Neck isometrics", targetText: "3 x 15 sec each way" },
        { name: "Lying leg raises / V-ups", targetText: "3 x 12" },
        { name: "Prone Y-T-W raises", targetText: "3 x 10" },
      ],
    },
    {
      name: "Day 3 - Contact + Power",
      kind: "TRAINING",
      plannedWeekdays: [6],
      skipInMatchWeek: true,
      exercises: [
        { name: "Explosive push-ups", targetText: "4 x 6" },
        { name: "Lateral bounds", targetText: "3 x 8 each side" },
        { name: "Tuck jumps", targetText: "3 x 8" },
        { name: "Bear crawls", targetText: "4 x 20m" },
        { name: "Wall drives (scrum/ruck hold)", targetText: "4 x 10 sec" },
        { name: "Single-leg hops", targetText: "3 x 8 each" },
        { name: "20m sprints (finisher)", targetText: "4 x 20m" },
      ],
    },
    {
      name: "Team practice",
      kind: "ACTIVITY",
      plannedWeekdays: [2, 4],
      exercises: [],
    },
    {
      name: "Match",
      kind: "ACTIVITY",
      plannedWeekdays: [7],
      countsTowardTarget: false,
      isMatch: true,
      exercises: [],
    },
  ],
  metrics: [
    { name: "Table rows", unit: "reps", direction: "HIGHER_IS_BETTER", decimals: 0 },
    { name: "Push-ups", unit: "reps", direction: "HIGHER_IS_BETTER", decimals: 0 },
    {
      name: "20m sprint",
      unit: "sec",
      direction: "LOWER_IS_BETTER",
      decimals: 2,
    },
    {
      name: "Bodyweight",
      unit: "kg",
      direction: "NEUTRAL",
      decimals: 1,
    },
    { name: "Plank hold", unit: "sec", direction: "HIGHER_IS_BETTER", decimals: 0 },
    {
      name: "Beep test level",
      unit: "level",
      direction: "HIGHER_IS_BETTER",
      decimals: 1,
    },
  ],
};

export const BLANK: StarterTemplate = {
  id: "blank",
  name: "Blank",
  description: "Start with an empty program and add your own days and metrics.",
  dayTypes: [],
  metrics: [],
};

export const STARTER_TEMPLATES: StarterTemplate[] = [RUGBY_SEVENS, BLANK];

export function getTemplate(id: TemplateId): StarterTemplate {
  return id === "blank" ? BLANK : RUGBY_SEVENS;
}
