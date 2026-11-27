"use client";

import { useActionState, useState } from "react";
import {
  generateProgramAction,
  saveGeneratedProgramAction,
  type ProgramBuilderState,
} from "@/app/actions/program-ai";
import { SubmitButton } from "@/components/submit-button";
import {
  EQUIPMENT_LABELS,
  EXPERIENCE_LABELS,
  WEEKDAY_LABELS,
} from "@/lib/program-schema";

const EQUIPMENT = Object.keys(EQUIPMENT_LABELS) as Array<
  keyof typeof EQUIPMENT_LABELS
>;
const EXPERIENCE = Object.keys(EXPERIENCE_LABELS) as Array<
  keyof typeof EXPERIENCE_LABELS
>;

export function ProgramBuilder({ configured }: { configured: boolean }) {
  const [state, action] = useActionState<ProgramBuilderState, FormData>(
    generateProgramAction,
    undefined,
  );
  const [goal, setGoal] = useState("");

  if (!configured) {
    return (
      <div className="card px-4 py-5 text-sm leading-6 text-muted">
        The AI program builder needs a Groq API key. Add{" "}
        <code className="rounded bg-raised px-1 py-0.5 text-ink">
          GROQ_API_KEY
        </code>{" "}
        to the server environment and restart the app.
      </div>
    );
  }

  const input = state?.input;
  const program = state?.program;

  const goalExamples = [
    {
      label: "General fitness",
      value: "Build general fitness, strength and endurance so I feel healthier day to day.",
    },
    {
      label: "Rugby body",
      value: "Build a strong, powerful body for rugby with better acceleration, contact strength and repeat-effort fitness.",
    },
    {
      label: "Sport performance",
      value: "Improve my performance for my sport with a balanced mix of strength, speed, power and conditioning.",
    },
  ];

  return (
    <div className="space-y-4">
      <form
        key={input ? JSON.stringify(input) : "initial"}
        action={action}
        className="card space-y-4 px-4 py-4"
      >
        {state?.error ? (
          <p
            role="alert"
            className="rounded-xl border border-danger/35 bg-danger/10 px-3.5 py-3 text-sm text-danger"
          >
            {state.error}
          </p>
        ) : null}

        <div>
          <label htmlFor="goal" className="mb-1.5 block text-sm font-medium text-ink">
            What are you training for?
          </label>
          <textarea
            id="goal"
            name="goal"
            required
            minLength={10}
            maxLength={500}
            rows={3}
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="Get stronger for next season, add 5 kg to my squat, and keep up with pre-season running."
            className="field min-h-24 resize-y py-2.5"
          />
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Goal examples">
            {goalExamples.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => setGoal(example.value)}
                className="rounded-lg border border-line bg-raised px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-accent/50 hover:text-ink"
              >
                {example.label}
              </button>
            ))}
          </div>
          {state?.fieldErrors?.goal?.[0] ? (
            <p className="mt-1.5 text-xs text-danger">{state.fieldErrors.goal[0]}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="daysPerWeek"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Days per week
            </label>
            <select
              id="daysPerWeek"
              name="daysPerWeek"
              defaultValue={String(input?.daysPerWeek ?? 3)}
              className="field h-11 min-h-11 py-0"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                <option key={days} value={days}>
                  {days}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="experience"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Experience
            </label>
            <select
              id="experience"
              name="experience"
              defaultValue={input?.experience ?? "intermediate"}
              className="field h-11 min-h-11 py-0"
            >
              {EXPERIENCE.map((value) => (
                <option key={value} value={value}>
                  {EXPERIENCE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="equipment"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Equipment
          </label>
          <select
            id="equipment"
            name="equipment"
            defaultValue={input?.equipment ?? "bodyweight"}
            className="field h-11 min-h-11 py-0"
          >
            {EQUIPMENT.map((value) => (
              <option key={value} value={value}>
                {EQUIPMENT_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-ink">
            Anything else? <span className="text-muted">(optional)</span>
          </label>
          <input
            id="notes"
            name="notes"
            maxLength={300}
            defaultValue={input?.notes ?? ""}
            placeholder="Bad shoulder, only have 40 minutes per session…"
            className="field"
          />
        </div>

        <SubmitButton pendingLabel="Building your program…">
          Generate program
        </SubmitButton>
      </form>

      {program ? (
        <section className="card px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Draft program
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{program.name}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">{program.summary}</p>
          <p className="mt-2 text-xs text-muted">
            Weekly target: <span className="font-semibold text-ink">{program.weeklyTarget}</span>{" "}
            session{program.weeklyTarget === 1 ? "" : "s"}
          </p>

          <div className="mt-4 space-y-3">
            {program.dayTypes.map((day) => (
              <div
                key={`${day.name}-${day.plannedWeekdays.join("-")}`}
                className="rounded-xl border border-line bg-raised px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">{day.name}</h3>
                  <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted">
                    {day.kind === "ACTIVITY" ? "Activity" : "Training"}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-1">
                  {day.plannedWeekdays.length === 0 ? (
                    <span className="text-xs text-muted">No planned days</span>
                  ) : (
                    day.plannedWeekdays.map((weekday) => (
                      <span
                        key={weekday}
                        className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-semibold text-accent"
                      >
                        {WEEKDAY_LABELS[weekday - 1]}
                      </span>
                    ))
                  )}
                  {day.isMatch ? (
                    <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted">
                      Match
                    </span>
                  ) : null}
                  {day.skipInMatchWeek ? (
                    <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted">
                      Skips match week
                    </span>
                  ) : null}
                </div>

                {day.exercises.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {day.exercises.map((exercise) => (
                      <li
                        key={exercise.name}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <span className="text-ink">{exercise.name}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted">
                          {exercise.targetText}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>

          {program.metrics.length > 0 ? (
            <div className="mt-4 border-t border-line pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Metrics
              </h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {program.metrics.map((metric) => (
                  <li
                    key={metric.name}
                    className="rounded-md border border-line px-2 py-1 text-xs text-muted"
                  >
                    {metric.name} · {metric.unit}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <form action={saveGeneratedProgramAction} className="mt-4">
            <input
              type="hidden"
              name="program"
              value={JSON.stringify(program)}
            />
            <SubmitButton pendingLabel="Adding to your program…">
              Add to my program
            </SubmitButton>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted">
            This adds the days and metrics to your program and sets the weekly
            target if you have none yet.
          </p>
        </section>
      ) : null}
    </div>
  );
}
