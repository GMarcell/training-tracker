import { describe, expect, it } from "vitest";
import {
  generatedProgramSchema,
  normalizeGeneratedProgram,
  programRequestSchema,
} from "@/lib/program-schema";

const validProgram = {
  name: "Three-day strength",
  summary: "Lower, upper and full-body days with a match on Saturday.",
  weeklyTarget: 4,
  dayTypes: [
    {
      name: "Lower",
      kind: "TRAINING",
      plannedWeekdays: [3, 1, 3],
      isMatch: false,
      skipInMatchWeek: true,
      countsTowardTarget: true,
      exercises: [{ name: "Squat", targetText: "4 x 6" }],
    },
    {
      name: "Practice",
      kind: "ACTIVITY",
      plannedWeekdays: [2],
      isMatch: false,
      skipInMatchWeek: false,
      countsTowardTarget: true,
      exercises: [{ name: "Should be dropped", targetText: "3 x 10" }],
    },
    {
      name: "Match",
      kind: "ACTIVITY",
      plannedWeekdays: [6],
      isMatch: true,
      skipInMatchWeek: false,
      countsTowardTarget: false,
      exercises: [],
    },
    {
      name: "Second match",
      kind: "ACTIVITY",
      plannedWeekdays: [7],
      isMatch: true,
      skipInMatchWeek: false,
      countsTowardTarget: false,
      exercises: [],
    },
  ],
  metrics: [
    {
      name: "Squat",
      unit: "kg",
      direction: "HIGHER_IS_BETTER",
      decimals: 1,
      targetMin: null,
      targetMax: null,
    },
    {
      name: "squat",
      unit: "kg",
      direction: "HIGHER_IS_BETTER",
      decimals: 1,
      targetMin: null,
      targetMax: null,
    },
  ],
};

describe("generatedProgramSchema", () => {
  it("accepts a well-formed program", () => {
    expect(generatedProgramSchema.safeParse(validProgram).success).toBe(true);
  });

  it("rejects weekday numbers outside 1-7", () => {
    const result = generatedProgramSchema.safeParse({
      ...validProgram,
      dayTypes: [
        {
          ...validProgram.dayTypes[0],
          plannedWeekdays: [0, 8],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a program with no day types", () => {
    const result = generatedProgramSchema.safeParse({
      ...validProgram,
      dayTypes: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("normalizeGeneratedProgram", () => {
  const program = normalizeGeneratedProgram(
    generatedProgramSchema.parse(validProgram),
  );

  it("deduplicates and sorts planned weekdays", () => {
    expect(program.dayTypes[0].plannedWeekdays).toEqual([1, 3]);
  });

  it("strips exercises from activity days", () => {
    expect(program.dayTypes[1].exercises).toEqual([]);
  });

  it("keeps only the first match day", () => {
    expect(program.dayTypes[2].isMatch).toBe(true);
    expect(program.dayTypes[3].isMatch).toBe(false);
  });

  it("drops duplicate metric names ignoring case", () => {
    expect(program.metrics).toHaveLength(1);
  });
});

describe("programRequestSchema", () => {
  it("rejects goals that are too short", () => {
    const result = programRequestSchema.safeParse({
      goal: "get fit",
      daysPerWeek: "3",
      equipment: "bodyweight",
      experience: "beginner",
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("coerces the days-per-week form value", () => {
    const result = programRequestSchema.safeParse({
      goal: "Build strength for the new rugby season",
      daysPerWeek: "4",
      equipment: "minimal",
      experience: "intermediate",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.daysPerWeek).toBe(4);
  });
});
