"use client";

import { useActionState } from "react";
import { startSessionAction } from "@/app/actions/sessions";
import { SubmitButton } from "@/components/submit-button";
import type { StartSessionState } from "@/lib/session-validation";

export function StartSessionForm({
  dayTypeId,
  date,
  label,
  variant = "primary",
}: {
  dayTypeId: string;
  date: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  const [state, action] = useActionState<StartSessionState, FormData>(
    startSessionAction,
    undefined,
  );

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="dayTypeId" value={dayTypeId} />
      <input type="hidden" name="date" value={date} />
      {state?.error ? (
        <p role="alert" className="mb-2 text-xs leading-5 text-danger">
          {state.error}
        </p>
      ) : null}
      <SubmitButton
        variant={variant}
        pendingLabel="Starting…"
        className="text-sm"
      >
        {label}
      </SubmitButton>
    </form>
  );
}
