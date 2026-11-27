import { describe, expect, it } from "vitest";
import {
  addDays,
  isoWeekday,
  startOfWeek,
  todayInTimeZone,
  weekRange,
} from "@/lib/dates";
import {
  computeWeekTarget,
  exerciseVolume,
  percentChange,
  plannedDayTypesForDate,
  summarizeWeek,
  type WeekSession,
} from "@/lib/week";

const training = (date: string, entries = [{ sets: 3, reps: 10 }]): WeekSession => ({
  date,
  dayType: { countsTowardTarget: true, isMatch: false },
  entries,
});

const practice = (date: string): WeekSession => ({
  date,
  dayType: { countsTowardTarget: true, isMatch: false },
  entries: [],
});

const match = (date: string): WeekSession => ({
  date,
  dayType: { countsTowardTarget: false, isMatch: true },
  entries: [],
});

const dayTypes = [
  { skipInMatchWeek: true },
  { skipInMatchWeek: true },
  { skipInMatchWeek: false },
];

describe("week boundaries", () => {
  it("uses Monday as the first day of the week", () => {
    expect(startOfWeek("2026-11-23")).toBe("2026-11-23"); // Monday
    expect(startOfWeek("2026-11-29")).toBe("2026-11-23"); // Sunday
    expect(startOfWeek("2026-11-30")).toBe("2026-11-30"); // next Monday
    expect(weekRange("2026-11-26")).toEqual({
      start: "2026-11-23",
      end: "2026-11-29",
    });
  });

  it("handles month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(startOfWeek("2027-01-01")).toBe("2026-12-28");
    expect(weekRange("2027-01-01").end).toBe("2027-01-03");
  });

  it("maps ISO weekdays Monday=1 through Sunday=7", () => {
    expect(isoWeekday("2026-11-23")).toBe(1);
    expect(isoWeekday("2026-11-26")).toBe(4);
    expect(isoWeekday("2026-11-29")).toBe(7);
  });
});

describe("Asia/Jakarta today", () => {
  it("rolls over at midnight Jakarta time (UTC+7)", () => {
    // 2026-11-27 16:59 UTC = 2026-11-27 23:59 Jakarta
    expect(
      todayInTimeZone("Asia/Jakarta", new Date("2026-11-27T16:59:00.000Z")),
    ).toBe("2026-11-27");

    // 2026-11-27 17:00 UTC = 2026-11-28 00:00 Jakarta
    expect(
      todayInTimeZone("Asia/Jakarta", new Date("2026-11-27T17:00:00.000Z")),
    ).toBe("2026-11-28");
  });

  it("supports other timezones", () => {
    const instant = new Date("2026-11-27T23:30:00.000Z");
    expect(todayInTimeZone("UTC", instant)).toBe("2026-11-27");
    expect(todayInTimeZone("Asia/Tokyo", instant)).toBe("2026-11-28");
  });
});

describe("weekly target", () => {
  it("uses the base target in a normal week", () => {
    expect(
      computeWeekTarget({
        baseTarget: 5,
        dayTypes,
        sessions: [training("2026-11-24")],
      }),
    ).toMatchObject({ target: 5, isMatchWeek: false, skippedDayTypes: 0 });
  });

  it("subtracts active skippable day types in a match week", () => {
    expect(
      computeWeekTarget({
        baseTarget: 5,
        dayTypes,
        sessions: [match("2026-11-29")],
      }),
    ).toMatchObject({ target: 3, isMatchWeek: true, skippedDayTypes: 2 });
  });

  it("ignores archived day types when reducing the target", () => {
    expect(
      computeWeekTarget({
        baseTarget: 5,
        dayTypes: [
          { skipInMatchWeek: true, archived: true },
          { skipInMatchWeek: true, archived: false },
        ],
        sessions: [match("2026-11-29")],
      }).target,
    ).toBe(4);
  });

  it("never produces a negative target", () => {
    expect(
      computeWeekTarget({
        baseTarget: 1,
        dayTypes,
        sessions: [match("2026-11-29")],
      }).target,
    ).toBe(0);
  });

  it("lets a per-week override win, including in a match week", () => {
    expect(
      computeWeekTarget({
        baseTarget: 5,
        dayTypes,
        sessions: [match("2026-11-29")],
        override: 6,
      }).target,
    ).toBe(6);
  });
});

describe("summarizeWeek", () => {
  it("counts only sessions that count toward the target", () => {
    const summary = summarizeWeek({
      weekStart: "2026-11-23",
      baseTarget: 5,
      dayTypes,
      isCurrentWeek: true,
      sessions: [
        training("2026-11-23"),
        practice("2026-11-24"),
        match("2026-11-29"),
        // Previous week, must be excluded.
        training("2026-11-22"),
      ],
    });

    expect(summary.sessionsDone).toBe(2);
    expect(summary.isMatchWeek).toBe(true);
    expect(summary.target).toBe(3);
    expect(summary.status).toBe("to-go");
    expect(summary.remaining).toBe(1);
    expect(summary.completionPct).toBe(67);
    expect(summary.totalSets).toBe(3);
    expect(summary.totalVolume).toBe(30);
  });

  it("reports target hit and missed states", () => {
    const hit = summarizeWeek({
      weekStart: "2026-11-23",
      baseTarget: 2,
      dayTypes: [],
      isCurrentWeek: false,
      sessions: [training("2026-11-23"), practice("2026-11-24")],
    });
    expect(hit.status).toBe("hit");
    expect(hit.remaining).toBe(0);

    const missed = summarizeWeek({
      weekStart: "2026-11-23",
      baseTarget: 3,
      dayTypes: [],
      isCurrentWeek: false,
      sessions: [training("2026-11-23")],
    });
    expect(missed.status).toBe("missed");
    expect(missed.remaining).toBe(2);
  });

  it("treats a zero target as complete", () => {
    const summary = summarizeWeek({
      weekStart: "2026-11-23",
      baseTarget: 0,
      dayTypes: [],
      isCurrentWeek: false,
      sessions: [],
    });
    expect(summary.status).toBe("hit");
    expect(summary.completionPct).toBe(100);
  });

  it("computes volume as sets x reps, never stored", () => {
    expect(exerciseVolume({ sets: 4, reps: 12 })).toBe(48);
    expect(exerciseVolume({ sets: 0, reps: 20 })).toBe(0);

    const summary = summarizeWeek({
      weekStart: "2026-11-23",
      baseTarget: 5,
      dayTypes: [],
      isCurrentWeek: true,
      sessions: [
        {
          date: "2026-11-23",
          dayType: { countsTowardTarget: true, isMatch: false },
          entries: [
            { sets: 4, reps: 8 },
            { sets: 3, reps: 15 },
          ],
        },
      ],
    });
    expect(summary.totalVolume).toBe(77);
    expect(summary.totalSets).toBe(7);
  });
});

describe("helpers", () => {
  it("finds planned day types for a date", () => {
    const types = [
      { name: "Lower", plannedWeekdays: [1], archived: false },
      { name: "Practice", plannedWeekdays: [2, 4], archived: false },
      { name: "Old", plannedWeekdays: [2], archived: true },
    ];
    expect(plannedDayTypesForDate(types, "2026-11-24").map((t) => t.name)).toEqual([
      "Practice",
    ]);
    expect(plannedDayTypesForDate(types, "2026-11-25")).toEqual([]);
  });

  it("calculates volume percentage change", () => {
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(80, 100)).toBe(-20);
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(10, 0)).toBeNull();
  });
});
