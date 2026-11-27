import { PageHeader } from "@/components/page-header";
import { logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/session";
import { PhaseFourServerForm } from "@/components/phase-four-server-form";
import { todayInTimeZone, formatDateOnly } from "@/lib/dates";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Your training preferences and session."
      />

      <section className="card divide-y divide-line">
        <Row label="Name" value={user.name} />
        <Row label="Email" value={user.email} />
        <Row label="Weekly target" value={`${user.weeklyTarget} sessions`} />
        <Row label="Timezone" value={user.timezone} />
      </section>

      <PhaseFourServerForm date={todayInTimeZone(user.timezone)} goalName={user.goalName ?? ""} goalDate={user.goalDate ? formatDateOnly(user.goalDate) : ""} reminderTime={user.reminderTime ?? ""} />

      <section className="card mt-4 px-4 py-4">
        <h2 className="text-sm font-semibold text-ink">Data</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Offline shell support is enabled. Training writes still need a
          connection and are saved once the server confirms them.
        </p>
      </section>

      <section className="card mt-4 px-4 py-4">
        <h2 className="text-sm font-semibold text-ink">Export your data</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Download sessions and benchmarks as a CSV file.</p>
        <a href="/api/export" className="mt-3 block rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-ink hover:bg-accent-strong">Download CSV</a>
        <form action="/api/import" method="post" encType="multipart/form-data" className="mt-4 border-t border-line pt-4">
          <label className="block text-xs font-medium text-muted">Import benchmark CSV<input name="file" type="file" accept=".csv,text/csv" required className="mt-2 block w-full text-xs text-muted" /></label>
          <button type="submit" className="mt-3 w-full rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink">Import benchmarks</button>
        </form>
      </section>

      <form action={logoutAction} className="mt-4">
        <button
          type="submit"
          className="tap flex w-full items-center justify-center rounded-xl border border-danger/40 bg-danger/10 px-5 text-sm font-semibold text-danger transition-colors hover:bg-danger/15"
        >
          Sign out
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Training Tracker · Phase 0
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
