# Training Tracker — Build Plan

Mobile-first PWA for logging training sessions and tracking progress. Nothing about
the product is rugby-specific; "Rugby sevens (no equipment)" is only a seeded template.

## File structure

```
training-tracker/
  prisma/
    schema.prisma            # User, DayType, Exercise, Session, ExerciseEntry,
                             # Metric, Benchmark, BenchmarkValue
    seed.ts                  # dev-only demo user (registration seeds templates too)
  src/
    app/
      layout.tsx             # root shell, dark theme
      globals.css
      (auth)/login/page.tsx
      (auth)/register/page.tsx
      (app)/layout.tsx       # requires session, app shell + bottom nav
      (app)/page.tsx         # Today (phase 1)
      (app)/week/page.tsx    # Week report (phase 1)
      (app)/progress/page.tsx
      (app)/program/page.tsx
      (app)/settings/page.tsx
      actions/               # server actions: auth, sessions, program, settings
    components/              # shared UI (buttons, fields, nav)
    lib/
      db.ts                  # Prisma singleton
      session.ts             # jose sign/verify, cookie helpers, getCurrentUser
      auth.ts                # bcrypt hash/verify + login rate limiter
      validation.ts          # Zod schemas
      templates.ts           # Rugby sevens + Blank starter templates
      week.ts                # pure week/target/volume functions (unit tested)
      dates.ts               # timezone-safe calendar-date helpers (Asia/Jakarta)
    middleware.ts            # redirect unauthenticated app routes to /login
  tests/
    week.test.ts             # Monday/Sunday boundaries, match-week target, volume
  public/
    manifest.webmanifest
    icons/                   # generated PNG icons
  README.md
  .env.example
```

## Steps / phases

- **Phase 0 — Setup**
  1. Scaffold Next.js App Router + TypeScript strict + Tailwind + ESLint.
  2. Prisma schema (all models, relations and uniques from the brief), migration, DB.
  3. Password hashing (bcrypt), JWT session in httpOnly/secure/sameSite=lax cookie via
     `jose`, 7-day expiry, middleware route protection, per-action `userId` scoping.
  4. Zod-validated register/login server actions, generic auth errors, in-memory login
     rate limiter. Register seeds the chosen template.
  5. Starter templates module (Rugby sevens, Blank) + dev seed of a demo account.
  6. Dark, mobile-first app shell + placeholder screens so navigation works.
  7. Vitest setup with pure week/target/volume logic and boundary tests.
  8. README (env vars, local DB, deploy to Vercel) and PWA manifest.
  9. Run lint, type-check and tests; fix everything.

- **Phase 1 — MVP**: Today, Log session, practice/match logging, Week report.
- **Phase 2 — Progress**: metrics, benchmarks, summary table, charts, CSV import/export.
- **Phase 3 — Polish**: PWA install, IndexedDB offline queue, dark mode, Settings.
- **Phase 4 — Extras**: reminders, goal countdown, nutrition.
