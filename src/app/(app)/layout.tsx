import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { Brand } from "@/components/logo";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="rounded-lg" aria-label="Training Tracker home">
            <Brand compact />
          </Link>
          <Link
            href="/settings"
            className="tap flex h-10 w-10 items-center justify-center rounded-full border border-line bg-raised text-sm font-semibold text-accent"
            aria-label="Open settings"
          >
            {initial}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-5 pb-28">
        {children}
      </main>

      <AppNav />
    </div>
  );
}
