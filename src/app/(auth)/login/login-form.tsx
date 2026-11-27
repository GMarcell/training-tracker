"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import type { AuthFormState } from "@/lib/validation";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthFormState, FormData>(
    loginAction,
    undefined,
  );

  const emailError = state?.fieldErrors?.email?.[0];
  const passwordError = state?.fieldErrors?.password?.[0];

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      {state?.error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/35 bg-danger/10 px-3.5 py-3 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          required
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className="field"
          placeholder="you@example.com"
        />
        {emailError ? (
          <p id="email-error" className="mt-1.5 text-xs text-danger">
            {emailError}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-error" : undefined}
          className="field"
          placeholder="Your password"
        />
        {passwordError ? (
          <p id="password-error" className="mt-1.5 text-xs text-danger">
            {passwordError}
          </p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="Logging in…">Log in</SubmitButton>
    </form>
  );
}
