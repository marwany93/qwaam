# Testing — Playwright e2e on Firebase emulators

End-to-end tests run against the **Firebase emulators** (Auth + Firestore +
Storage) with **seeded test users**, so they never touch the production project
and produce deterministic data.

## Prerequisites (one-time)
- **Java 11+** (JDK 17 or 21 recommended) — required by the Firestore/Storage
  emulators. Check with `java -version`. JDK 8 is **too old** and the Firestore
  emulator will fail to start.
- **firebase-tools** — `firebase --version` (installed; 15.x).
- **Playwright browser** — `npx playwright install chromium` (one-time).
- No login to a real Firebase project is needed; the emulators + seed use a
  dummy `projectId` (`qwaam-test`). `firebase-key.json` is never read.

## How it works
- `firebase.json` has an `emulators` block: Auth `9099`, Firestore `8080`,
  Storage `9199`, UI `4000`.
- **Client SDK** (`src/lib/firebase.ts`): connects to the emulators and skips
  App Check **only** when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`. Off by
  default → dev/prod untouched.
- **Admin SDK** (`src/lib/firebase-admin.ts`): initializes with just a
  `projectId` (no service-account key) when `FIRESTORE_EMULATOR_HOST` /
  `FIREBASE_AUTH_EMULATOR_HOST` are set — those are injected automatically by
  `firebase emulators:exec`.
- **Seed** (`scripts/seed-emulator.ts`, `npm run seed:emulator`): creates a
  coach + two trainees + a meal plan + exercises. Refuses to run unless the
  emulator host env vars are present (safety gate).
- **Auth in tests** (`e2e/global-setup.ts`): logs in once per role via the real
  `/ar/login` form and saves `storageState` per role to `e2e/.auth/` (gitignored).
  Playwright projects `public` / `coach` / `traineeA` / `traineeB` reuse them.

### Seeded accounts (password `Test123!`)
| Role | Email | State |
|------|-------|-------|
| Coach | `coach@qwaam.test` | role `coach` |
| Trainee A | `traineeA@qwaam.test` | duration schedule active, `dietAdded: true`, assigned meal plan |
| Trainee B | `traineeB@qwaam.test` | `dietAdded: false` (nutrition locked state) |

## Running

**Full suite** (boots emulators, seeds, builds+starts the app, runs everything):
```bash
npm run test:e2e
```
This wraps everything in `firebase emulators:exec` so the emulators auto
start/stop. Playwright's `webServer` runs `build && start` with the emulator
flag on.

**Fast smoke loop** (after each change) — assumes emulators + a dev server are
already running:
```bash
# terminal 1: emulators
npm run emulators
# terminal 2: seed once, then dev with the flag
npm run seed:emulator            # (needs the emulator host env vars; see note)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true npm run dev
# terminal 3: run only @smoke tests against the running dev server
npm run test:e2e:smoke
```
> Note: `seed:emulator` needs `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` and
> `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` in its environment. The simplest path
> is always `npm run test:e2e`, which sets these for you via `emulators:exec`.

## Adding tests
- Put a spec where its project's `testMatch` picks it up (see
  `playwright.config.ts`): `public.spec.ts`, `coach.spec.ts`, `trainee.spec.ts`,
  `nutrition-locked.spec.ts`.
- Prefer `page.getByTestId('...')` over Arabic-text/class selectors. Existing
  anchors: `clients-list`, `client-dashboard`, `meal-plan-table`,
  `meal-daily-total`, `nutrition-locked`, `exercise-accordion`,
  `schedule-status-card`.
- Tag fast checks with `@smoke` in the test title to include them in
  `test:e2e:smoke`.
- All routes are locale-prefixed (`/ar/...`); the middleware redirects
  unprefixed paths.
