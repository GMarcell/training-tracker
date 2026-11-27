import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Create your account
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Pick a starter program. Everything is editable later.
      </p>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-accent underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
