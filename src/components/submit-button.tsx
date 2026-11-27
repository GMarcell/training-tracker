"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel = "Please wait…",
  className = "",
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-ink hover:bg-accent-strong"
      : "border border-line bg-raised text-ink hover:border-accent/50";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`tap inline-flex w-full items-center justify-center rounded-xl px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
