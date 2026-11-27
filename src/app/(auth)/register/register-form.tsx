"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import type { AuthFormState } from "@/lib/validation";

const templates = [
  {
    id: "rugby-sevens",
    name: "Rugby sevens (no equipment)",
    description: "3 training days, practice + match days, 6 benchmarks.",
  },
  {
    id: "blank",
    name: "Blank",
    description: "Start empty and build your own program.",
  },
] as const;

export function RegisterForm() {
  const [state, action] = useActionState<AuthFormState, FormData>(
    registerAction,
    undefined,
  );

  const nameError = state?.fieldErrors?.name?.[0];
  const emailError = state?.fieldErrors?.email?.[0];
  const passwordError = state?.fieldErrors?.password?.[0];

  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      {state?.error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/35 bg-danger/10 px-3.5 py-3 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "name-error" : undefined}
          className="field"
          placeholder="Your name"
        />
        {nameError ? (
          <p id="name-error" className="mt-1.5 text-xs text-danger">
            {nameError}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-ink"
        >
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
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={
            passwordError ? "password-error" : "password-hint"
          }
          className="field"
          placeholder="At least 8 characters"
        />
        {passwordError ? (
          <p id="password-error" className="mt-1.5 text-xs text-danger">
            {passwordError}
          </p>
        ) : (
          <p id="password-hint" className="mt-1.5 text-xs text-muted">
            At least 8 characters.
          </p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-ink">
          Starter template
        </legend>
        <div className="space-y-2">
          {templates.map((template, index) => (
            <label
              key={template.id}
              className="tap flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-panel px-3.5 py-3 transition-colors has-checked:border-accent has-checked:bg-accent/5"
            >
              <input
                type="radio"
                name="template"
                value={template.id}
                defaultChecked={index === 0}
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
              />
              <span>
                <span className="block text-sm font-medium text-ink">
                  {template.name}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-muted">
                  {template.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
