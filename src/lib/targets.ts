export type ParsedTarget = {
  sets: number;
  reps: number;
  unit: "REPS" | "SECONDS";
};

const SETS_REPS = /(\d+)\s*(?:x|×)\s*(?:max\b|(\d+))/i;

/**
 * Reads a program target such as "4 x 6", "3 x 15 sec each way" or "4 x max"
 * into starter values for the session logger. Missing or unparseable targets
 * start at zero so the user is never given invented numbers.
 */
export function parseTarget(targetText: string): ParsedTarget {
  const match = SETS_REPS.exec(targetText);
  const unit = /sec/i.test(targetText) ? "SECONDS" : "REPS";

  if (!match) return { sets: 0, reps: 0, unit };

  const sets = Number.parseInt(match[1] ?? "0", 10);
  const reps = Number.parseInt(match[2] ?? "0", 10);

  if (!Number.isFinite(sets) || !Number.isFinite(reps)) {
    return { sets: 0, reps: 0, unit };
  }

  return {
    sets: Math.min(Math.max(sets, 0), 999),
    reps: Math.min(Math.max(reps, 0), 9999),
    unit,
  };
}
