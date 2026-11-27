import Link from "next/link";
import type { Metadata } from "next";
import { safeNextPath } from "@/lib/validation";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Log in to continue tracking your training.
      </p>

      <LoginForm next={safeNext} />

      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-accent underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
