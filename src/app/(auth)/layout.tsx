import Link from "next/link";
import { Brand } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-md px-5 pt-7">
        <Link href="/" className="inline-block rounded-lg" aria-label="Training Tracker">
          <Brand />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-8">
        {children}
      </main>
      <footer className="px-5 pb-8 text-center text-xs text-muted">
        Train on your terms. Your data stays private to your account.
      </footer>
    </div>
  );
}
