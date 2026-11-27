"use client";

import { deleteSessionAction } from "@/app/actions/sessions";
import { SubmitButton } from "@/components/submit-button";

export function DeleteSessionForm({ sessionId }: { sessionId: string }) {
  return (
    <form
      action={deleteSessionAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Delete this session? Your logged sets and notes will be removed.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <SubmitButton
        variant="secondary"
        pendingLabel="Deleting…"
        className="border-danger/30 text-danger hover:border-danger/60"
      >
        Delete session
      </SubmitButton>
    </form>
  );
}
