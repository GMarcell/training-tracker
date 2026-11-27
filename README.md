# Training Tracker

A mobile-first PWA for logging training sessions and tracking progress. Log a
session in under 30 seconds, see your week at a glance, and track your own
benchmarks. Nothing is rugby-specific: day types, programs and metrics are
user-defined. The "Rugby sevens (no equipment)" program is only a starter
template.

**Status:** Phase 1 complete. Today shows the planned session and weekly
progress; sessions log with autosaving set/rep steppers and notes; practice and
match days quick-log in one tap; the Week screen reports target, volume, a
12-week chart and history. Program editing, Progress benchmarks and the offline
queue are later phases.

## Stack

- Next.js 16 App Router, React 19, TypeScript (strict)
- Tailwind CSS 4 (mobile-first, dark)
- PostgreSQL + Prisma 7 (`@prisma/adapter-pg` driver adapter)
- Email + password auth: bcrypt hashes, `jose` HS256 JWT in an httpOnly,
  `sameSite=lax`, 7-day session cookie (secure in production)
- Zod validation, React server actions
- Recharts for the weekly sessions chart
- Vitest for pure week/target/volume logic
- PWA web manifest (`public/manifest.webmanifest`); service worker and offline
  queue land in Phase 3

## Environment variables

| Variable         | Required | Description                                              |
| ---------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL`   | yes      | PostgreSQL connection string.                            |
| `SESSION_SECRET` | yes      | Long random string used to sign session JWTs (≥ 32 chars; `openssl rand -hex 32`). |
| `GROQ_API_KEY`   | no       | Enables the AI program builder. Without it that page shows a setup notice. Create a key at https://console.groq.com/keys. |
| `GROQ_MODEL`     | no       | Overrides the Groq chat model (default `openai/gpt-oss-120b`). |

Copy `.env.example` to `.env` and fill both values. The example `DATABASE_URL`
already matches the Compose database below. Generate a secret with:

```bash
openssl rand -hex 32
```

## Database (Docker Compose)

`docker-compose.yml` runs a local PostgreSQL 16 database on
`127.0.0.1:5434` (user `training`, password `training`, database
`training_tracker`). It works with Docker Desktop or the plain Docker CLI.

```bash
# Start the database in the background (waits until the healthcheck passes)
docker compose up -d

# Check status: should say "Up ... (healthy)"
docker compose ps

# Follow the database logs
docker compose logs -f db

# Open a psql shell inside the container
docker exec -it training-tracker-db psql -U training -d training_tracker

# Stop it; data stays in the named volume
docker compose down

# Delete the database and start over (drops all local data)
docker compose down -v
docker compose up -d
npx prisma migrate deploy
```

Data lives in the named volume `training-tracker-db-data`, so stopping the
container does not lose it. Port 5434 is used instead of 5432 to avoid clashing
with a PostgreSQL already installed on the host. To use a different port,
change it in `docker-compose.yml` and in `DATABASE_URL`.

After the database is running, apply the committed migrations:

```bash
npx prisma migrate dev     # development: creates a migration if the schema changed
npx prisma migrate deploy  # applies existing migrations only
```

## Demo data

Seeds an idempotent demo account with the rugby-sevens starter program and
seven weeks of sessions:

```bash
npm run db:seed
```

Log in with `demo@example.com` / `demo1234`. Running it again does not create
duplicates: it skips the program and sessions if the account already has them.

## AI program builder (Groq)

Program → **Build a program with AI** (`/program/new`) drafts a full program
from a short brief: goal, days per week, equipment, experience and optional
notes. Groq returns JSON, which is validated with Zod before it is shown; the
draft is only written to the database when you press **Add to my program**.

- The request is rate-limited to 10 generations per user per hour.
- Saving appends the generated day types and metrics (metric names already in
your program are skipped) and sets the weekly target only if you had no day
types yet.
- Generation happens in a server action; the API key never reaches the browser.
- The model defaults to `openai/gpt-oss-120b`; set `GROQ_MODEL` to change it.
- If `GROQ_API_KEY` is missing, the page explains how to configure it instead of
  failing at submit time.

Restart `npm run dev` after changing `GROQ_API_KEY` (server actions read the
environment at startup).

## Local setup

```bash
npm install

# Start PostgreSQL (see Database above; any Postgres works)
docker compose up -d

# Apply migrations, optionally seed demo data, then start the app
npx prisma migrate dev
npm run db:seed   # optional
npm run dev
```

Open http://localhost:3000, create an account, and pick a starter template.

### Scripts

| Script              | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Development server                           |
| `npm run build`     | Production build                             |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | TypeScript, no emit                          |
| `npm test`          | Vitest unit tests                            |
| `npm run db:migrate`| Create/apply a dev migration                 |
| `npm run db:deploy` | Apply migrations in production              |
| `npm run db:generate` | Regenerate the Prisma client               |
| `npm run db:seed`   | Seed the demo account and sample sessions    |

## Auth

- `/register` validates name, email and a password of at least 8 characters,
  hashes with bcrypt (cost 12), creates the user and seeds the chosen starter
  template in one transaction, then signs the session.
- `/login` returns a generic "Invalid email or password" for unknown accounts
  and wrong passwords, and always performs a bcrypt comparison to reduce timing
  differences. Attempts are limited in memory (8 per 10 minutes per IP + email).
- Sessions are signed with `jose` (HS256, 7-day expiry) and stored in an
  httpOnly, secure-in-production, `sameSite=lax` cookie.
- `src/proxy.ts` (Next.js 16's renamed middleware) redirects unauthenticated
  requests to `/login?next=…`. Every page, server action and query also reads the
  user id from the signed session and scopes data by `userId`.

## Data model

`User`, `DayType` (planned weekdays, target flags, ordered `Exercise`s),
`Session` (unique per user + calendar date) with `ExerciseEntry` rows, `Metric`,
`Benchmark` (unique per user + date) with `BenchmarkValue` rows, and
`WeekTargetOverride` (per-week target override). Volume is always computed as
`sets × reps`; it is never stored.

Dates are calendar dates (`@db.Date`) and the week runs Monday–Sunday in the
user's timezone (default `Asia/Jakarta`). `src/lib/dates.ts` works in UTC on
`YYYY-MM-DD` strings, and `src/lib/week.ts` holds the pure match-week target and
volume logic covered by Vitest.

## Deploy to Vercel

1. Push the `training-tracker` directory to a Git repository and import it in
   Vercel.
2. Add `DATABASE_URL` (a hosted Postgres database) and `SESSION_SECRET` to the
   project's environment variables.
3. Vercel runs `npm run vercel-build`, which generates the Prisma client,
   applies committed migrations (`prisma migrate deploy`) and builds Next.js.

`npm install` also runs `prisma generate` via `postinstall`.

## Phase map

- **Phase 0 (done):** scaffolding, schema + migration, auth, starter templates,
  app shell, PWA manifest, pure week logic with boundary/timezone tests, README.
- **Phase 1 (done):** Today + weekly ring, autosaving session log, one-tap
  practice/match logging, Week report card, 12-week chart and history, per-week
  target overrides.
- **Phase 2:** benchmarks + charts, CSV import/export.
- **Phase 3:** PWA service worker + offline queue, editable Settings.
- **Phase 4:** reminders, goal countdown, nutrition.
