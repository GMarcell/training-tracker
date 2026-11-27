"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  saveEntryAction,
  saveSessionNotesAction,
} from "@/app/actions/sessions";

export type LoggedEntry = {
  id: string;
  name: string;
  targetText: string;
  sets: number;
  reps: number;
  unit: "REPS" | "SECONDS";
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function useDebouncedSave(delay = 600) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const schedule = useCallback(
    (callback: () => void) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(callback, delay);
    },
    [delay],
  );

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  return { schedule, cancel };
}

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), max);
}

function EntryRow({ entry }: { entry: LoggedEntry }) {
  const [sets, setSets] = useState(entry.sets);
  const [reps, setReps] = useState(entry.reps);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { schedule, cancel } = useDebouncedSave();

  const saved = useRef({ sets: entry.sets, reps: entry.reps });
  const latest = useRef({ sets: entry.sets, reps: entry.reps });

  useEffect(() => {
    latest.current = { sets, reps };
  }, [sets, reps]);

  const save = useCallback(
    (nextSets: number, nextReps: number) => {
      if (
        saved.current.sets === nextSets &&
        saved.current.reps === nextReps
      ) {
        return;
      }

      setStatus("saving");
      startTransition(async () => {
        const result = await saveEntryAction({
          entryId: entry.id,
          sets: nextSets,
          reps: nextReps,
        });
        if (result.ok) {
          saved.current = { sets: nextSets, reps: nextReps };
          setStatus("saved");
          setError(null);
        } else {
          setStatus("error");
          setError(result.error);
        }
      });
    },
    [entry.id],
  );

  function update(nextSets: number, nextReps: number, immediate = false) {
    const cleanSets = clamp(nextSets, 999);
    const cleanReps = clamp(nextReps, 9999);
    setSets(cleanSets);
    setReps(cleanReps);
    setStatus("idle");
    setError(null);
    if (immediate) {
      cancel();
      save(cleanSets, cleanReps);
    } else {
      schedule(() => save(cleanSets, cleanReps));
    }
  }

  function saveNow() {
    cancel();
    save(latest.current.sets, latest.current.reps);
  }

  const unitLabel = entry.unit === "SECONDS" ? "sec" : "reps";

  return (
    <li className="py-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">{entry.name}</p>
          {entry.targetText ? (
            <p className="mt-0.5 text-xs text-muted">Target {entry.targetText}</p>
          ) : null}
        </div>
        <span
          aria-live="polite"
          className={`shrink-0 text-[11px] font-medium ${
            status === "error"
              ? "text-danger"
              : status === "saving"
                ? "text-muted"
                : status === "saved"
                  ? "text-accent"
                  : "text-transparent"
          }`}
        >
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Saved"
              : status === "error"
                ? "Not saved"
                : "Saved"}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-3">
        <div className="flex-1">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
            Sets
          </span>
          <div className="flex items-center gap-1.5">
            <StepperButton
              label={`Remove a set from ${entry.name}`}
              onClick={() => update(sets - 1, reps, true)}
            >
              −
            </StepperButton>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={String(sets)}
              onChange={(event) => update(Number(event.target.value), reps)}
              onFocus={(event) => event.currentTarget.select()}
              onBlur={saveNow}
              aria-label={`${entry.name} sets`}
              className="h-11 w-12 rounded-lg border border-line bg-raised text-center text-base font-semibold tabular-nums text-ink"
            />
            <StepperButton
              label={`Add a set to ${entry.name}`}
              onClick={() => update(sets + 1, reps, true)}
            >
              +
            </StepperButton>
          </div>
        </div>

        <div className="flex-1">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
            {entry.unit === "SECONDS" ? "Seconds" : "Reps"}
          </span>
          <div className="flex items-center gap-1.5">
            <StepperButton
              label={`Reduce ${entry.name} ${unitLabel}`}
              onClick={() => update(sets, reps - 1, true)}
            >
              −
            </StepperButton>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={String(reps)}
              onChange={(event) => update(sets, Number(event.target.value))}
              onFocus={(event) => event.currentTarget.select()}
              onBlur={saveNow}
              aria-label={`${entry.name} ${unitLabel}`}
              className="h-11 w-12 rounded-lg border border-line bg-raised text-center text-base font-semibold tabular-nums text-ink"
            />
            <StepperButton
              label={`Add ${entry.name} ${unitLabel}`}
              onClick={() => update(sets, reps + 1, true)}
            >
              +
            </StepperButton>
          </div>
        </div>

        <div className="w-14 pb-1 text-right">
          <span className="block text-[11px] uppercase tracking-wider text-muted">
            Vol
          </span>
          <span className="text-sm font-semibold tabular-nums text-ink">
            {sets * reps}
          </span>
        </div>
      </div>

      {error ? (
        <button
          type="button"
          onClick={saveNow}
          className="mt-2 text-xs font-medium text-danger underline underline-offset-2"
        >
          {error} Tap to retry.
        </button>
      ) : null}
    </li>
  );
}

function StepperButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="tap flex h-11 w-9 items-center justify-center rounded-lg border border-line bg-panel text-lg font-semibold text-ink transition-colors active:bg-raised"
    >
      {children}
    </button>
  );
}

function NotesField({
  sessionId,
  initialNotes,
}: {
  sessionId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { schedule, cancel } = useDebouncedSave(800);
  const saved = useRef(initialNotes);

  const save = useCallback(
    (value: string) => {
      if (value === saved.current) return;
      setStatus("saving");
      startTransition(async () => {
        const result = await saveSessionNotesAction({ sessionId, notes: value });
        if (result.ok) {
          saved.current = value;
          setStatus("saved");
          setError(null);
        } else {
          setStatus("error");
          setError(result.error);
        }
      });
    },
    [sessionId],
  );

  function update(value: string) {
    setNotes(value);
    setStatus("idle");
    schedule(() => save(value));
  }

  return (
    <div>
      <label
        htmlFor="session-notes"
        className="mb-1.5 block text-sm font-medium text-ink"
      >
        Notes
      </label>
      <textarea
        id="session-notes"
        value={notes}
        maxLength={1000}
        rows={3}
        onChange={(event) => update(event.target.value)}
        onBlur={() => {
          cancel();
          save(notes);
        }}
        placeholder="How did it feel? Anything to remember?"
        className="field min-h-24 resize-y"
      />
      <p
        aria-live="polite"
        className={`mt-1 text-xs ${
          status === "error" ? "text-danger" : "text-muted"
        }`}
      >
        {status === "saving"
          ? "Saving…"
          : status === "error"
            ? (error ?? "Could not save notes.")
            : status === "saved"
              ? "Saved"
              : `${notes.length}/1000`}
      </p>
    </div>
  );
}

export function SessionLogger({
  sessionId,
  entries,
  initialNotes,
}: {
  sessionId: string;
  entries: LoggedEntry[];
  initialNotes: string;
}) {
  return (
    <div className="space-y-4">
      <section className="card px-4 py-2">
        {entries.length === 0 ? (
          <p className="py-4 text-sm leading-6 text-muted">
            This activity has no exercises. Add a note below and you are done —
            it still counts toward your week if the day type counts.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>

      <section className="card px-4 py-4">
        <NotesField sessionId={sessionId} initialNotes={initialNotes} />
      </section>

      <p className="text-center text-xs text-muted">
        {entries.length > 0
          ? `${entries.length} exercises · changes save automatically`
          : "Activity session · notes save automatically"}
      </p>
    </div>
  );
}
