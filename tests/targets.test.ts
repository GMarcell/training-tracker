import { describe, expect, it } from "vitest";
import { parseTarget } from "@/lib/targets";

describe("parseTarget", () => {
  it("reads sets and reps from a standard target", () => {
    expect(parseTarget("4 x 6")).toEqual({ sets: 4, reps: 6, unit: "REPS" });
  });

  it("treats second-based targets as seconds", () => {
    expect(parseTarget("3 x 15 sec each way")).toEqual({
      sets: 3,
      reps: 15,
      unit: "SECONDS",
    });
  });

  it("keeps the sets for a max-rep target and starts reps at zero", () => {
    expect(parseTarget("4 x max")).toEqual({ sets: 4, reps: 0, unit: "REPS" });
  });

  it("supports a multiplication sign", () => {
    expect(parseTarget("3 × 10")).toEqual({ sets: 3, reps: 10, unit: "REPS" });
  });

  it("starts at zero when no sets and reps are present", () => {
    expect(parseTarget("4 x 20m")).toEqual({ sets: 4, reps: 20, unit: "REPS" });
    expect(parseTarget("20m sprints")).toEqual({
      sets: 0,
      reps: 0,
      unit: "REPS",
    });
    expect(parseTarget("")).toEqual({ sets: 0, reps: 0, unit: "REPS" });
  });
});
