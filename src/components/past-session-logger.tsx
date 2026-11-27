"use client";

import { useState } from "react";
import { StartSessionForm } from "@/components/start-session-form";

type DayType = {
  id: string;
  name: string;
  kind: "TRAINING" | "ACTIVITY";
};

export function PastSessionLogger({
  initialDate,
  maxDate,
  dayTypes,
}: {
  initialDate: string;
  maxDate: string;
  dayTypes: DayType[];
}) {
  const [date, setDate] = useState(initialDate);

  return (
    <section className="mt-6 rounded-2xl border border-dashed border-line px-4 py-4">
      <h2 className="text-sm font-semibold text-ink">Log another date</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Record a missed session from yesterday or an earlier date.
      </p>
      <label htmlFor="past-session-date" className="mt-3 block text-xs font-medium uppercase tracking-wider text-muted">
        Training date
      </label>
      <input
        id="past-session-date"
        type="date"
        value={date}
        max={maxDate}
        onChange={(event) => setDate(event.target.value)}
        className="field mt-1 h-11 min-h-11 py-0"
      />
      <div className="mt-3 space-y-2">
        {dayTypes.map((dayType) => (
          <StartSessionForm
            key={dayType.id}
            dayTypeId={dayType.id}
            date={date}
            label={`Log ${dayType.name}`}
            variant="secondary"
          />
        ))}
      </div>
    </section>
  );
}
