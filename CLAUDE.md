# CLAUDE.md — Qwaam Project Brain

---

## ⚠️ CRITICAL PROTOCOL FOR CLAUDE CODE

**You must read this file before executing any task.**

Every single time you add a feature, refactor code, fix a bug, or change configuration, you **MUST update this file immediately** to document the change and keep this project memory 100% up-to-date. No exceptions.

---

## 0. Security & Git Hygiene

### Files That Must NEVER Be Committed
| File / Pattern | Reason |
|---------------|--------|
| `firebase-key.json`, `*.json.key` | Firebase service account private key — full Admin SDK access |
| `.env.local`, `.env.*.local`, `.env` | All secrets: Firebase config, Resend API key, Spoonacular key, etc. |
| `.claude/`, `.agent/` | AI session data, conversation history |

These are all listed in `.gitignore`. Before every commit, verify none of these are staged (`git status`).

### .gitignore Coverage (as of 2026-06-04)
- **Secrets:** `.env*`, `firebase-key.json`, `*.json.key`
- **Build/cache:** `.next/`, `out/`, `build/`, `.npm-cache/`, `tsconfig.tsbuildinfo`
- **AI tooling:** `.claude/`, `.agent/`
- **Reports/temp:** `lighthouse-report.json`, `*_REPORT.md`, `_bmad*/`
- **Dependencies:** `node_modules/`
- **OS/test:** `.DS_Store`, `Thumbs.db`, `playwright-report/`, `test-results/`

---

## 1. System Architecture Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 15.2.4 |
| UI Runtime | React | 19.1.0 |
| Language | TypeScript | 5.8.3 |
| Auth | Firebase Auth + Admin SDK (session cookies) | firebase 11.10 / firebase-admin 13.2 |
| Database | Firestore | via Firebase SDKs |
| Storage | Firebase Cloud Storage | via Firebase SDKs |
| Styling | Tailwind CSS v4 (CSS `@theme` config) | 4.1.3 |
| i18n | next-intl | 4.1.0 |
| Forms | react-hook-form + Zod | 7.72 / 4.3 |
| Email | Resend | 6.10 |
| Animation | Framer Motion | 12.38 |
| Charts | Recharts | 3.8 |
| Video | Zego Cloud UIKit | 2.17 |
| External API | Spoonacular (recipes) | REST |
| Build Bundler | Turbopack (dev) | — |

**Auth flow:** Firebase Auth (client) → POST `/api/auth/session` exchanges ID token for a 14-day HttpOnly session cookie (`qwaam_session`) → All server actions call `verifyAdminAccess()` / `verifyClientAccess()` which validate the session cookie via `verifySessionCookie()` and read the role from Firebase **Custom Claims** (`decodedClaims.role`). See section 7 for details.

**Required environment variables for deep-links:**
- `NEXT_PUBLIC_APP_URL` — **Must be set in production** (e.g. `https://qwaam.net`). Used in `requestPasswordReset` (`src/actions/client-actions.ts`) to build the password-reset deep-link embedded in the Resend email, and in the subscription-reminders cron to build the "renew" CTA link. Without it, the reset action falls back to deriving the host from Next.js `headers()` (can produce `http://localhost:3000`), and the cron email omits the CTA button.
- `CRON_SECRET` — **Must be set in production (Vercel env)**. Guards `GET /api/cron/subscription-reminders`. Vercel automatically attaches `Authorization: Bearer <CRON_SECRET>` to scheduled cron requests; the route rejects anything else with 401. Set it locally in `.env` too if invoking the route by hand.

---

## 2. Folder Directory Map

```
D:\Antigravity Qwaam\
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx                  # Root locale layout (next-intl provider)
│   │   │   ├── (public)/                   # Public routes (Navbar + Footer wrapper)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                # Home /
│   │   │   │   ├── packages/page.tsx       # /packages — Public pricing wizard
│   │   │   │   ├── classes/page.tsx        # /classes
│   │   │   │   ├── meals/page.tsx          # /meals
│   │   │   │   ├── science/page.tsx        # /science
│   │   │   │   ├── login/page.tsx          # /login
│   │   │   │   ├── onboarding/page.tsx     # /onboarding (multi-step signup)
│   │   │   │   └── reset-password/page.tsx
│   │   │   ├── client/                     # Trainee portal (auth-gated)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                # /client — Dashboard (Server Component)
│   │   │   │   ├── profile/page.tsx
│   │   │   │   └── profile/edit/page.tsx
│   │   │   ├── admin/                      # Coach dashboard (auth-gated)
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── trainees/page.tsx
│   │   │   │   ├── client/[id]/page.tsx    # Individual trainee detail
│   │   │   │   └── library/page.tsx
│   │   │   └── unauthorized/page.tsx
│   │   ├── api/
│   │   │   ├── auth/session/route.ts       # POST = create cookie, DELETE = logout
│   │   │   ├── setup-admin/route.ts        # Dev util (promote to coach)
│   │   │   └── sync-roles/route.ts         # Sync roles → custom claims
│   │   └── globals.css                     # Tailwind v4 @theme config (custom tokens)
│   ├── actions/                            # ALL server actions ('use server')
│   │   ├── admin-actions.ts
│   │   ├── client-actions.ts
│   │   ├── assignment-actions.ts
│   │   ├── progress-actions.ts
│   │   ├── meal-plan-actions.ts
│   │   ├── library-actions.ts
│   │   ├── onboarding-actions.ts
│   │   ├── spoonacular-actions.ts
│   │   ├── discount-actions.ts
│   │   └── notification-actions.ts
│   ├── components/
│   │   ├── admin/                          # Coach dashboard components
│   │   │   └── library/                   # MealPlanBuilder, MealSearch, etc.
│   │   ├── client/                         # Trainee portal components
│   │   ├── onboarding/                     # 6-step wizard components
│   │   │   └── ui/FormField.tsx
│   │   ├── pricing/PricingClient.tsx       # Public packages page wizard
│   │   ├── profile/                        # InfoCard, EditProfileForm, etc.
│   │   ├── layout/                         # Navbar, Footer, LanguageSwitcher
│   │   ├── home/HomeClient.tsx
│   │   ├── providers/FirebaseProvider.tsx
│   │   └── ui/                             # Button, Card, PasswordInput
│   ├── lib/
│   │   ├── firebase.ts                     # Client SDK init (auth, firestore, storage, App Check)
│   │   ├── firebase-admin.ts               # Admin SDK singleton
│   │   ├── auth-utils.ts                   # verifyAdminAccess / verifyClientAccess
│   │   ├── firestore-serialize.ts          # Timestamps → millis (safe for RSC→Client boundary)
│   │   ├── pricing-config.ts               # ★ SINGLE SOURCE OF TRUTH for all plans
│   │   ├── onboarding-schema.ts            # Zod schemas for each onboarding step
│   │   ├── notification-service.ts
│   │   ├── mail-service.ts
│   │   └── firestore-errors.ts
│   ├── types/index.ts                      # All domain interfaces (QwaamUser, Plan, RenewalRequest, …)
│   └── i18n/                               # next-intl navigation helpers
├── messages/
│   ├── ar.json                             # Arabic translations (primary)
│   └── en.json                             # English translations
├── firestore.rules                         # Firestore security rules
├── firestore.indexes.json                  # Composite indexes
├── CLAUDE.md                               # ← THIS FILE
└── package.json
```

---

## 3. Core Business Logic

### Session Tracking
The canonical shapes live in `src/types/index.ts` (`QwaamUser`). All Firestore
`Timestamp`s are serialized to millis (numbers) before they reach Client Components.

The trainee's `users/{uid}` document carries an optional `sessionTracking` field:
```ts
sessionTracking?: {
  totalSessions: number;
  remainingSessions: number;                 // stored directly (not derived)
  planStatus: 'active' | 'finished';
  lastRenewedAt?: number;                     // millis
}
```

The subscription lives **nested under `traineeData.subscription`** (not top-level):
```ts
traineeData.subscription?: {
  planId: string;
  amountPaid: string;
  dietAdded: boolean;
  status: 'pending_payment' | 'active' | 'expired' | 'cancelled';
  createdAt: string;                          // ISO string (set client-side at submit)
  activatedAt?: number;                       // millis — set by confirmTraineePayment
  paymentScreenshotUrl?: string;
  paymentScreenshotAt?: number;               // millis — set by updatePaymentScreenshot
  // ── Month-based Schedule plans (duration model) — see below ──
  billingModel?: 'session' | 'duration';      // 'duration' = month model; absent/'session' = legacy
  scheduleStartAt?: number | null;            // millis — day coach uploads schedule; null = awaiting
  scheduleEndsAt?: number | null;             // millis — addOneMonth(scheduleStartAt)
  renewalReminderSentAt?: number | null;      // millis — dedupes 7-day reminder; reset on renewal
} | null;
```
The `subscription.status` value drives the dashboard UI state (`pending_payment`
shows the PendingPaymentBanner; `active` shows normal content). For Live/legacy
plans, `planStatus` (`'finished'`) plus low `remainingSessions` drive
RenewalWizard visibility; for duration-model Schedule plans it's date-driven.

### Schedule plans: month-based duration model (Issue #1)
**Only Schedule plans (have `days`, no `sessions`) use this model. Live plans are
untouched and stay session-count based.** The single discriminator is
`isSchedulePlan(planId)` (`src/lib/pricing-config.ts`).

- **Duration = one calendar month** from a start anchor, computed by
  `addOneMonth()` (`src/lib/date-utils.ts`, Asia/Riyadh, clamps Jan 31 → Feb 28/29).
- **Start anchor = the day the coach uploads the schedule.** `assignWorkout`
  sets `scheduleStartAt=now` + `scheduleEndsAt=addOneMonth(now)` **once** — the
  first time it runs for a duration-model trainee whose `scheduleStartAt` is null.
  Never re-anchored on later assignments/edits.
- **Marker `billingModel='duration'`** is stamped by `confirmTraineePayment`,
  `submitOnboarding` (schedule branch), and `renewTraineePlan` (schedule branch).
  On these paths `sessionTracking` is zeroed (sessions not tracked).
- **Grandfather (no migration):** legacy schedule subs have no `billingModel` →
  keep their old session-count UI/behavior until they renew, at which point
  `renewTraineePlan`/`confirmTraineePayment` move them onto the duration model.
- **`planStatus`/`status`:** computed-on-load in the dashboard; the daily cron
  (`/api/cron/subscription-reminders`) persists `planStatus='finished'` +
  `subscription.status='expired'` once `now >= scheduleEndsAt`.
- **Client UI** (`client/page.tsx`) branches by `billingModel==='duration'`:
  `ScheduleStatusCard` (awaiting-upload / active period + progress + motivation)
  replaces the session widget; `ScheduleAlert` replaces `SessionAlert` with a
  date-based 7-day reminder / ended banner. Copy lives in the `schedule` i18n
  namespace (`messages/ar.json` + `en.json`), dates formatted in Asia/Riyadh.

### Renewal Request Flow
1. Trainee opens **RenewalWizard** (`src/components/client/RenewalWizard.tsx`)
2. Selects location → plan type → specific plan (Step 1)
3. Views InstaPay payment details (Step 2) — **InstaPay only**
4. Uploads proof screenshot via `PhotoUpload` (Step 3)
5. Clicks Submit → calls `createRenewalRequest(planId, proofUrl)` server action
6. Action writes to `renewal_requests` collection + sets `subscription.status = 'pending_payment'` on user doc
7. Coach approves in admin dashboard → `confirmTraineePayment()` action activates subscription + marks `renewal_request` as `fulfilled`

### RenewalWizard Visibility Rule (client/page.tsx)
**Live / legacy session model** (session-count driven):
```tsx
{(planStatus === 'finished' || remainingSessions <= 2) && !isPendingPayment && (
  <RenewalWizard uid={trainee.uid} />
)}
```
**Duration-model Schedule plans** (date driven): the RenewalWizard is rendered
inside `ScheduleStatusCard` when the period is ending (`0 < scheduleEndsAt - now
<= 7 days`) or ended (`now >= scheduleEndsAt`), never on `remainingSessions`.

### SessionAlert Visibility Rule
```tsx
{sessionsRemaining <= 2 && !isPendingPayment && (
  <SessionAlert sessionsRemaining={sessionsRemaining} />
)}
```
`SessionAlert` is purely informational — no server actions, no CTA buttons. It only points users to the RenewalWizard below.

---

## 4. Pricing Rules — COMPLETE BREAKDOWN

All plans defined in `src/lib/pricing-config.ts`. **This is the single source of truth.**

Payment method (in `RenewalWizard.tsx`): **InstaPay only**
- InstaPay: `01001280161`

Nutrition add-on (in `PricingClient.tsx` public wizard only): **+200 EGP** (`NUTRITION_ADDON_PRICE`)

> **Billing model note:** `sessions` (Live) and `days` (Schedule) still define the plans below, but **Schedule plans are billed as one calendar month** (duration model — see §3), not as a session count. The `days` value now means "training days per week" only; it is no longer consumed as a session budget.

### HOME + LIVE (video call sessions per month)
| Plan ID | Sessions | Price (EGP) | Popular |
|---------|----------|-------------|---------|
| `home-live-8` | 8 | 550 | — |
| `home-live-12` | 12 | 780 | — |
| `home-live-16` | 16 | 1000 | ⭐ Yes |
| `home-live-20` | 20 | 1200 | — |

### HOME + SCHEDULE (workout plan days per week)
| Plan ID | Days/Week | Price (EGP) | Popular |
|---------|-----------|-------------|---------|
| `home-sched-2` | 2 | 300 | — |
| `home-sched-3` | 3 | 330 | — |
| `home-sched-4` | 4 | 350 | ⭐ Yes |
| `home-sched-5` | 5 | 370 | — |
| `home-sched-7` | **6** | 400 | — |

⚠️ **Note:** `home-sched-7` has `days: 6` (not 7). The ID was kept as `-7` for Firestore backward compatibility with existing subscriptions.

### GYM + LIVE (video call sessions per month)
| Plan ID | Sessions | Price (EGP) | Popular |
|---------|----------|-------------|---------|
| `gym-live-8` | 8 | 450 | — |
| `gym-live-12` | 12 | 630 | — |
| `gym-live-16` | 16 | 800 | ⭐ Yes |
| `gym-live-20` | 20 | 950 | — |

### GYM + SCHEDULE (workout plan days per week)
| Plan ID | Days/Week | Price (EGP) | Popular |
|---------|-----------|-------------|---------|
| `gym-sched-2` | 2 | 200 | — |
| `gym-sched-3` | 3 | 230 | — |
| `gym-sched-4` | 4 | 250 | ⭐ Yes |
| `gym-sched-5` | 5 | 270 | — |
| `gym-sched-7` | **6** | 300 | — |

⚠️ **Note:** Same as home — `gym-sched-7` has `days: 6`. ID kept for backward compatibility.

---

## 5. Layout Design Standards

### Custom Color Tokens (defined in `src/app/globals.css` via `@theme`)
```css
--color-qwaam-pink: #EC4899          /* Primary buttons, active states, accents */
--color-qwaam-pink-light: #FDF2F8    /* Soft backgrounds, selected card fills */
--color-qwaam-yellow: #FBBF24        /* Badges, highlights, popular markers */
--color-text-main: #111827           /* Primary body text */
--color-text-muted: #4B5563          /* Secondary / placeholder text */
--color-border-light: #F3F4F6        /* Card borders, dividers */
```
**Font:** Cairo (Arabic-optimized), loaded via Google Fonts.

### RTL Layout
All user-facing UI is `dir="rtl"` by default. Arabic is the primary language. Use `dir="ltr"` only for phone numbers, prices, and numeric data.

### Responsive Grid Standard (RenewalWizard — inline wizard widget)
```tsx
// 4 plans (live): 1 perfect row on sm+
<div className="grid gap-3 grid-cols-2 sm:grid-cols-4">

// 5 plans (schedule): 1 perfect row on lg+, 2-col on mobile
<div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">

// Last odd card centering (5-plan case):
// col-span-2 w-[calc(50%-6px)] mx-auto sm:col-span-4 sm:w-[calc(25%-9px)] lg:col-span-1 lg:w-auto lg:mx-0
```

### Responsive Grid Standard (PricingClient — public /packages page)
```tsx
// Wrapper: container mx-auto px-6 max-w-3xl
// Step 3 plan cards (supports both 4 and 5 plans):
<div className="flex flex-wrap justify-center gap-6">
  {plans.map((plan) => (
    <div className="min-w-[150px] flex-1 max-w-[200px]">
      <PlanCard ... />
    </div>
  ))}
</div>
```

### Button Classes
- Primary CTA: `bg-qwaam-pink hover:bg-pink-600 text-white font-black rounded-xl py-3 transition-all`
- Secondary/Back: `bg-white border border-border-light text-text-muted hover:bg-gray-100 font-black rounded-xl`
- Disabled: `disabled:opacity-40 disabled:cursor-not-allowed`

### Card/Section Containers
- Widget cards: `bg-gray-50 border border-border-light rounded-2xl`
- Inner highlight cards: `bg-qwaam-pink-light border border-qwaam-pink/20 rounded-xl p-4`
- White info cards: `bg-white border border-border-light rounded-xl p-3`

### Step Indicator (RenewalWizard)
3-column `grid grid-cols-3 border-b border-border-light` bar:
- Active step: `bg-qwaam-pink text-white`
- Completed step: `bg-green-50 text-green-700` with `✓` prefix
- Future step: `bg-white text-text-muted`

---

## 6. Firestore Collections Reference

| Collection | Key Fields | Security |
|-----------|-----------|---------|
| `users` | uid, role, email, name, sessionTracking, traineeData, subscription, renewalRequest, activeRoomUrl | Self or owning coach |
| `renewal_requests` | traineeUid, planId, amount, proofUrl, status (`pending`\|`fulfilled`), createdAt | — (server-side write only) |
| `messages` | chatId (`coachUid_traineeUid`), senderId, receiverId, text, timestamp | Participants only |
| `exercises` | nameAr, nameEn, targetMuscle, equipment, videoUrl, defaults | Read: any authed; Write: coach |
| `workouts` | titleAr/En, difficulty, duration, exercises[] | Read: any authed; Write: coach |
| `meals` | nameAr/En, type, calories, macros, recipe, imageUrl | Read: any authed; Write: coach |
| `custom_meals` | title, calories, macros, sourceUrl, savedByCoachUid | Read: any authed; Write: owner coach |
| `meal_plans` | coachUid, assignedTo, name, days[], totalCalories | Coach or assigned trainee |
| `progress_logs` | traineeUid, itemId, type, date, status | Trainee or assigned coach |
| `trainee_progress` | traineeUid, date, weight, bodyFat, measurements, photos | Trainee or assigned coach |
| `session_logs` | traineeUid, action, oldValue, newValue, changedBy | Read: trainee+coach; Write: Admin SDK only |
| `discount_leads` | email, phone, discountPercentage, createdAt | Server-side write only |

**Composite Indexes** (`firestore.indexes.json`):
- `renewal_requests`: traineeUid ASC + status ASC
- `users`: role ASC + `traineeData.subscription.billingModel` ASC + `traineeData.subscription.scheduleEndsAt` ASC — powers the subscription-reminders cron query (no full-collection scan)

---

## 7. Server Action Auth Pattern

Every server action must start with one of these guards:
```ts
// Coach/Admin routes:
const { uid } = await verifyAdminAccess();

// Trainee routes:
const { uid } = await verifyClientAccess();
```
Both functions (in `src/lib/auth-utils.ts`) read the `qwaam_session` HttpOnly
cookie and validate it via `getAdminAuth().verifySessionCookie(cookie, true)`.
**The role check is done against Firebase Custom Claims** — `decodedClaims.role`
(`'coach'`/`'admin'` for `verifyAdminAccess`, `'trainee'` for `verifyClientAccess`).
They throw if the cookie is missing/expired or the claim doesn't match.

Firestore is used **only as a fallback / self-heal path**, never as the primary
source of the role:
- `verifyClientAccess`: if the claim isn't `trainee`, it checks whether a `users/{uid}`
  doc exists and, if so, re-sets the `trainee` custom claim (auto-heal) rather than
  rejecting outright.
- `POST /api/auth/session`: on login it reads `users/{uid}.role` as the source of
  truth and silently re-syncs the custom claim if it drifted, so subsequent
  `verifySessionCookie` calls see the correct claim.

---

## 8. Change Log

| Date | Change | Files Modified |
|------|--------|---------------|
| 2026-06-04 | Added `step="0.1"` to weight inputs | `StepBody.tsx`, `EditProfileForm.tsx` |
| 2026-06-04 | Added missing `profile.isPregnant` / `profile.isNursing` translation keys | `ar.json`, `en.json` |
| 2026-06-04 | Built full 3-step `RenewalWizard` with plan selection, payment details, proof upload | `RenewalWizard.tsx` (new), `client-actions.ts`, `admin-actions.ts`, `client/page.tsx` |
| 2026-06-04 | Added `createRenewalRequest` server action; removed auto-trigger actions | `client-actions.ts` |
| 2026-06-04 | `SessionAlert` stripped of all server actions — informational only | `SessionAlert.tsx` |
| 2026-06-04 | Added 4-day plans (350 EGP) to home+gym schedule; renamed 7-day → 6-day label (ID unchanged) | `pricing-config.ts` |
| 2026-06-04 | Fixed "ألفي العجلة" → "لفي العجلة" typo in public pricing | `PricingClient.tsx` |
| 2026-06-04 | Fixed RenewalWizard plan card grid: symmetrical responsive layout with per-breakpoint col math | `RenewalWizard.tsx` |
| 2026-06-04 | Added CLAUDE.md (this file); fixed PricingClient Step 3 grid for 5-plan support | `CLAUDE.md` (new), `PricingClient.tsx` |
| 2026-06-04 | Fix password-reset email URL: use `NEXT_PUBLIC_APP_URL` env var (headers fallback) instead of hardcoded localhost | `client-actions.ts`, `CLAUDE.md` |
| 2026-06-04 | Security audit: hardened `.gitignore` (added `.agent/`, `tsconfig.tsbuildinfo`, `.npm-cache/`, `*_REPORT.md`, `_bmad*/`, `lighthouse-report.json`); documented security rules in CLAUDE.md | `.gitignore`, `CLAUDE.md` |
| 2026-06-15 | Docs reconcile: fixed session cookie name (`qwaam_session`), rewrote §7 auth to Custom-Claims-first (Firestore fallback only), regenerated §4 pricing tables from `pricing-config.ts` (gym-sched-4 = 250; popular flags → sched-4 not sched-5), rewrote §3 `sessionTracking`/`subscription` shapes to match `types/index.ts`, switched payment refs to InstaPay-only | `CLAUDE.md`, `STATE.md` |
| 2026-06-15 | Completed InstaPay-only refactor in user-facing copy: dropped "Vodafone Cash / محفظة إلكترونية / e-wallet" from `transferInstruction` (ar+en) and PendingPaymentBanner | `ar.json`, `en.json`, `PendingPaymentBanner.tsx` |
| 2026-06-15 | Removed leftover debug `console.log("Busting Vercel Cache - v2")` from session route | `api/auth/session/route.ts` |
| 2026-07-08 | **Issue #1** — Schedule plans moved to month-based (duration) model. Added `billingModel`/`scheduleStartAt`/`scheduleEndsAt`/`renewalReminderSentAt` to subscription; `isSchedulePlan` helper + `date-utils.ts` (`addOneMonth`, `formatDateRiyadh`, Asia/Riyadh). Live plans untouched. | `types/index.ts`, `pricing-config.ts`, `date-utils.ts` (new) |
| 2026-07-08 | Lifecycle: `confirmTraineePayment`/`submitOnboarding`/`renewTraineePlan` branch schedule → duration setup (no more `remainingSessions=plan.days`); `assignWorkout` anchors `scheduleStartAt` once on first upload | `admin-actions.ts`, `client-actions.ts`, `assignment-actions.ts` |
| 2026-07-08 | Client UI: `ScheduleStatusCard` + `ScheduleAlert` (date-based) replace session widget/alert for duration plans; new `schedule` i18n namespace (ar+en) | `client/page.tsx`, `ScheduleStatusCard.tsx` (new), `ScheduleAlert.tsx` (new), `ar.json`, `en.json` |
| 2026-07-08 | Vercel Cron `/api/cron/subscription-reminders` (CRON_SECRET-guarded): 7-day reminder email + expiry flip; `RenewalReminderTemplate`; users composite index; `vercel.json` | `vercel.json` (new), `api/cron/subscription-reminders/route.ts` (new), `RenewalReminderTemplate.tsx` (new), `firestore.indexes.json` |
| 2026-07-08 | Coach "awaiting schedule" indicator: derived-state badge for trainees who paid + activated a month plan but have no schedule uploaded (`billingModel='duration'` + `status='active'` + `scheduleStartAt` null). Shown in trainees list + AssignmentsTab header. New `isAwaitingScheduleUpload` helper + `coach` i18n namespace (ar+en). Read-only, no new data model. | `subscription-utils.ts` (new), `ClientsList.tsx`, `AssignmentsTab.tsx`, `TraineeTabsWrapper.tsx`, `admin/client/[id]/page.tsx`, `ar.json`, `en.json` |
