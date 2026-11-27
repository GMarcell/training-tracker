import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProgramBuilder } from "@/components/program-builder";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Build a program" };

export default async function NewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  return (
    <div>
      <Link
        href="/program"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink"
      >
        <span aria-hidden="true">←</span> Program
      </Link>

      <PageHeader
        eyebrow="AI coach"
        title="Build a program"
        description="Describe your goal and constraints; Groq drafts days, exercises and metrics you can review before saving."
      />

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-danger/35 bg-danger/10 px-3.5 py-3 text-sm text-danger"
        >
          That program could not be saved. Please generate it again.
        </p>
      ) : null}

      <ProgramBuilder configured={Boolean(process.env.GROQ_API_KEY)} />
    </div>
  );
}
