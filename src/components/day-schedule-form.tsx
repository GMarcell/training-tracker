import { updateDayTypeScheduleAction } from "@/app/actions/sessions";
import { WEEKDAY_LABELS } from "@/lib/program-schema";

export function DayScheduleForm({
  dayTypeId,
  plannedWeekdays,
}: {
  dayTypeId: string;
  plannedWeekdays: number[];
}) {
  return (
    <details className="mt-3 border-t border-line pt-3">
      <summary className="cursor-pointer text-xs font-semibold text-accent">
        Change training days
      </summary>
      <form action={updateDayTypeScheduleAction} className="mt-3">
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          {WEEKDAY_LABELS.map((label, index) => (
            <label key={label} className="cursor-pointer">
              <input
                type="checkbox"
                name="weekdays"
                value={index + 1}
                defaultChecked={plannedWeekdays.includes(index + 1)}
                className="peer sr-only"
              />
              <span className="block rounded-lg border border-line px-2 py-2 text-center text-xs text-muted transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-accent sm:px-2.5">
                {label}
              </span>
            </label>
          ))}
        </div>
        <input type="hidden" name="dayTypeId" value={dayTypeId} />
        <button
          type="submit"
          className="mt-3 w-full rounded-lg bg-accent px-3 py-2.5 text-xs font-semibold text-accent-ink transition-colors hover:bg-accent-strong sm:w-auto"
        >
          Save training days
        </button>
      </form>
    </details>
  );
}
